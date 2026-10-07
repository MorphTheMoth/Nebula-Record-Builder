#!/usr/bin/env python3
"""Build data/ directly from MakoStar/ss-data instead of the AutumnVN mirror.

The AutumnVN StellaSoraData repo works by merging upstream ss-data and then
running node parsers (character.js / disc.js / ...) to publish parsed
character.json etc. This script does that parsing step locally:

  1. Shallow-clone (or update) https://github.com/MakoStar/ss-data.git
     into scripts/.ssdata-work
  2. Copy the vendored parsers in scripts/parsers/*.js to the checkout root
     (they use relative ./EN/... requires, so they must run from there)
  3. Run with node: characterid.js, character.js, disc.js, item.js
     (characterid.js fetches ss-lua AvgCharacter.lua over network;
      the rest are fully local)
  4. Slim the parser outputs into data/ via fetch-slim.py --ssdata

Usage:
  python3 scripts/build-from-ssdata.py                 # full build
  python3 scripts/build-from-ssdata.py --no-update     # reuse existing checkout
  python3 scripts/build-from-ssdata.py --check         # update checkout, report
      parsed-output mtimes/sizes without touching data/
  python3 scripts/build-from-ssdata.py --workdir DIR   # custom checkout path

Requires: git, node (>=18 for characterid.js fetch). No npm deps.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

SSDATA_URL = 'https://github.com/MakoStar/ss-data.git'

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
PARSERS_DIR = os.path.join(SCRIPT_DIR, 'parsers')
DEFAULT_WORKDIR = os.path.join(SCRIPT_DIR, '.ssdata-work')

PARSER_FILES = ['character.js', 'disc.js', 'characterid.js', 'item.js',
                'utils.js', 'hotfix.js']
# Order matters: characterid.json is an input to character.js / disc.js.
PARSER_RUN_ORDER = ['characterid.js', 'character.js', 'disc.js', 'item.js']
PARSED_OUTPUTS = ['character.json', 'disc.json', 'characterid.json', 'item.json']


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def ensure_checkout(workdir, no_update):
    if os.path.isdir(os.path.join(workdir, '.git')):
        if no_update:
            print(f'[build] reusing existing checkout at {workdir}')
            return
        print(f'[build] updating checkout at {workdir}...')
        run('git', 'fetch', '--depth', '1', 'origin', 'main', cwd=workdir)
        run('git', 'reset', '--hard', 'FETCH_HEAD', cwd=workdir)
    else:
        if os.path.exists(workdir):
            print(f'[build] removing stale non-git {workdir}')
            shutil.rmtree(workdir)
        print(f'[build] cloning {SSDATA_URL} (depth 1)...')
        run('git', 'clone', '--depth', '1', SSDATA_URL, workdir)


def checkout_sha(workdir):
    try:
        out = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=workdir,
                             capture_output=True, text=True, check=True)
        return out.stdout.strip()
    except Exception:
        return ''


def stage_parsers(workdir):
    for name in PARSER_FILES:
        src = os.path.join(PARSERS_DIR, name)
        if not os.path.exists(src):
            print(f'[build] missing parser: {src}', file=sys.stderr)
            sys.exit(1)
        shutil.copy2(src, os.path.join(workdir, name))
    print(f'[build] staged {len(PARSER_FILES)} parsers into checkout.')


def check_node():
    try:
        out = subprocess.run(['node', '--version'], capture_output=True,
                             text=True)
    except FileNotFoundError:
        return None
    if out.returncode != 0:
        return None
    return out.stdout.strip()


def run_parsers(workdir):
    node_ver = check_node()
    if not node_ver:
        print('[build] node not found in PATH; cannot run parsers.',
              file=sys.stderr)
        print('        install node >= 18, or use '
              'fetch-slim.py legacy network mode.', file=sys.stderr)
        sys.exit(2)
    print(f'[build] using {node_ver}')
    for name in PARSER_RUN_ORDER:
        print(f'[build] node {name} ...')
        # Any parser failure (including characterid.js failing to reach the
        # ss-lua repo) is fatal: abort the whole build and do nothing. The
        # 5-minute timer will retry next cycle; a successful re-fetch would
        # return an exact copy anyway, so there is no point continuing on
        # stale/partial inputs.
        run('node', name, cwd=workdir)


def report_outputs(workdir):
    print('[build] parser outputs:')
    for name in PARSED_OUTPUTS:
        path = os.path.join(workdir, name)
        if not os.path.exists(path):
            print(f'  {name}: MISSING')
            continue
        size = os.path.getsize(path)
        try:
            with open(path, encoding='utf-8') as f:
                data = json.load(f)
            print(f'  {name}: {size/1024:.0f} KB, {len(data)} keys')
        except Exception as exc:
            print(f'  {name}: {size/1024:.0f} KB (unreadable: {exc})')


def main():
    ap = argparse.ArgumentParser(description='Build data/ from ss-data')
    ap.add_argument('--workdir', default=DEFAULT_WORKDIR)
    ap.add_argument('--no-update', action='store_true',
                    help='skip git fetch, reuse existing checkout')
    ap.add_argument('--check', action='store_true',
                    help='update checkout + run parsers, report only')
    ap.add_argument('--skip-parsers', action='store_true',
                    help='skip node step (checkout + slim only)')
    args = ap.parse_args()

    os.chdir(ROOT)
    ensure_checkout(args.workdir, args.no_update)
    sha = checkout_sha(args.workdir)
    print(f'[build] ss-data HEAD: {sha or "(unknown)"}')
    stage_parsers(args.workdir)

    if not args.skip_parsers:
        run_parsers(args.workdir)
    report_outputs(args.workdir)

    if args.check:
        print('[build] --check: data/ untouched.')
        return

    print('[build] slimming into data/...')
    run(sys.executable, os.path.join(SCRIPT_DIR, 'fetch-slim.py'),
        '--ssdata', args.workdir)
    print(f'[build] done. (ss-data {sha or "unknown"})')


if __name__ == '__main__':
    main()
