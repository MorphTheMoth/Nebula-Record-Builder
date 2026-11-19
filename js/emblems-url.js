// Emblem handoff param: `?e=` (alias `emblems`).
//
// This format exists only for the Log Viewer → Record Builder link, and nothing
// else in the app reads or writes it. It is deliberately dumb text, not base64,
// so a wrong link can be read by eye:
//
//   e=<charId>:<emblem1>/<emblem2>/<emblem3>;<charId>:...
//
// Each emblem is up to four CharGemAttrValue entry ids joined by `.`, in the
// order the record logs them (flat stats, percent stats, skill affix, potential
// affix). An empty id means the slot is left blank:
//
//   e=162:1234.1240.1246.1252/1301.1307../1380....;115:...
//
// Ids that are not in CharGemAttrValue are skipped, so a stale link degrades to
// a blank row instead of throwing.

function parseEmblemParam(str) {
    if (!str || typeof emblemAttrData === 'undefined' || !emblemAttrData) return false;
    let touched = false;
    for (const part of String(str).split(';')) {
        const cut = part.indexOf(':');
        if (cut < 0) continue;
        const cId = String(parseInt(part.slice(0, cut), 10));
        if (!cId || cId === 'NaN') continue;
        const emblems = part.slice(cut + 1).split('/');
        emblems.forEach((emblem, e) => {
            if (e > 2) return;
            emblem.split('.').forEach((idStr, s) => {
                if (s > 3) return;
                const key = `${cId}_${e}_${s}`;
                const entry = emblemAttrData[String(idStr).trim()];
                if (!entry) {
                    emblemStats[key] = '';
                    emblemStatGroups[key] = '';
                    return;
                }
                emblemStats[key] = String(entry.Id);
                emblemStatGroups[key] = String(entry.TypeId);
                touched = true;
            });
        });
        if (touched && typeof computeEmblemBonuses === 'function') computeEmblemBonuses(cId);
    }
    return touched;
}

// Read once, at script load: the app strips the query string with
// history.replaceState as part of its own import flow, so a later read of
// location.search is already empty.
const EMBLEM_PARAM_RAW = (() => {
    try {
        const params = new URLSearchParams(window.location.search.replace(/\+/g, '%2B'));
        return params.get('e') ?? params.get('emblems');
    } catch { return null; }
})();
