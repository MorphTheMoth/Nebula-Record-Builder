"""Slim full upstream JSONs down to the files in data/.

Two input modes:

1. Local ss-data build (preferred, used by build-from-ssdata.py):
     python3 scripts/fetch-slim.py --ssdata scripts/.ssdata-work
   Reads the node-parser outputs (character.json / disc.json /
   characterid.json / item.json) plus raw EN files straight from the
   given ss-data checkout directory. No network needed.

2. Legacy network mode (manual fallback only):
     python3 scripts/fetch-slim.py
   Fetches the parsed files from the AutumnVN mirror and the raw files
   from MakoStar/ss-data. Only for manual recovery; the auto-update timer
   builds from ss-data and does nothing on failure instead.
"""
import argparse
import json, urllib.request, os, re, sys

STRIP_HIDDEN = re.compile(r'\s*(?:HiddenParam\d+:\s*&HiddenParam\d+&\s*(?:\([^)]*\))?|Param\d+:\s*&Param\d+&\s*(?:\([^)]*\))?)\s*')

# Raw game data now comes straight from the upstream source repo.
SSDATA_RAW = 'https://raw.githubusercontent.com/MakoStar/ss-data/main/'
# Parsed character.json / disc.json / characterid.json do NOT exist in
# ss-data (it only holds raw EN/CN/JP/KR/TW files); the mirror below is
# legacy fallback only.
LEGACY_PARSED_RAW = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/main/'
OUT_DIR = 'data'
POT_KEYS = ['mainCore', 'mainNormal', 'supportCore', 'supportNormal', 'common']
GEM_KEEP = {'TypeId', 'AttrType', 'AttrTypeFirstSubtype', 'Level', 'Id', 'Value'}
GROUP_KEEP = {'Id', 'AttrTypes'}

def fetch_json(url):
    print(f'  Fetching {url}...')
    with urllib.request.urlopen(url) as resp:
        return json.load(resp)

def load_json(path):
    print(f'  Reading {path}...')
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def slim_characters(raw):
    slim = {}
    for cid, entry in raw.items():
        out = {}
        if 'name' in entry:
            out['name'] = entry['name']
        if 'element' in entry:
            out['element'] = entry['element']
        if 'star' in entry:
            out['star'] = entry['star']
        if 'source' in entry:
            out['source'] = entry['source']
        if 'potential' in entry:
            pot = {}
            for key in POT_KEYS:
                items = entry['potential'].get(key)
                if items:
                    pot[key] = [
                        {k: (STRIP_HIDDEN.sub('', v) if k == 'desc' else v) for k, v in item.items() if k in ('id', 'name', 'desc', 'params', 'rarity')}
                        for item in items
                    ]
            if pot:
                out['potential'] = pot
        slim[cid] = out
    return slim

def _slim_disc_skill(s):
    if not isinstance(s, dict):
        return None
    out = {}
    for k in ('name', 'desc', 'icon'):
        v = s.get(k)
        if v:
            out[k] = v
    params = s.get('params')
    if isinstance(params, list):
        flat = []
        for x in params:
            flat.append(','.join(x) if isinstance(x, list) else str(x))
        params = '/'.join(flat)
    if isinstance(params, str) and params:
        out['p1'] = params.split('/')[0]
    reqs = s.get('requirements')
    if isinstance(reqs, list) and reqs and isinstance(reqs[0], dict):
        out['req1'] = reqs[0]
    return out or None


def slim_discs(raw):
    slim = {}
    for did, entry in raw.items():
        out = {}
        if 'name' in entry:
            out['name'] = entry['name']
        if 'element' in entry:
            out['element'] = entry['element']
        if 'star' in entry:
            out['star'] = entry['star']
        if 'source' in entry:
            out['source'] = entry['source']
        stat = entry.get('stat')
        if isinstance(stat, list) and stat:
            out['maxStat'] = stat[-1]
        dupe = entry.get('dupe')
        if isinstance(dupe, list) and dupe:
            out['dupe'] = dupe
        ms = _slim_disc_skill(entry.get('mainSkill'))
        if ms:
            out['mainSkill'] = ms
        s1 = _slim_disc_skill(entry.get('secondarySkill1'))
        if s1:
            out['secondarySkill1'] = s1
        s2 = _slim_disc_skill(entry.get('secondarySkill2'))
        if s2:
            out['secondarySkill2'] = s2
        sup = entry.get('supportNote')
        if isinstance(sup, list) and sup and isinstance(sup[-1], dict):
            out['support'] = sup[-1]
        elif isinstance(sup, dict) and sup:
            out['support'] = sup
        slim[did] = out
    return slim

def slim_char_gem_attr(raw):
    return {k: {fk: v for fk, v in v.items() if fk in GEM_KEEP} for k, v in raw.items()}

def slim_char_gem_attr_groups(raw):
    return [{k: v for k, v in item.items() if k in GROUP_KEEP} for item in raw]

def slim_copy(raw):
    return raw

def save(name, data, out_dir=OUT_DIR):
    path = os.path.join(out_dir, name)
    with open(path, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

def main():
    ap = argparse.ArgumentParser(description='Slim upstream JSONs into data/')
    ap.add_argument('--ssdata', default=None,
                    help='ss-data checkout dir holding node-parser outputs '
                         '(character.json/disc.json/characterid.json) plus EN/... raw files')
    ap.add_argument('--out', default=OUT_DIR, help='output data dir')
    ap.add_argument('--legacy-parsed', action='store_true',
                    help='force legacy network fetch of parsed files from AutumnVN mirror')
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)

    if args.ssdata and not args.legacy_parsed:
        root = args.ssdata
        sources = [
            ('character.json',        os.path.join(root, 'character.json'),               slim_characters),
            ('disc.json',             os.path.join(root, 'disc.json'),                    slim_discs),
            ('characterid.json',      os.path.join(root, 'characterid.json'),             slim_copy),
            ('CharGemAttrValue.json', os.path.join(root, 'EN/bin/CharGemAttrValue.json'), slim_char_gem_attr),
            ('Item.json',             os.path.join(root, 'EN/language/en_US/Item.json'),  slim_copy),
        ]
        loader = load_json
    else:
        if args.ssdata:
            print('  --legacy-parsed: ignoring --ssdata for parsed files.',
                  file=sys.stderr)
        sources = [
            ('character.json',       LEGACY_PARSED_RAW + 'character.json',               slim_characters),
            ('disc.json',            LEGACY_PARSED_RAW + 'disc.json',                    slim_discs),
            ('characterid.json',     LEGACY_PARSED_RAW + 'characterid.json',             slim_copy),
            ('CharGemAttrValue.json',SSDATA_RAW + 'EN/bin/CharGemAttrValue.json',        slim_char_gem_attr),
            ('Item.json',            SSDATA_RAW + 'EN/language/en_US/Item.json',         slim_copy),
        ]
        loader = fetch_json

    for name, loc, slim_fn in sources:
        raw = loader(loc)
        slim = slim_fn(raw)
        save(name, slim, args.out)
        orig = len(json.dumps(raw, ensure_ascii=False))
        now  = len(json.dumps(slim, ensure_ascii=False))
        print(f'  {name}: {orig/1024:.0f} KB → {now/1024:.0f} KB  ({now/orig*100:.0f}%)')

if __name__ == '__main__':
    main()
