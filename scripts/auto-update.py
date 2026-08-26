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

    if not changed:
        print('[auto-update] no upstream changes.')
        return

    print(f'[auto-update] changed upstream: {", ".join(changed)}')

    if check_only:
        print('[auto-update] --check mode: nothing fetched or committed.')
        return

    subprocess.check_call(
        [sys.executable, os.path.join(SCRIPT_DIR, 'fetch-slim.py')])
    with open(STATE_FILE, 'w') as f:
        json.dump(prev, f, indent=2, sort_keys=True)
        f.write('\n')

    git('add', 'data')
    # Also commit the state file so clones stay in sync. Force-add in case
    # .gitignore ignores it (pattern .fetch-state.json matches any dir).
    git('add', '-f', os.path.join('scripts', '.fetch-state.json'), check=False)
    # If this script itself was previously untracked, track it too
    if os.path.exists(os.path.join(SCRIPT_DIR, 'auto-update.py')):
        git('add', '-f', os.path.join('scripts', 'auto-update.py'), check=False)
    staged = git('diff', '--cached', '--name-only')
    if not staged.stdout.strip():
        print('[auto-update] no data changes after slim; nothing to commit.')
        return

    git('commit', '-m', 'Update game data from upstream StellaSoraData')

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