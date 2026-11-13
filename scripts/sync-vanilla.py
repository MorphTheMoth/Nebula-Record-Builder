#!/usr/bin/env python3
"""Mirror this repo into MorphTheMoth/Record-Builder (the vanilla site).

Record-Builder is this project with the Nebula-only UI switched off and its own
README. It used to be kept in sync by the `Sync from upstream` GitHub Action,
which merged upstream/main every 15 minutes: conflict-prone, produced a merge
commit per cycle, and burned Actions minutes. This script replaces it and runs
from the same auto-update cycle on the Raspberry Pi.

Sync model: build the vanilla tree from upstream's tree, then re-apply the two
local deltas and drop .github. One linear commit on top of Record-Builder's main,
pushed only when the tree actually differs.

  * index.html -> upstream's, with VANILLA_MODE flipped to true and the title
    string set back to the vanilla one
  * README.md  -> Record-Builder's own (never overwritten)
  * .github/   -> absent, so the old workflow is removed by the first sync

Usage:
  python3 scripts/sync-vanilla.py            # sync and push (needs a token)
  python3 scripts/sync-vanilla.py --dry-run  # report the diff, change nothing
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

VANILLA_REPO = 'https://github.com/MorphTheMoth/Record-Builder.git'
UPSTREAM_REPO = 'https://github.com/MorphTheMoth/Nebula-Record-Builder.git'

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
WORKDIR = os.path.join(SCRIPT_DIR, '.vanilla-work')
TOKEN_FILE = os.path.expanduser('~/.nebula-github-token')

# Local deltas that make the tree "vanilla". Both must be found, or the sync
# aborts: a silent miss would publish the Nebula build to the vanilla site.
VANILLA_MODE_FROM = 'const VANILLA_MODE = false;'
VANILLA_MODE_TO = 'const VANILLA_MODE = true;'
TITLE_FROM = '<title>Nebula Record Builder</title>'
TITLE_TO = '<title>Stellla Sora Record Builder</title>'

AUTHOR_NAME = 'MorphTheMoth'
AUTHOR_EMAIL = '36893247+MorphTheMoth@users.noreply.github.com'


def git(*args, cwd=WORKDIR, check=True, env=None):
    return subprocess.run(['git', *args], cwd=cwd, check=check,
                          capture_output=True, text=True, env=env)


def ensure_workdir():
    """Clone once (no checkout: the sync only touches the index), then fetch."""
    if os.path.isdir(os.path.join(WORKDIR, '.git')):
        git('fetch', '--prune', 'origin', '+refs/heads/main:refs/remotes/origin/main')
        return
    if os.path.exists(WORKDIR):
        shutil.rmtree(WORKDIR)
    print(f'[vanilla] cloning {VANILLA_REPO} (no checkout)...')
    git('clone', '--no-checkout', '--quiet', VANILLA_REPO, WORKDIR, cwd=ROOT)


def fetch_upstream():
    """Fetch the Nebula repo and return the sha of its main."""
    git('fetch', '--quiet', UPSTREAM_REPO,
        '+refs/heads/main:refs/remotes/upstream/main')
    return git('rev-parse', 'refs/remotes/upstream/main').stdout.strip()


def patch_index_html(text):
    """Return upstream's index.html reverted to the vanilla variant."""
    missing = [needle for needle in (VANILLA_MODE_FROM, TITLE_FROM) if needle not in text]
    if missing:
        raise SystemExit(
            '[vanilla] ABORT: index.html no longer contains '
            + ', '.join(repr(m) for m in missing)
            + '\n          Upstream likely changed the flag/title spelling; '
              'update VANILLA_MODE_FROM/TITLE_FROM in scripts/sync-vanilla.py.')
    return text.replace(VANILLA_MODE_FROM, VANILLA_MODE_TO).replace(TITLE_FROM, TITLE_TO)


def readme_blob():
    """Record-Builder's own README stays put; ours replaces nothing."""
    return git('rev-parse', 'origin/main:README.md').stdout.strip()


def build_tree(upstream):
    git('read-tree', upstream)
    html = git('show', f'{upstream}:index.html').stdout
    patched = patch_index_html(html)
    blob = subprocess.run(['git', 'hash-object', '-w', '--stdin'],
                          cwd=WORKDIR, input=patched, text=True,
                          capture_output=True, check=True).stdout.strip()
    git('update-index', '--add', '--cacheinfo', '100644', blob, 'index.html')
    git('update-index', '--add', '--cacheinfo', '100644', readme_blob(), 'README.md')
    return git('write-tree').stdout.strip()


def load_token():
    token = os.environ.get('GITHUB_TOKEN')
    if not token and os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE) as f:
            token = f.read().strip()
    return token


def main():
    ap = argparse.ArgumentParser(description='Sync Record-Builder from this repo')
    ap.add_argument('--dry-run', action='store_true',
                    help='build and report the tree diff, push nothing')
    args = ap.parse_args()

    ensure_workdir()
    upstream = fetch_upstream()
    head = git('rev-parse', 'origin/main').stdout.strip()
    tree = build_tree(upstream)
    head_tree = git('rev-parse', 'origin/main^{tree}').stdout.strip()
    print(f'[vanilla] upstream {upstream[:12]} | vanilla HEAD {head[:12]}')

    if tree == head_tree:
        print('[vanilla] already in sync.')
        return

    names = git('diff', '--name-status', 'origin/main', tree).stdout.strip()
    changed = names.splitlines()
    print(f'[vanilla] {len(changed)} path(s) differ:')
    for line in changed[:40]:
        print(f'          {line}')
    if len(changed) > 40:
        print(f'          ... {len(changed) - 40} more')

    if args.dry_run:
        print('[vanilla] --dry-run: no commit, no push.')
        return

    env = dict(os.environ,
               GIT_AUTHOR_NAME=AUTHOR_NAME, GIT_AUTHOR_EMAIL=AUTHOR_EMAIL,
               GIT_COMMITTER_NAME=AUTHOR_NAME, GIT_COMMITTER_EMAIL=AUTHOR_EMAIL)
    msg = f'Sync from upstream {upstream[:12]}'
    commit = git('commit-tree', tree, '-p', head, '-m', msg, env=env).stdout.strip()

    token = load_token()
    if not token:
        print('[vanilla] no token found; commit built but NOT pushed.')
        print(f'          set $GITHUB_TOKEN or create {TOKEN_FILE}.')
        return
    push_url = f'https://{AUTHOR_NAME}:{token}@{VANILLA_REPO.split("//", 1)[1]}'
    git('push', '--quiet', push_url, f'{commit}:main')
    print(f'[vanilla] pushed {commit[:12]} to Record-Builder ({msg}).')


if __name__ == '__main__':
    main()
