#!/usr/bin/env python3
"""Periodically check StellaSoraData upstream for changes and refresh game data.

Compares the raw upstream files' sha256 against a local state file. If any
changed, re-runs fetch-slim.py, commits data/, and pushes to origin.

Auth for pushing: $GITHUB_TOKEN env var, or ~/.nebula-github-token (chmod 600).

Usage:
  python3 scripts/auto-update.py          # check, refetch, commit, push
  python3 scripts/auto-update.py --check  # report only, make no changes
"""
import hashlib
import json
import os
import subprocess
import sys
import urllib.request

REPO = 'https://github.com/MorphTheMoth/Nebula-Record-Builder.git'
BASE_RAW = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/main/'
SOURCES = [
    'character.json',
    'disc.json',
    'characterid.json',
    'EN/bin/CharGemAttrValue.json',
    'EN/language/en_US/Item.json',
]

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
STATE_FILE = os.path.join(SCRIPT_DIR, '.fetch-state.json')
TOKEN_FILE = os.path.expanduser('~/.nebula-github-token')


def git(*args, check=True):
    return subprocess.run(['git', *args], cwd=ROOT, check=check,
                          capture_output=True, text=True)


def fetch_sha(path):
    with urllib.request.urlopen(BASE_RAW + path) as resp:
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


def main():
    check_only = '--check' in sys.argv
    os.chdir(ROOT)

    # Always sync with GitHub first, so we don't diverge and --check is accurate.
    # Don't abort the whole run if sync fails, but warn clearly.
    if not sync_with_origin():
        print('[auto-update] warning: could not sync with origin/main, continuing anyway.')

    prev = {}
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            prev = json.load(f)

    changed = []
    for path in SOURCES:
        try:
            sha = fetch_sha(path)
        except Exception as exc:
            print(f'[auto-update] failed to check {path}: {exc}')
            continue
        if prev.get(path) != sha:
            changed.append(path)
        prev[path] = sha

    has_data_changed = bool(changed)
    if has_data_changed:
        print(f'[auto-update] changed upstream: {", ".join(changed)}')
    else:
        print('[auto-update] no upstream changes.')

    if check_only:
        if has_data_changed:
            print('[auto-update] --check mode: would fetch slim data.')
        else:
            print('[auto-update] --check mode: no data changes.')
        print('[auto-update] --check: probing head images...')
        try:
            subprocess.call(
                [sys.executable, os.path.join(SCRIPT_DIR, 'fetch-heads.py'), '--check'])
        except Exception as e:
            print(f'[auto-update] fetch-heads --check failed: {e}')
        print('[auto-update] --check mode: nothing fetched or committed.')
        return

    # Fetch slim data only if StellaSoraData changed; heads are always refreshed
    # so ssassets-only additions (e.g. head_12003_XL.webp) are detected.
    if has_data_changed:
        subprocess.check_call(
            [sys.executable, os.path.join(SCRIPT_DIR, 'fetch-slim.py')])

    # Refresh local _XL head images (trimmed) — cheap if already cached:
    # fetch-heads.py skips existing files without network (continue), only
    # the first missing variant per char triggers a GET (404 -> break, 200 -> download).
    try:
        print('[auto-update] refreshing head images...')
        subprocess.check_call(
            [sys.executable, os.path.join(SCRIPT_DIR, 'fetch-heads.py')])
    except subprocess.CalledProcessError as e:
        print(f'[auto-update] fetch-heads failed (continuing): {e}')
    except Exception as e:
        print(f'[auto-update] fetch-heads error (continuing): {e}')

    # Persist updated hashes only if data actually changed.
    if has_data_changed:
        with open(STATE_FILE, 'w') as f:
            json.dump(prev, f, indent=2, sort_keys=True)
            f.write('\n')

    git('add', 'data')
    # Also commit the state file so clones stay in sync. Force-add in case
    # .gitignore ignores it (pattern .fetch-state.json matches any dir).
    if has_data_changed:
        git('add', '-f', os.path.join('scripts', '.fetch-state.json'), check=False)
    # Track auto-update runner and heads fetcher
    if os.path.exists(os.path.join(SCRIPT_DIR, 'auto-update.py')):
        git('add', '-f', os.path.join('scripts', 'auto-update.py'), check=False)
    if os.path.exists(os.path.join(SCRIPT_DIR, 'fetch-heads.py')):
        git('add', '-f', os.path.join('scripts', 'fetch-heads.py'), check=False)
    staged = git('diff', '--cached', '--name-only')
    staged_files = staged.stdout.strip()
    if not staged_files:
        if has_data_changed:
            print('[auto-update] no data changes after slim; nothing to commit.')
        else:
            print('[auto-update] no head image changes; nothing to commit.')
        return

    # Choose commit message based on what is staged.
    has_heads_in_staged = any('data/heads' in line for line in staged_files.splitlines())
    if has_data_changed and has_heads_in_staged:
        commit_msg = 'Update game data and head images from upstream'
    elif has_data_changed:
        commit_msg = 'Update game data from upstream StellaSoraData'
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