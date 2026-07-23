import json, urllib.request, os, re

STRIP_HIDDEN = re.compile(r'\s*(?:HiddenParam\d+:\s*&HiddenParam\d+&\s*(?:\([^)]*\))?|Param\d+:\s*&Param\d+&\s*\(OnceAdditionalAttribute[^)]*\))\s*')

BASE_RAW = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/main/'
OUT_DIR = 'data'
POT_KEYS = ['mainCore', 'mainNormal', 'supportCore', 'supportNormal', 'common']
GEM_KEEP = {'TypeId', 'AttrType', 'AttrTypeFirstSubtype', 'Level', 'Id', 'Value'}
GROUP_KEEP = {'Id', 'AttrTypes'}

def fetch_json(url):
    print(f'  Fetching {url}...')
    with urllib.request.urlopen(url) as resp:
        return json.load(resp)

def slim_characters(raw):
    slim = {}
    for cid, entry in raw.items():
        out = {}
        if 'name' in entry:
            out['name'] = entry['name']
        if 'element' in entry:
            out['element'] = entry['element']
        if 'potential' in entry:
            pot = {}
            for key in POT_KEYS:
                items = entry['potential'].get(key)
                if items:
                    pot[key] = [
                        {k: (STRIP_HIDDEN.sub('', v) if k == 'desc' else v) for k, v in item.items() if k in ('id', 'name', 'desc', 'params')}
                        for item in items
                    ]
            if pot:
                out['potential'] = pot
        slim[cid] = out
    return slim

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
        slim[did] = out
    return slim

def slim_char_gem_attr(raw):
    return {k: {fk: v for fk, v in v.items() if fk in GEM_KEEP} for k, v in raw.items()}

def slim_char_gem_attr_groups(raw):
    return [{k: v for k, v in item.items() if k in GROUP_KEEP} for item in raw]

def slim_copy(raw):
    return raw

def save(name, data):
    path = os.path.join(OUT_DIR, name)
    with open(path, 'w') as f:
        json.dump(data, f, ensure_ascii=False)

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    for name, url, slim_fn in [
        ('character.json',       BASE_RAW + 'character.json',                                          slim_characters),
        ('disc.json',            BASE_RAW + 'disc.json',                                               slim_discs),
        ('characterid.json',     BASE_RAW + 'characterid.json',                                        slim_copy),
        ('CharGemAttrValue.json',BASE_RAW + 'EN/bin/CharGemAttrValue.json',                            slim_char_gem_attr),
        ('Item.json',            BASE_RAW + 'EN/language/en_US/Item.json',                             slim_copy),
        # ('CharGemAttrGroups.json', 'https://raw.githubusercontent.com/Melledy/Nebula/main/src/main/resources/defs/CharGemAttrGroups.json', slim_char_gem_attr_groups),
    ]:
        raw = fetch_json(url)
        slim = slim_fn(raw)
        save(name, slim)
        orig = len(json.dumps(raw, ensure_ascii=False))
        now  = len(json.dumps(slim, ensure_ascii=False))
        print(f'  {name}: {orig/1024:.0f} KB → {now/1024:.0f} KB  ({now/orig*100:.0f}%)')

if __name__ == '__main__':
    main()
