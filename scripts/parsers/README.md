# Vendored upstream parsers

These `*.js` files are copied from
[AutumnVN/StellaSoraData](https://github.com/AutumnVN/StellaSoraData)
(which itself parses raw game data from
[MakoStar/ss-data](https://github.com/MakoStar/ss-data)) so this repo can
build `data/` directly from `ss-data` instead of waiting on the AutumnVN
mirror to re-publish parsed `character.json` / `disc.json`.

- `character.js` — builds full `character.json` (+ `unreleased.json`) from
  `EN/bin/*.json` + `EN|CN|JP|KR/language/*`.
- `disc.js` — builds full `disc.json` the same way.
- `characterid.js` — builds `characterid.json` from
  `ss-lua` (`AvgCharacter.lua`). Network fetch, unchanged.
- `item.js` — builds full `item.json` from `EN/bin/Item.json`.
- `utils.js` — shared parsing helpers used by the above.
- `hotfix.js` — **patched**: upstream `require`s
  `hotfix/out/Hotfix.cs` (a 30 MB game-client decompile committed only in
  the AutumnVN repo, NOT in `ss-data`). Here `getSource()` returns `''`
  when the file is absent, so hotfix-only notes are skipped while all
  released characters parse normally.

They are staged into a fresh `ss-data` checkout by
`scripts/build-from-ssdata.py` (which copies `*.js` to the checkout root,
because the scripts use relative `./EN/...` requires) and run with `node`:

```
node characterid.js
node character.js
node disc.js
node item.js
```

Only `character` / `disc` / `characterid` outputs (plus raw
`EN/bin/CharGemAttrValue.json` and `EN/language/en_US/Item.json`, which need
no parsing) are slimmed into this repo's `data/`.
