#!/usr/bin/env python3
"""Periodically check MakoStar/ss-data upstream and refresh game data.

Builds data/ directly from https://github.com/MakoStar/ss-data via
scripts/build-from-ssdata.py (local node parsers vendored from the AutumnVN
repo under scripts/parsers/), instead of waiting on the AutumnVN
StellaSoraData mirror to re-publish parsed files.

Change detection uses the ss-data HEAD commit SHA (`git ls-remote`), stored
in scripts/.fetch-state.json. If HEAD moved, the full parse+slim pipeline
runs. Head images still come from AutumnVN/ssassets (ss-data ships no
image assets), and are refreshed every run.

If the ss-data build fails (e.g. a network blip fetching ss-lua), this run
does nothing to data/ and retries on the next cycle.

Auth for pushing: $GITHUB_TOKEN env var, or ~/.nebula-github-token (chmod 600).

Usage:
  python3 scripts/auto-update.py          # check, rebuild, commit, push
  python3 scripts/auto-update.py --check  # report only, make no changes
  python3 scripts/auto-update.py --heads  # force head image sweep even if
                                          # ssassets HEAD is unchanged
"""
import hashlib
import json
import os
import subprocess
import sys
import urllib.request

REPO = 'https://github.com/MorphTheMoth/Nebula-Record-Builder.git'
SSDATA_GIT_URL = 'https://github.com/MakoStar/ss-data.git'
SSDATA_API_COMMIT = 'https://api.github.com/repos/MakoStar/ss-data/commits/main'
SSASSETS_GIT_URL = 'https://github.com/AutumnVN/ssassets.git'
SSASSETS_API_COMMIT = 'https://api.github.com/repos/AutumnVN/ssassets/commits/main'
# Legacy fallback sources (parsed files only exist on the mirror).
LEGACY_RAW = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/main/'
LEGACY_SOURCES = [
    'character.json',
    'disc.json',
    'characterid.json',
]

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
STATE_FILE = os.path.join(SCRIPT_DIR, '.fetch-state.json')
TOKEN_FILE = os.path.expanduser('~/.nebula-github-token')


def git(*args, check=True):
    return subprocess.run(['git', *args], cwd=ROOT, check=check,
                          capture_output=True, text=True)


def remote_head_sha(git_url, api_commit_url, label):
    """Resolve a repo's main HEAD without a full clone. Tries ls-remote, then API."""
    try:
        out = subprocess.run(['git', 'ls-remote', git_url, 'HEAD'],
                             capture_output=True, text=True, timeout=30)
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.strip().split()[0]
    except Exception as exc:
        print(f'[auto-update] git ls-remote ({label}) failed: {exc}')
    try:
        req = urllib.request.Request(
            api_commit_url, headers={'User-Agent': 'nebula-auto-update/1.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)['sha']
    except Exception as exc:
        print(f'[auto-update] {label} API check failed: {exc}')
    return None


def ssdata_head_sha():
    return remote_head_sha(SSDATA_GIT_URL, SSDATA_API_COMMIT, 'ss-data')


def ssassets_head_sha():
    return remote_head_sha(SSASSETS_GIT_URL, SSASSETS_API_COMMIT, 'ssassets')


def fetch_sha(path):
    with urllib.request.urlopen(LEGACY_RAW + path, timeout=30) as resp:
        return hashlib.sha256(resp.read()).hexdigest()


def load_token():
    token = os.environ.get('GITHUB_TOKEN')
    if not token and os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE) as f:
            token = f.read().strip()
    return token


def sync_with_origin():
    """Fetch and rebase onto origin/main so local never diverges.

    Handles dirty working tree (e.g. modified .fetch-state.json) by stashing
    before rebase and restoring afterwards. Returns True on success.
    """
    try:
        print('[auto-update] fetching origin...')
        fetch = git('fetch', 'origin', check=False)
        if fetch.returncode != 0:
            print(f'[auto-update] git fetch failed: {fetch.stderr.strip()}')
            return False

        # Stash dirty state so rebase can proceed. Use --keep-index to
        # keep staged changes if any, and stash untracked only if needed.
        dirty = git('status', '--porcelain', check=False).stdout.strip()
        stashed = False
        if dirty:
            # stash everything that would block rebase (modified state file, etc.)
            # Don't use --include-untracked: untracked files like a not-yet-tracked
            # auto-update.py don't block rebase and stashing them would delete the
            # running script mid-execution.
            stash = git('stash', 'push', '-m', 'auto-update pre-pull stash', check=False)
            # git stash push returns 0 even if nothing stashed; check stash list
            stash_list = git('stash', 'list', check=False).stdout
            if 'auto-update pre-pull stash' in stash_list:
                stashed = True
                print('[auto-update] stashed local changes before pull.')

        pull = git('pull', '--rebase', 'origin', 'main', check=False)
        if pull.returncode != 0:
            print('[auto-update] git pull --rebase failed:')
            if pull.stdout.strip():
                print(pull.stdout.strip())
            if pull.stderr.strip():
                print(pull.stderr.strip())
            git('rebase', '--abort', check=False)
            if stashed:
                git('stash', 'pop', check=False)
            return False

        if stashed:
            pop = git('stash', 'pop', check=False)
            if pop.returncode != 0:
                print('[auto-update] stash pop had conflicts:')
                if pop.stdout.strip():
                    print(pop.stdout.strip())
                if pop.stderr.strip():
                    print(pop.stderr.strip())
                # try to recover: reset and drop stash
                git('reset', '--hard', check=False)
                git('stash', 'drop', check=False)
            else:
                print('[auto-update] restored stashed changes.')

        # Show where we are after sync
        try:
            head = git('rev-parse', '--short', 'HEAD').stdout.strip()
            origin = git('rev-parse', '--short', 'origin/main').stdout.strip()
            print(f'[auto-update] synced: HEAD {head} origin/main {origin}')
        except Exception:
            pass
        return True
    except Exception as exc:
        print(f'[auto-update] sync with origin failed: {exc}')
        return False


def rebuild_from_ssdata():
    """Run the ss-data parse+slim pipeline. Returns True on success."""
    try:
        subprocess.check_call(
            [sys.executable, os.path.join(SCRIPT_DIR, 'build-from-ssdata.py')])
        return True
    except subprocess.CalledProcessError as exc:
        print(f'[auto-update] build-from-ssdata failed: {exc}')
    except Exception as exc:
        print(f'[auto-update] build-from-ssdata error: {exc}')
    return False


def main():
    check_only = '--check' in sys.argv
    force_heads = '--heads' in sys.argv
    os.chdir(ROOT)

    # Always sync with GitHub first, so we don't diverge and --check is accurate.
    # Don't abort the whole run if sync fails, but warn clearly.
    if not sync_with_origin():
        print('[auto-update] warning: could not sync with origin/main, continuing anyway.')

    prev = {}
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE) as f:
                prev = json.load(f)
        except Exception:
            prev = {}

    new_data_sha = ssdata_head_sha()
    if new_data_sha is None:
        print('[auto-update] could not resolve ss-data HEAD; '
              'data rebuild skipped this run.')
        has_data_changed = False
    elif prev.get('ss-data') != new_data_sha:
        print(f'[auto-update] ss-data moved: '
              f'{str(prev.get("ss-data", "(unknown)"))[:12]} -> {new_data_sha[:12]}')
        has_data_changed = True
    else:
        print(f'[auto-update] ss-data unchanged at {new_data_sha[:12]}.')
        has_data_changed = False

    # Heads (~40 probes per sweep) are gated the same way: a single
    # ls-remote on ssassets decides whether the per-character sweep runs.
    new_heads_sha = ssassets_head_sha()
    if new_heads_sha is None:
        print('[auto-update] could not resolve ssassets HEAD; '
              'head images skipped this run.')
        has_heads_changed = False
    elif force_heads or prev.get('ssassets') != new_heads_sha:
        if force_heads and prev.get('ssassets') == new_heads_sha:
            print('[auto-update] --heads: forcing head image refresh.')
        else:
            print(f'[auto-update] ssassets moved: '
                  f'{str(prev.get("ssassets", "(unknown)"))[:12]} -> {new_heads_sha[:12]}')
        has_heads_changed = True
    else:
        print(f'[auto-update] ssassets unchanged at {new_heads_sha[:12]}; '
              f'skipping head image sweep.')
        has_heads_changed = False

    if check_only:
        if has_data_changed:
            print('[auto-update] --check mode: would rebuild from ss-data.')
        else:
            print('[auto-update] --check mode: no data changes.')
        if has_heads_changed:
            print('[auto-update] --check mode: would refresh head images.')
        else:
            print('[auto-update] --check mode: no head image changes.')
        print('[auto-update] --check mode: nothing fetched or committed.')
        return

    # Rebuild game data only if ss-data moved; heads refresh only if
    # ssassets moved. A failed build does nothing -- next cycle retries.
    build_ok = False
    if has_data_changed:
        build_ok = rebuild_from_ssdata()
        if build_ok:
            prev['ss-data'] = new_data_sha
        else:
            print('[auto-update] data rebuild failed; leaving data/ untouched, '
                  'will retry next cycle.')

    # Refresh local _XL head images (trimmed) — only when ssassets moved.
    # fetch-heads.py skips existing files without network (continue), only
    # the first missing variant per char triggers a GET (404 -> break, 200 -> download).
    # NOTE: heads still come from AutumnVN/ssassets — ss-data ships no image assets.
    heads_ok = False
    if has_heads_changed:
        try:
            print('[auto-update] refreshing head images...')
            subprocess.check_call(
                [sys.executable, os.path.join(SCRIPT_DIR, 'fetch-heads.py')])
            heads_ok = True
            prev['ssassets'] = new_heads_sha
        except subprocess.CalledProcessError as e:
            print(f'[auto-update] fetch-heads failed (continuing): {e}')
        except Exception as e:
            print(f'[auto-update] fetch-heads error (continuing): {e}')

    # Persist updated state for whichever parts actually succeeded.
    if (has_data_changed and build_ok) or (has_heads_changed and heads_ok):
        with open(STATE_FILE, 'w') as f:
            json.dump(prev, f, indent=2, sort_keys=True)
            f.write('\n')

    git('add', 'data')
    # Also commit the state file so clones stay in sync. Force-add in case
    # .gitignore ignores it (pattern .fetch-state.json matches any dir).
    if (has_data_changed and build_ok) or (has_heads_changed and heads_ok):
        git('add', '-f', os.path.join('scripts', '.fetch-state.json'), check=False)
    # Track runner + pipeline scripts
    for name in ('auto-update.py', 'fetch-heads.py', 'fetch-slim.py',
                 'build-from-ssdata.py'):
        if os.path.exists(os.path.join(SCRIPT_DIR, name)):
            git('add', '-f', os.path.join('scripts', name), check=False)
    # Track vendored parsers (may be gitignored via scripts/parsers rules).
    if os.path.isdir(os.path.join(SCRIPT_DIR, 'parsers')):
        git('add', '-f', os.path.join('scripts', 'parsers'), check=False)
    staged = git('diff', '--cached', '--name-only')
    staged_files = staged.stdout.strip()
    if not staged_files:
        if has_data_changed and not build_ok:
            print('[auto-update] data build failed; nothing to commit.')
        elif has_data_changed:
            print('[auto-update] no data changes after rebuild; nothing to commit.')
        else:
            print('[auto-update] no head image changes; nothing to commit.')
        return

    # Choose commit message based on what is staged.
    has_heads_in_staged = any('data/heads' in line for line in staged_files.splitlines())
    data_ok = has_data_changed and build_ok
    if data_ok and has_heads_in_staged:
        commit_msg = 'Update game data (ss-data) and head images from upstream'
    elif data_ok:
        commit_msg = f'Update game data from upstream ss-data {new_data_sha[:12]}'
    else:
        commit_msg = 'Update head images from ssassets'

    git('commit', '-m', commit_msg)

    token = load_token()
    if not token:
        print('[auto-update] no token found; commit made but NOT pushed.')
        print(f'           set $GITHUB_TOKEN or create {TOKEN_FILE} and run again.')
        return

    push_url = f'https://MorphTheMoth:{token}@{REPO.split("//", 1)[1]}'
    git('push', push_url, 'HEAD:main')
    print('[auto-update] committed and pushed.')


if __name__ == '__main__':
    main()
