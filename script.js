const BASE_RAW = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/main/';
const BASE_ASSETS = 'https://raw.githubusercontent.com/AutumnVN/ssassets/main/';

let charData = {}, discData = {}, charJson = {};
let selectedChars = [null, null, null];
let selectedDiscs = ["212005", "211006", "211005", null, null, null];
let potLevels = {};
let noteCounts = {};
let discCopies = {};
let playerId = '10001';

function saveState() {
  const state = {
    playerId,
    selectedChars,
    selectedDiscs,
    potLevels: Object.fromEntries(Object.entries(potLevels).map(([k, v]) => [k, v])),
    emblemStats: Object.fromEntries(Object.entries(emblemStats).map(([k, v]) => [k, v])),
    emblemStatGroups: Object.fromEntries(Object.entries(emblemStatGroups).map(([k, v]) => [k, v])),
    noteCounts: Object.fromEntries(Object.entries(noteCounts).map(([k, v]) => [k, v])),
    discCopies: Object.fromEntries(Object.entries(discCopies).map(([k, v]) => [k, v]))
  };
  localStorage.setItem('nebulaBuildState', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('nebulaBuildState');
  if (!saved) return;
  try {
    const state = JSON.parse(saved);
    playerId = state.playerId || '10001';
    selectedChars = state.selectedChars || [null, null, null];
    selectedDiscs = state.selectedDiscs || ["212005", "211006", "211005", null, null, null];
    potLevels = state.potLevels || {};
    emblemStats = state.emblemStats || {};
    emblemStatGroups = state.emblemStatGroups || {};
    noteCounts = state.noteCounts || {};
    discCopies = state.discCopies || {};
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
}
let potentialDesc = {};
let emblemStats = {};
let emblemStatGroups = {};
let emblemAttrData = {};
let itemData = {};
let emblemStatOptions = {};
let emblemPotBonuses = {};
let charGemAttrGroups = null;
let typeIdToSlot = {};
let discImagesPreloaded = false;

const NOTE_IDS = [90011,90012,90013,90014,90015,90016,90017,90018,90019,90020,90021,90022,90023];
const ELEMENT_NOTE = {Aqua:90018,Ignis:90019,Ventus:90020,Terra:90021,Lux:90022,Umbra:90023};

// Effect attribute type enum mapping
const EFFECT_ATTR_NAMES = {
  1: 'ATK', 2: 'DEF', 3: 'HP', 4: 'HITRATE', 5: 'EVD',
  6: 'CRIT RATE', 7: 'CRIT RESIST', 8: 'CRIT DMG', 9: 'PENETRATE',
  10: 'DEF IGNORE', 11: 'WER', 12: 'FER', 13: 'SER', 14: 'AER',
  15: 'LER', 16: 'DER', 17: 'WEE', 18: 'FEE', 19: 'SEE', 20: 'AEE',
  21: 'LEE', 22: 'DEE', 23: 'WEP', 24: 'FEP', 25: 'SEP', 26: 'AEP',
  27: 'LEP', 28: 'DEP', 29: 'WEI', 30: 'FEI', 31: 'SEI', 32: 'AEI',
  33: 'LEI', 34: 'DEI', 35: 'WEERCD', 36: 'FEERCD', 37: 'SEERCD',
  38: 'AEERCD', 39: 'LEERCD', 40: 'DEERCD', 41: 'WEIGHT',
  42: 'TOUGHNESS_MAX', 43: 'TOUGHNESS_DAMAGE_ADJUST', 44: 'SHIELD_MAX',
  46: 'MOVE SPEED', 47: 'ATK SPD', 48: 'INTENSITY', 49: 'GENDMG',
  50: 'DMGPLUS', 51: 'FINAL DMG', 52: 'FINALDMGPLUS', 53: 'GENDMGRCD',
  54: 'DMGPLUSRCD', 55: 'SUPPRESS', 56: 'AA DMG', 57: 'SKILL DMG',
  58: 'ULTIMATE DMG', 59: 'OTHER DMG', 60: 'RCDNORMALDMG', 61: 'RCDSKILLDMG',
  62: 'RCDULTRADMG', 63: 'RCDOTHERDMG', 64: 'MARK DMG', 65: 'RCDMARKDMG',
  66: 'MINION DMG', 67: 'RCDMINION DMG', 68: 'PROJECTILE DMG', 69: 'RCDPROJECTILEDMG',
  70: 'AA CRIT RATE', 71: 'SKILL CRIT RATE', 72: 'ULTRA CRIT RATE',
  73: 'MARK CRIT RATE', 74: 'MINION CRIT RATE', 75: 'PROJECTILE CRIT RATE',
  76: 'OTHER CRIT RATE', 77: 'AA CRIT POWER', 78: 'SKILL CRIT POWER',
  79: 'ULTRA CRIT POWER', 80: 'MARK CRIT POWER', 81: 'MINION CRIT RATE',
  82: 'PROJECTILE CRIT POWER', 83: 'OTHER CRIT POWER', 84: 'ENERGY_MAX',
  85: 'SKILL_INTENSITY', 86: 'TOUGHNESS_BROKEN_DMG', 87: 'ADD_SHIELD_STRENGTHEN',
  88: 'BE_ADD_SHIELD_STRENGTHEN', 89: 'NORMAL_SUPPRESS', 90: 'SKILL_SUPPRESS',
  91: 'ULTRA_SUPPRESS', 92: 'MARK_SUPPRESS', 93: 'MINION SUPPRESS',
  94: 'PROJECTILE_SUPPRESS', 95: 'OTHER_SUPPRESS', 96: 'ENV_AMEND'
};

// Ability type names
const ABILITY_TYPE_NAMES = {
  1: 'AA', 2: 'Skill', 3: 'Support Skill', 4: 'Ultimate'
};

// Charge efficiency type names
const CHARGE_EFF_TYPE_NAMES = {
  0: 'Supp', 1: 'Main'
};

function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// ── Emblem stat grouping ───────────────────────────────────────────────────
function buildEmblemGroups(charId, isMain) {
  const potMap = {};
  const entries = Object.entries(emblemAttrData)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, entry]) => entry);

  // ── Build lookup: full potential ID → group order (1/2/3) ───────────
  const potGroupOrder = {}; // fullID -> order
  const cData = charJson[charId];
  if (cData?.potential) {
    const coreKey = isMain ? 'mainCore' : 'supportCore';
    const normalKey = isMain ? 'mainNormal' : 'supportNormal';
    const commonKey = 'common';

    const corePots = (cData.potential[coreKey] || []).slice().sort((a, b) => a.id - b.id);
    const normalPots = (cData.potential[normalKey] || []).slice().sort((a, b) => a.id - b.id);
    const commonPots = (cData.potential[commonKey] || []).slice().sort((a, b) => a.id - b.id);

    // Group 1
    corePots.slice(0, 2).forEach(p => potGroupOrder[p.id] = 1);
    normalPots.slice(0, 3).forEach(p => potGroupOrder[p.id] = 1);
    // Group 2
    corePots.slice(2, 4).forEach(p => potGroupOrder[p.id] = 2);
    normalPots.slice(3, 6).forEach(p => potGroupOrder[p.id] = 2);
    // Group 3
    normalPots.slice(6).forEach(p => potGroupOrder[p.id] = 3);
    commonPots.forEach(p => potGroupOrder[p.id] = 3);
  }

  const byEmblem = [{}, {}, {}];

  for (const entry of entries) {
    const typeId = entry.TypeId;
    const slotNumber = typeIdToSlot[typeId];
    if (!slotNumber) continue;
    const emblemIdx = slotNumber - 1;

    const {
      AttrType, AttrTypeFirstSubtype, AttrTypeSecondSubtype,
      Level, Id, Value
    } = entry;

    let name;
    let order = 0;

    // Element‑specific stats
    if (AttrType === 12 && AttrTypeFirstSubtype >= 17 && AttrTypeFirstSubtype <= 28) {
      const elements = ['Aqua', 'Ignis', 'Terra', 'Ventus', 'Lux', 'Umbra'];
      const suffix = AttrTypeFirstSubtype <= 22 ? 'Dmg %' : 'Pen';
      const elemIndex = (AttrTypeFirstSubtype - 17) % 6;
      const requiredElement = elements[elemIndex];
      const charElement = charJson[charId]?.element;
      if (charElement !== requiredElement) continue;
      name = `${requiredElement} ${suffix}`;
    } else if (AttrType === 12) {
      name = capitalizeWords(EFFECT_ATTR_NAMES[AttrTypeFirstSubtype]) || `Attr${AttrTypeFirstSubtype}`;
    } else if (AttrType === 37) {
      name = `Charge Eff (${CHARGE_EFF_TYPE_NAMES[AttrTypeFirstSubtype] ?? AttrTypeFirstSubtype}) `;
    } else if (AttrType === 7) {
      name = `${ABILITY_TYPE_NAMES[AttrTypeFirstSubtype] ?? AttrTypeFirstSubtype} Levelup`;
    } else if (AttrType === 99) {
      // Reconstruct full potential ID: 5 + charId + zero-padded subtype
      const paddedSub = String(AttrTypeFirstSubtype).padStart(2, '0');
      const fullPotId = Number('5' + charId + paddedSub);
      const groupOrd = potGroupOrder[fullPotId];
      if (groupOrd === undefined) continue; // not in any build → skip
      order = groupOrd;

      const itemKey = `Item.5${charId}${paddedSub}.1`;
      const itemName = itemData[itemKey];
      name = itemName ? itemName : `Potential ${paddedSub}`;
      potMap[fullPotId] = { emblemIdx, typeId };
    } else {
      continue;
    }

    const groups = byEmblem[emblemIdx];
    if (!groups[typeId]) {
      groups[typeId] = { name, entries: [], order };
    }
    groups[typeId].entries.push({ id: Id, level: Level, value: Value });
    if (AttrType == 99 || AttrType == 7) groups[typeId].isLevelup = true;
  }

  // Sort levels within each group
  for (let i = 0; i < 3; i++) {
    for (const g of Object.values(byEmblem[i])) {
      g.entries.sort((a, b) => a.level - b.level);
    }
  }

  return { groups: byEmblem, potMap };
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Failed: ' + url);
  return r.json();
}

// ---------------------------------- CHARACTERS WITH ELEMENT GROUPING ----------------------------------
async function renderChars() {
  const grid = document.getElementById('charGrid');
  grid.innerHTML = '';

  const ids = Object.keys(charData).sort((a,b) => +a - +b);
  // load images concurrently
  const probes = await Promise.all(ids.map(id => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = BASE_ASSETS + `export/assets/assetbundles/icon/head/head_${id}02_XXL.webp`;
  })));

  // collect valid characters with element & name
  const validChars = [];
  for (let i = 0; i < ids.length; i++) {
    if (!probes[i]) continue;
    const id = ids[i];
    const element = charJson[id]?.element || 'Other';
    validChars.push({ id, element, name: charData[id] });
  }

  const elementOrder = { Aqua:0, Ignis:1, Ventus:2, Terra:3, Lux:4, Umbra:5, Other:6 };
  validChars.sort((a,b) => {
    const ea = elementOrder[a.element] ?? 99;
    const eb = elementOrder[b.element] ?? 99;
    if (ea !== eb) return ea - eb;
    return a.name.localeCompare(b.name);
  });

  // create cards without any headers
  for (const ch of validChars) {
    const div = document.createElement('div');
    div.className = 'char-card';
    div.dataset.charId = ch.id;
    div.dataset.element = ch.element;

    const img = document.createElement('img');
    img.src = BASE_ASSETS + `export/assets/assetbundles/icon/head/head_${ch.id}02_XXL.webp`;
    div.appendChild(img);

    const lbl = document.createElement('div');
    lbl.className = 'label'; lbl.textContent = ch.name;
    div.appendChild(lbl);

    div.onclick = () => toggleChar(ch.id);
    grid.appendChild(div);
  }

  refreshCharBadges();
}

function refreshCharBadges() {
  document.querySelectorAll('.char-card').forEach(card => {
    const id = card.dataset.charId;
    const slotIdx = selectedChars.indexOf(id);
    card.classList.toggle('selected', slotIdx >= 0);
    let badge = card.querySelector('.slot-badge');
    if (slotIdx >= 0) {
      if (!badge) { badge = document.createElement('span'); badge.className = 'slot-badge'; card.appendChild(badge); }
      badge.textContent = `#${slotIdx+1}`;
    } else {
      if (badge) badge.remove();
    }
  });
}

function toggleChar(id) {
  const idx = selectedChars.indexOf(id);
  if (idx >= 0) {
    selectedChars[idx] = null;
    const clean = selectedChars.filter(x => x !== null);
    selectedChars = [clean[0]||null, clean[1]||null, clean[2]||null];
  } else {
    const free = selectedChars.indexOf(null);
    if (free === -1) return;
    selectedChars[free] = id;
  }
  refreshCharBadges();
  updatePotentials();
  updateNotes();
  generate();
}

// ── Discs ─────────────────────────────────────────────────────────────────
function getTeamElements() {
  const els = new Set();
  selectedChars.forEach(id => { if (id && charJson[id]?.element) els.add(charJson[id].element); });
  selectedDiscs.forEach(id => { if (id && discData[id]?.element) els.add(discData[id].element); });
  return els;
}

function renderDiscs() {
  const row = document.getElementById('discRow');
  row.innerHTML = '';
  const labels = ['Main','Main','Main','Support','Support','Support'];
  for (let i = 0; i < 6; i++) {
    if (i === 3) { const sep = document.createElement('div'); sep.className = 'sep'; row.appendChild(sep); }
    const slot = document.createElement('div');
    slot.className = 'disc-slot';
    slot.innerHTML = `<div class="disc-slot-label">${labels[i]}</div>`;
    const picker = document.createElement('div');
    picker.className = 'disc-picker';
    const thumb = document.createElement('div');
    thumb.className = 'disc-thumb' + (selectedDiscs[i] ? ' selected' : '');
    if (selectedDiscs[i]) {
      const imgId = String(selectedDiscs[i]).slice(2);
      thumb.innerHTML = `<img src="${BASE_ASSETS}export/assets/assetbundles/icon/outfit/outfit_${imgId}.webp" onerror="this.style.opacity=0.2">`;
    } else {
      thumb.innerHTML = `<span class="plus">+</span>`;
    }
    thumb.onclick = (e) => { e.stopPropagation(); toggleDiscDropdown(i); };

    const dd = document.createElement('div');
    dd.className = 'disc-dropdown';
    dd.id = `disc-dd-${i}`;

    const search = document.createElement('input');
    search.className = 'disc-search';
    search.placeholder = 'Search…';
    dd.appendChild(search);

    const list = document.createElement('div');
    list.id = `disc-list-${i}`;
    dd.appendChild(list);

    search.oninput = () => fillDiscList(list, i, search.value);

    picker.appendChild(thumb);
    picker.appendChild(dd);
    slot.appendChild(picker);

    // Copy controls under each disc slot
    const id = selectedDiscs[i];
    if (id) {
      if (discCopies[id] === undefined) discCopies[id] = 1;
      const controls = document.createElement('div');
      controls.className = 'note-controls disc-copies-ctrl';

      const btnMinus = document.createElement('button');
      btnMinus.className = 'note-btn'; btnMinus.textContent = '−';

      const val = document.createElement('span');
      val.className = 'pot-val disc-copy-val';
      val.id = `disc-copy-val-${i}`;
      val.textContent = `c${discCopies[id]}`;

      const btnPlus = document.createElement('button');
      btnPlus.className = 'note-btn'; btnPlus.textContent = '+';

      const update = (delta) => {
        discCopies[id] = Math.min(6, Math.max(1, (discCopies[id] || 1) + delta));
        val.textContent = `c${discCopies[id]}`;
        updateDiscOutputText();
        saveState();
      };
      btnMinus.onclick = () => update(-1);
      btnPlus.onclick  = () => update(+1);

      controls.appendChild(btnMinus);
      controls.appendChild(val);
      controls.appendChild(btnPlus);
      slot.appendChild(controls);
    } else {
      // Empty placeholder to keep alignment consistent
      const placeholder = document.createElement('div');
      placeholder.className = 'disc-copies-ctrl';
      placeholder.style.height = '22px';
      slot.appendChild(placeholder);
    }

    row.appendChild(slot);
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function fillDiscList(list, slotIdx, filter) {
  list.innerHTML = '';

  const none = document.createElement('div');
  none.className = 'disc-option';
  none.innerHTML = `<span style="color:#555;font-size:11px">— None —</span>`;
  none.onclick = () => selectDisc(slotIdx, null);
  list.appendChild(none);

  const teamEls = getTeamElements();

  const byElement = {};
  Object.keys(discData).forEach(id => {
    const d = discData[id];
    if (filter && !d.name.toLowerCase().includes(filter.toLowerCase())) return;
    const el = d.element || 'Other';
    if (!byElement[el]) byElement[el] = [];
    byElement[el].push(id);
  });

  Object.values(byElement).forEach(arr => arr.sort((a,b) => {
    if (discData[b].star !== discData[a].star) return discData[b].star - discData[a].star;
    return discData[a].name.localeCompare(discData[b].name);
  }));

  const allEls = Object.keys(byElement).sort();

  // Count frequency of each element in team (characters + selected discs)
  const elementCount = new Map();
  selectedChars.forEach(id => {
    if (id && charJson[id]?.element) {
      const el = charJson[id].element;
      elementCount.set(el, (elementCount.get(el) || 0) + 1);
    }
  });
  selectedDiscs.forEach(id => {
    if (id && discData[id]?.element) {
      const el = discData[id].element;
      elementCount.set(el, (elementCount.get(el) || 0) + 1);
    }
  });

  // Sort team elements by frequency (descending), then alphabetically
  const teamElements = [...teamEls].sort((a, b) => {
    const countA = elementCount.get(a) || 0;
    const countB = elementCount.get(b) || 0;
    if (countA !== countB) return countB - countA;
    return a.localeCompare(b);
  });
  const nonTeamElements = allEls.filter(e => !teamEls.has(e)).sort();

  const orderedElements = [...teamElements, ...nonTeamElements];
  const noneIndex = orderedElements.indexOf('None');
  if (noneIndex !== -1) {
    orderedElements.splice(noneIndex, 1);
    orderedElements.push('None');
  }

  orderedElements.forEach(el => {
    const ids = byElement[el];
    if (!ids?.length) return;
    const hdr = document.createElement('div');
    hdr.className = 'disc-group-header' + (teamEls.has(el) ? ' team-el' : '');
    hdr.textContent = el;
    list.appendChild(hdr);
    ids.forEach(id => {
      if (selectedDiscs.some((sel, idx) => sel === id && idx !== slotIdx)) return;
      const d = discData[id];
      const imgId = String(id).slice(2);
      const opt = document.createElement('div');
      opt.className = 'disc-option' + (selectedDiscs[slotIdx] === id ? ' selected-opt' : '');
      opt.innerHTML = `
        <img src="${BASE_ASSETS}export/assets/assetbundles/icon/outfit/outfit_${imgId}.webp" onerror="this.style.opacity=0.2">
        <div class="info">
          <div class="dname">${escapeHtml(d.name)}</div>
          <div class="dmeta">${'★'.repeat(d.star)} · ${d.element}</div>
        </div>`;
      opt.setAttribute('data-element', d.element);
      opt.onclick = () => selectDisc(slotIdx, id);
      list.appendChild(opt);
    });
  });
}

function repositionDiscDropdown(dropdown) {
  if (!dropdown || !dropdown.classList.contains('open')) return;
  const picker = dropdown.closest('.disc-picker');
  const thumb = picker?.querySelector('.disc-thumb');
  if (!thumb) return;
  const rect = thumb.getBoundingClientRect();
  const dropdownHeight = 400;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const isCurrentlyAbove = dropdown.classList.contains('open-above');
  
  const shouldBeAbove = (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight);
  
  if (shouldBeAbove && !isCurrentlyAbove) {
    dropdown.classList.add('open-above');
  } else if (!shouldBeAbove && isCurrentlyAbove) {
    dropdown.classList.remove('open-above');
  }
}

function repositionAllDiscDropdowns() {
  document.querySelectorAll('.disc-dropdown.open').forEach(dd => repositionDiscDropdown(dd));
}

let repositionTimeout;
function debouncedReposition() {
  if (repositionTimeout) clearTimeout(repositionTimeout);
  repositionTimeout = setTimeout(() => {
    repositionAllDiscDropdowns();
    repositionTimeout = null;
  }, 50);
}

window.addEventListener('scroll', debouncedReposition);
window.addEventListener('resize', debouncedReposition);

function toggleDiscDropdown(i) {
  const dd = document.getElementById(`disc-dd-${i}`);
  const wasOpen = dd.classList.contains('open');
  closeAllDiscDD();
  if (!wasOpen) {
    fillDiscList(document.getElementById(`disc-list-${i}`), i, '');
    dd.classList.add('open');
    dd.scrollTop = 0;
    repositionDiscDropdown(dd);
    const search = dd.querySelector('.disc-search');
    if (search) { search.value = ''; search.focus(); }
  }
}

function closeAllDiscDD() {
  document.querySelectorAll('.disc-dropdown').forEach(d => d.classList.remove('open'));
}

function selectDisc(slotIdx, id) {
  selectedDiscs[slotIdx] = id;
  closeAllDiscDD();
  renderDiscs();
  renderDiscOutput();
  updateNotes();
  generate();
}

// -------------------------------------------------- DISC OUTPUT -----------------------------------------
function renderDiscOutput() {
  const panel = document.getElementById('discOutputPanel');
  if (!panel || panel.dataset.built) { updateDiscOutputText(); return; }
  panel.dataset.built = '1';

  const outEl = document.createElement('div');
  outEl.className = 'disc-output-text';
  outEl.id = 'discOutputText';
  panel.appendChild(outEl);

  const btnRow = document.createElement('div');
  btnRow.className = 'emblem-output-btn-row';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'emblem-output-btn disc-output-btn';
  copyBtn.textContent = 'Copy';

  const feedbackSpan = document.createElement('span');
  feedbackSpan.className = 'emblem-feedback';
  feedbackSpan.id = 'discCopyFeedback';

  copyBtn.onclick = () => {
    const txt = document.getElementById('discOutputText')?.textContent;
    if (!txt || txt === '—') return;
    navigator.clipboard.writeText(txt).then(() => {
      const fb = document.getElementById('discCopyFeedback');
      if (fb) { fb.textContent = 'copied'; setTimeout(() => { fb.textContent = ''; }, 1500); }
    }).catch(() => {});
  };

  btnRow.appendChild(copyBtn);
  btnRow.appendChild(feedbackSpan);
  panel.appendChild(btnRow);

  updateDiscOutputText();
}

function updateDiscOutputText() {
  const outEl = document.getElementById('discOutputText');
  if (!outEl) return;
  const lines = selectedDiscs
    .filter(id => id)
    .map(id => `disc ${id} lv80 a8 c${(discCopies[id] || 1) - 1} @${playerId}`);
  outEl.textContent = lines.length ? lines.join('\n')+'\n' : '—';
}

// -------------------------------------------------- POTENTIALS -----------------------------------------
let activePotTab = 0;

function computeEmblemBonuses(charId) {
  for (const key in emblemPotBonuses) 
    if (key.startsWith('5' + charId)) delete emblemPotBonuses[key];

  for (let e = 0; e < 3; e++) {
    for (let s = 0; s < 4; s++) {
      const key = `${charId}_${e}_${s}`;
      const statEntryId = emblemStats[key];
      if (!statEntryId) continue;

      const entry = emblemAttrData[statEntryId];
      if (!entry || entry.AttrType !== 99) continue;

      const paddedSub = String(entry.AttrTypeFirstSubtype).padStart(2, '0');
      const fullPotId = Number('5' + charId + paddedSub);
      emblemPotBonuses[fullPotId] = (emblemPotBonuses[fullPotId] || 0) + entry.Level;
    }
  }
}

function updatePotentials() {
  let globalTooltip = document.querySelector('.pot-tooltip');
  if (!globalTooltip) {
    globalTooltip = document.createElement('div');
    globalTooltip.className = 'pot-tooltip';
    globalTooltip.style.display = 'none';
    document.body.appendChild(globalTooltip);
  }
  const sec = document.getElementById('potSection');
  const tabs = document.getElementById('potTabs');
  const content = document.getElementById('potContent');
  const chars = selectedChars.filter(c => c);
  if (!chars.length) { sec.style.display = 'none'; return; }
  sec.style.display = '';

  if (activePotTab >= chars.length) activePotTab = 0;

  tabs.innerHTML = '';
  chars.forEach((cId, i) => {
    const name = charJson[cId]?.name || cId;
    const btn = document.createElement('button');
    btn.className = 'pot-tab' + (i === activePotTab ? ' active' : '');
    btn.textContent = name;
    btn.onclick = () => { activePotTab = i; updatePotentials(); };
    tabs.appendChild(btn);
  });

  content.innerHTML = '';
  chars.forEach((cId, tabIdx) => {
    const page = document.createElement('div');
    page.className = 'pot-page' + (tabIdx === activePotTab ? ' active' : '');

    // Get the three potential arrays for this character
    const cData = charJson[cId];
    if (!cData?.potential) return;

    const isMain = tabIdx === 0;
    const coreKey = isMain ? 'mainCore' : 'supportCore';
    const normalKey = isMain ? 'mainNormal' : 'supportNormal';
    const commonKey = 'common';

    let corePots = cData.potential[coreKey] || [];
    let normalPots = cData.potential[normalKey] || [];
    let commonPots = cData.potential[commonKey] || [];

    // Sort each array by ID (already done, but ensure)
    corePots = [...corePots].sort((a, b) => a.id - b.id);
    normalPots = [...normalPots].sort((a, b) => a.id - b.id);
    commonPots = [...commonPots].sort((a, b) => a.id - b.id);

    // Build three custom groups:
    // Group 1: first 2 core + first 3 normal
    // Group 2: next 2 core (index 2-3) + next 3 normal (index 3-5)
    // Group 3: remaining normal (index 6+) + all common
    const groups = [
      { core: corePots.slice(0, 2), normal: normalPots.slice(0, 3), label: 'Group 1' },
      { core: corePots.slice(2, 4), normal: normalPots.slice(3, 6), label: 'Group 2' },
      { core: [], normal: normalPots.slice(6), common: commonPots, label: 'Group 3' }
    ];

    const groupsRow = document.createElement('div');
    groupsRow.className = 'pot-groups-row';

    groups.forEach((group, idx) => {
      const allItems = [];
      group.core.forEach(p => allItems.push({ ...p, maxLvl: 1, isCore: true }));
      group.normal.forEach(p => allItems.push({ ...p, maxLvl: 6, isCore: false }));
      if (group.common) {
        group.common.forEach(p => allItems.push({ ...p, maxLvl: 6, isCore: false }));
      }

      if (allItems.length === 0) return;

      const groupDiv = document.createElement('div');
      groupDiv.className = 'pot-group';
      const labelText = idx === 0 ? 'Build 1' : (idx === 1 ? 'Build 2' : 'Generic');
      groupDiv.innerHTML = `<div class="pot-group-label">${labelText}</div>`;
      const listDiv = document.createElement('div');
      listDiv.className = 'pot-list';

      allItems.forEach(p => {
        if (potLevels[p.id] === undefined) potLevels[p.id] = 0;
        const maxLvl = p.maxLvl;
        if (potLevels[p.id] > maxLvl) potLevels[p.id] = maxLvl;

        const item = document.createElement('div');
        item.className = 'pot-item' + (potLevels[p.id] > 0 ? ' active' : '');

        const img = document.createElement('img');
        img.src = BASE_ASSETS + `potential/${p.id}.webp`;
        img.onerror = () => img.style.opacity = '0.15';

        const nm = document.createElement('div');
        nm.className = 'pname'; nm.textContent = p.name || `#${p.id}`;

        const controls = document.createElement('div');
        controls.className = 'pot-controls';

        const btnMinus = document.createElement('button');
        btnMinus.className = 'pot-btn'; btnMinus.textContent = '−';

        const inp = document.createElement('span');
        inp.className = 'pot-val';
        const bonus = emblemPotBonuses[p.id] || 0;
        inp.textContent = bonus > 0 ? `${potLevels[p.id]}+${bonus}` : potLevels[p.id];
        inp.type = 'number'; inp.min = 0; inp.max = maxLvl; inp.value = potLevels[p.id];
        inp.oninput = () => {
          potLevels[p.id] = Math.min(maxLvl, Math.max(0, +inp.value || 0));
          item.classList.toggle('active', potLevels[p.id] > 0);
          generate();
        };

        const btnPlus = document.createElement('button');
        btnPlus.className = 'pot-btn'; btnPlus.textContent = '+';

        const update = (val, diff) => {
          // Clicked '+' when already at max → try to add emblem level
          if (val === 6) {
            if (diff === +1) {
              if (tryAddEmblemLevel(cId, p.id, potMap, allEmblemGroups)) {
                computeEmblemBonuses(cId);
                updatePotentials();
                generate();
              }
              return;
            } else if (diff === -1) {  // Clicked '−' → try to remove an emblem level
              if (tryRemoveEmblemLevel(cId, p.id, potMap, allEmblemGroups)) {
                computeEmblemBonuses(cId);
                updatePotentials();
                generate();
                return;
              }
            }
          }
          if (val === -diff) { 
            if (tryRemoveEmblemLevel(cId, p.id, potMap, allEmblemGroups)) {
              tryRemoveEmblemLevel(cId, p.id, potMap, allEmblemGroups)
              tryRemoveEmblemLevel(cId, p.id, potMap, allEmblemGroups)
              computeEmblemBonuses(cId);
              updatePotentials();
            }
          }
          // Normal level change
          potLevels[p.id] = Math.min(maxLvl, Math.max(0, val+diff));
          const b = emblemPotBonuses[p.id] || 0;
          inp.textContent = b > 0 ? `${potLevels[p.id]}+${b}` : potLevels[p.id];
          item.classList.toggle('active', potLevels[p.id] + b > 0);
          computeEmblemBonuses(cId);
          updatePotentials();
          generate();
        };

        btnMinus.onclick = (e) => { e.stopPropagation(); update(potLevels[p.id], -1); };
        btnPlus.onclick  = (e) => { e.stopPropagation(); update(potLevels[p.id], +1); };

        item.onclick = (e) => {
          if (e.target === btnMinus || e.target === btnPlus || e.target === inp) return;
          update(potLevels[p.id], potLevels[p.id] > 0 ? -potLevels[p.id] : maxLvl);
        };

        controls.appendChild(btnMinus); controls.appendChild(inp); controls.appendChild(btnPlus);
        item.appendChild(img); item.appendChild(nm); item.appendChild(controls);
        listDiv.appendChild(item);

        // Tooltip elements
        const tooltipGlobal = document.querySelector('.pot-tooltip');
        let moveHandler = null;

        img.addEventListener('mouseenter', (e) => {
          const tt = document.querySelector('.pot-tooltip');
          if (!tt) return;
          
          const bigImg = document.createElement('img');
          bigImg.src = img.src;
          
          const descDiv = document.createElement('div');
          descDiv.className = 'desc';
          let rawDesc = formatPotentialDesc(p.id, p.params);
          if (!rawDesc || rawDesc === 'No description available.') {
            rawDesc = 'No detailed description found.';
          }
          rawDesc = formatDescriptionWithColor(rawDesc);
          descDiv.innerHTML = rawDesc;
          
          tt.innerHTML = '';
          tt.appendChild(bigImg);
          tt.appendChild(descDiv);
          tt.style.display = 'flex';
          
          // Position near cursor
          const updatePos = (event) => {
            tt.style.left = (event.clientX + 15) + 'px';
            tt.style.top = (event.clientY + 15) + 'px';
          };
          updatePos(e);
          window.addEventListener('mousemove', updatePos);
          moveHandler = updatePos;
        });

        img.addEventListener('mouseleave', () => {
          const tt = document.querySelector('.pot-tooltip');
          if (tt) tt.style.display = 'none';
          if (moveHandler) {
            window.removeEventListener('mousemove', moveHandler);
            moveHandler = null;
          }
        });
      });

      groupDiv.appendChild(listDiv);
      groupsRow.appendChild(groupDiv);
    });

    page.appendChild(groupsRow);

    // Add emblems section
    const emblemSection = document.createElement('div');
    emblemSection.className = 'emblem-section';

    const emblemLabel = document.createElement('div');
    emblemLabel.className = 'emblem-section-label';
    emblemLabel.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';

    const emblemLabelText = document.createElement('span');
    emblemLabelText.textContent = 'Emblems';
    emblemLabel.appendChild(emblemLabelText);

    const clearEmblemBtn = document.createElement('button');
    clearEmblemBtn.className = 'import-btn clear-btn';
    clearEmblemBtn.textContent = 'Clear';
    clearEmblemBtn.title = 'Reset all emblems for this character';
    clearEmblemBtn.onclick = () => clearEmblems(cId);
    emblemLabel.appendChild(clearEmblemBtn);

    emblemSection.appendChild(emblemLabel);

    const emblemContainer = document.createElement('div');
    emblemContainer.className = 'emblem-container';

    // 3 emblem cards – append directly to the grid (each gets a column)
    const { groups: allEmblemGroups, potMap } = buildEmblemGroups(cId, isMain);
    for (let e = 0; e < 3; e++) {
      const card = document.createElement('div');
      card.className = 'emblem-card';

      const cardLabel = document.createElement('div');
      cardLabel.className = 'emblem-card-label';
      cardLabel.textContent = `Lvl ${e*10 + 70}`;
      card.appendChild(cardLabel);

      const statsDiv = document.createElement('div');
      statsDiv.className = 'emblem-stats';

      const groups = allEmblemGroups[e];
      const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
        const ga = groups[a];
        const gb = groups[b];
        const oa = ga.order ?? 0;
        const ob = gb.order ?? 0;
        if (oa !== ob) return oa - ob;
        return Number(a) - Number(b);
      });

      for (let s = 0; s < 4; s++) {
        const key = `${cId}_${e}_${s}`;
        if (emblemStats[key] === undefined) emblemStats[key] = '';
        if (emblemStatGroups[key] === undefined) emblemStatGroups[key] = '';

        const row = document.createElement('div');
        row.className = 'emblem-stat-row';

        const statSel = document.createElement('select');
        statSel.className = 'emblem-stat-select';
        const blankOpt = document.createElement('option');
        blankOpt.value = ''; blankOpt.textContent = '— stat —';
        statSel.appendChild(blankOpt);
        sortedGroupKeys.forEach(gk => {
          const opt = document.createElement('option');
          opt.value = gk;
          opt.textContent = groups[gk].name;
          statSel.appendChild(opt);
        });
        // Set value after all options are appended — more reliable than opt.selected = true
        if (emblemStatGroups[key]) statSel.value = emblemStatGroups[key];

        const lvlSel = document.createElement('select');
        lvlSel.className = 'emblem-level-select';
        const fillLevelSel = (gk) => {
          lvlSel.innerHTML = '';
          const blk = document.createElement('option');
          blk.value = ''; blk.textContent = '— lv —';
          lvlSel.appendChild(blk);
          if (!gk || !groups[gk]) return;
          groups[gk].entries.forEach(entry => {
            const opt = document.createElement('option');
            opt.value = String(entry.id);
            opt.textContent = groups[gk].isLevelup ? `+${entry.value}` : `${entry.value < 1 ? (entry.value*100)+"%" : entry.value}`;
            lvlSel.appendChild(opt);
          });
          // Set value after all options are appended
          if (emblemStats[key]) lvlSel.value = emblemStats[key];
        };
        fillLevelSel(emblemStatGroups[key]);

        statSel.onchange = () => {
          emblemStatGroups[key] = statSel.value;
          emblemStats[key] = '';
          fillLevelSel(statSel.value);
          if (lvlSel.options.length > 1) {
            lvlSel.selectedIndex = lvlSel.options.length - 1;
            emblemStats[key] = lvlSel.value;
          }
          computeEmblemBonuses(cId);
          updatePotentials();
          generate();
        };
        lvlSel.onchange = () => {
          emblemStats[key] = lvlSel.value;
          computeEmblemBonuses(cId);
          updatePotentials();
          generate();
        };

        row.appendChild(statSel);
        row.appendChild(lvlSel);
        statsDiv.appendChild(row);
      }

      card.appendChild(statsDiv);
      emblemContainer.appendChild(card);    // direct child of the grid
    }

    // Output column – the 4th grid cell
    const emblemOutputContainer = document.createElement('div');
    emblemOutputContainer.className = 'emblem-output-container';

    const emblemOutput = document.createElement('div');
    emblemOutput.className = 'emblem-output';
    emblemOutput.id = `emblem-output-${cId}`;
    emblemOutput.textContent = '—';

    const btnRow = document.createElement('div');
    btnRow.className = 'emblem-output-btn-row';

    const feedbackSpan = document.createElement('span');
    feedbackSpan.className = 'emblem-feedback';
    feedbackSpan.id = `emblem-feedback-${cId}`;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'emblem-output-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = () => copyEmblemOutput(cId);
    btnRow.appendChild(copyBtn);

    const copyAllBtn = document.createElement('button');
    copyAllBtn.className = 'emblem-output-btn';
    copyAllBtn.textContent = 'Copy All';
    copyAllBtn.onclick = () => copyAllEmblems(cId);
    btnRow.appendChild(copyAllBtn);

    btnRow.appendChild(feedbackSpan);
    emblemOutputContainer.appendChild(emblemOutput);
    emblemOutputContainer.appendChild(btnRow);
    emblemContainer.appendChild(emblemOutputContainer);   // 4th grid cell

    emblemSection.appendChild(emblemContainer);
    page.appendChild(emblemSection);
    
    content.appendChild(page);
    updateEmblemOutput(cId);
  });
}

function updateEmblemOutput(cId) {
  console.log(cId, document.getElementById(`emblem-output-${cId}`));
  const outputEl = document.getElementById(`emblem-output-${cId}`);
  if (!outputEl) return;

  const lines = [];
  for (let e = 0; e < 3; e++) {
    const statIds = [];
    const base = [101, 6001, 9401];
    for (let s = 0; s < 4; s++) {
      const key = `${cId}_${e}_${s}`;
      const val = emblemStats[key];
      if (val) 
        statIds.push(val);
      else
        statIds.push(base[e])
    }
    if (statIds.filter(x => base.includes(x)).length != 4)
      lines.push(`emblem ${cId} ${e + 1} ${statIds.join(' ')} @${playerId}`);
  }
  outputEl.textContent = lines.length > 0 ? lines.join('\n')+'\n' : '—';
}

function tryAddEmblemLevel(charId, potId, potMap, allEmblemGroups) {
  const info = potMap[potId];
  if (!info) return false;
  const { emblemIdx, typeId } = info;
  const typeIdStr = String(typeId);
  const groups = allEmblemGroups[emblemIdx];
  if (!groups || !groups[typeIdStr]) return false;
  const entries = groups[typeIdStr].entries;
  if (!entries.length) return false;

  // 1. Find a slot already using this stat group
  let targetS = -1;
  for (let s = 0; s < 4; s++) {
    const key = `${charId}_${emblemIdx}_${s}`;
    if (emblemStatGroups[key] === typeIdStr) {
      targetS = s;
      break;
    }
  }

  // 2. If none, find an empty slot
  if (targetS === -1) {
    for (let s = 0; s < 4; s++) {
      const key = `${charId}_${emblemIdx}_${s}`;
      if (!emblemStatGroups[key] || emblemStatGroups[key] === '') {
        targetS = s;
        break;
      }
    }
  }

  if (targetS === -1) return false; // no suitable slot

  const key = `${charId}_${emblemIdx}_${targetS}`;
  emblemStatGroups[key] = typeIdStr;       // ensure group is set

  const currentEntryId = emblemStats[key];
  let currentLevel = 0;
  if (currentEntryId) {
    const cur = entries.find(e => String(e.id) === String(currentEntryId));
    if (cur) currentLevel = cur.level;
  }

  const maxLevel = entries[entries.length - 1].level;
  let nextLevel = currentLevel + 1;
  if (nextLevel > maxLevel) nextLevel = maxLevel;

  const nextEntry = entries.find(e => e.level === nextLevel);
  if (nextEntry) {
    emblemStats[key] = String(nextEntry.id);
  }
  return true;
}

function tryRemoveEmblemLevel(charId, potId, potMap, allEmblemGroups) {
  const info = potMap[potId];
  if (!info) return false;
  const typeIdStr = String(info.typeId);

  // Search across all emblems (prioritise Emblem 3 → 2 → 1)
  for (let e = 2; e >= 0; e--) {
    const groups = allEmblemGroups[e];
    if (!groups || !groups[typeIdStr]) continue;
    const entries = groups[typeIdStr].entries;

    for (let s = 0; s < 4; s++) {
      const key = `${charId}_${e}_${s}`;
      if (emblemStatGroups[key] === typeIdStr) {
        const currentEntryId = emblemStats[key];
        if (!currentEntryId) continue;
        const cur = entries.find(en => String(en.id) === String(currentEntryId));
        if (!cur) continue;
        const currentLevel = cur.level;

        if (currentLevel <= 1) {
          // Remove the stat completely
          emblemStatGroups[key] = '';
          emblemStats[key] = '';
        } else {
          const prevLevel = currentLevel - 1;
          const prevEntry = entries.find(en => en.level === prevLevel);
          if (prevEntry) {
            emblemStats[key] = String(prevEntry.id);
          }
        }
        return true;
      }
    }
  }
  return false;
}

function copyEmblemOutput(cId) {
  const outputEl = document.getElementById(`emblem-output-${cId}`);
  if (!outputEl) return;
  const txt = outputEl.textContent;
  if (!txt || txt === '—') return;

  navigator.clipboard.writeText(txt).then(() => {
    const fb = document.getElementById(`emblem-feedback-${cId}`);
    if (fb) {
      fb.textContent = 'copied';
      setTimeout(() => { fb.textContent = ''; }, 1500);
    }
  }).catch(() => {});
}

function copyAllEmblems(clickedCharId) {
  const allLines = [];
  selectedChars.forEach(cId => {
    if (!cId) return;
    const outEl = document.getElementById(`emblem-output-${cId}`);
    if (outEl && outEl.textContent && outEl.textContent !== '—') {
      allLines.push(outEl.textContent.trim());
    }
  });

  if (allLines.length === 0) return;

  const text = allLines.join('\n')+'\n';
  navigator.clipboard.writeText(text).then(() => {
    const fb = document.getElementById(`emblem-feedback-${clickedCharId}`);
    if (fb) {
      fb.textContent = 'copied all';
      setTimeout(() => { fb.textContent = ''; }, 1500);
    }
  }).catch(() => {});
}

function formatDescriptionWithColor(desc) {
  // Replace <color=#XXXXXX>text</color> with <span style="color:#XXXXXX;">text</span>
  let result = desc.replace(/<color=#([0-9a-fA-F]{6})>(.*?)<\/color>/g, '<span style="color:#$1;">$2</span>');
  // Remove ##Some Text#1234# markup – keep only the inner text
  result = result.replace(/##(.*?)#\d+#/g, '$1');
  return result;
}

function formatPotentialDesc(id, params) {
  const key = `Potential.${id}.2`;
  let template = potentialDesc[key];
  if (!template) {
    console.warn(`Missing description for ${key}`);
    return `[No description available for ${id}]`;
  }

  // Ensure params is an array and convert numbers to strings
  if (!Array.isArray(params)) params = [];
  params = params.map(p => (p !== undefined && p !== null) ? String(p) : '');

  const currentLevel = potLevels[id] || 0;

  function getTierValue(str, level) {
    if (!str || typeof str !== 'string') return str;
    const parts = str.split('/');
    if (parts.length === 1) return str;
    if (parts.length === 13) {
      return parts[9] || str;
    }
    let idx;
    if (level === 0) {
      idx = 5;
    } else {
      idx = Math.min(parts.length - 1, Math.max(0, level - 1));
    }
    return parts[idx] || str;
  }

  let result = template;
  // Replace &Param1& ... &Param10&
  for (let i = 1; i <= 15; i++) {
    const placeholder = `&Param${i}&`;
    if (result.includes(placeholder)) {
      let rawValue = (i-1 < params.length) ? String(params[i-1]) : '?';
      if (rawValue.includes('/')) {
        rawValue = getTierValue(rawValue, currentLevel);
      }
      result = result.replace(new RegExp(placeholder, 'g'), rawValue);
    }
  }

  result = formatDescriptionWithColor(result);
  return result;
}

// -------------------------------------------------- NOTES -----------------------------------------
function getRelevantElements() {
  const elements = new Set();
  for (let i = 0; i < 3; i++) {
    const d = selectedDiscs[i];
    if (d && discData[d]) elements.add(discData[d].element);
  }
  selectedChars.forEach(id => {
    if (id && charJson[id]?.element) elements.add(charJson[id].element);
  });
  return elements;
}

function updateNotes() {
  const sec = document.getElementById('notesSection');
  const grid = document.getElementById('notesGrid');
  sec.style.display = '';
  grid.innerHTML = '';

  const elements = getRelevantElements();
  const elementNoteIds = new Set(Object.values(ELEMENT_NOTE));
  const toShow = NOTE_IDS.filter(id => {
    if (!elementNoteIds.has(id)) return true;
    for (const [el, nid] of Object.entries(ELEMENT_NOTE)) {
      if (nid === id) return elements.has(el);
    }
    return false;
  });

  toShow.forEach(id => {
    if (noteCounts[id] === undefined) noteCounts[id] = 20;
    const item = document.createElement('div');
    item.className = 'note-item';

    const img = document.createElement('img');
    img.src = BASE_ASSETS + `export/assets/assetbundles/icon/note/note_${id}_S.webp`;
    img.onerror = () => { item.style.display = 'none'; };

    const nm = document.createElement('div');
    nm.className = 'nname'; nm.textContent = getNoteShortName(id);

    const controls = document.createElement('div');
    controls.className = 'note-controls';

    const btnMinus = document.createElement('button');
    btnMinus.className = 'note-btn'; btnMinus.textContent = '−';

    const inp = document.createElement('input');
    inp.className = 'note-val';
    inp.type = 'number'; inp.min = 0; inp.max = 9999; inp.value = noteCounts[id];
    inp.oninput = () => { noteCounts[id] = Math.max(0, +inp.value || 0); };

    const btnPlus = document.createElement('button');
    btnPlus.className = 'note-btn'; btnPlus.textContent = '+';

    btnMinus.onclick = () => { noteCounts[id] = Math.max(0, (noteCounts[id]||0) - 5); inp.value = noteCounts[id]; generate(); };
    btnPlus.onclick = () => { noteCounts[id] = (noteCounts[id]||0) + 5; inp.value = noteCounts[id]; generate(); };
    inp.onchange = () => generate();

    controls.appendChild(btnMinus); controls.appendChild(inp); controls.appendChild(btnPlus);
    item.appendChild(img); item.appendChild(nm); item.appendChild(controls);
    grid.appendChild(item);
  });
}

function getNoteShortName(id) {
  return {90011:'Pummel',90012:'Luck',90013:'Burst',90014:'Stamina',90015:'Focus',
    90016:'Skill',90017:'Ultimate',90018:'Aqua',90019:'Ignis',90020:'Ventus',
    90021:'Terra',90022:'Lux',90023:'Umbra'}[id] || id;
}

// -------------------------------------------------- GENERATE -----------------------------------------
function updateBase64() {
  const importInp = document.getElementById('importInput');
  if (importInp && document.activeElement !== importInp) {
    try { importInp.value = packPotentials(); } catch(e) { importInp.value = ''; }
  }
}

function generate() {
  const out = document.getElementById('output');
  const chars = selectedChars.filter(c => c);
  updateBase64();
  if (!chars.length) { out.textContent = '— select characters —'; out.style.color='#a66'; return; }
  if (selectedDiscs.slice(0, 3).filter(d => d).length < 3) { out.textContent = '— select main discs —'; out.style.color='#a66'; return; }

  let parts = ['build', ...chars, ...selectedDiscs.filter(id => id != null)];

  const potIds = [];
  const addPots = (cId, keys) => { const d = charJson[cId]; if (d?.potential) keys.forEach(k => (d.potential[k]||[]).forEach(p => potIds.push(p.id))); };
  if (chars[0]) addPots(chars[0], ['mainCore','mainNormal','common']);
  for (let i = 1; i < chars.length; i++) addPots(chars[i], ['supportCore','supportNormal','common']);
  const seen = new Set();
  potIds.forEach(id => { 
    if (!seen.has(id)) { 
      seen.add(id); 
      const lvl = potLevels[id]||0; 
      if (lvl > 0) {
        const totalLevel = potLevels[id];
        if (totalLevel > 0) parts.push(`${id}:${totalLevel}`);
      }
    }
  });

  const elements = getRelevantElements();
  const elementNoteIds = new Set(Object.values(ELEMENT_NOTE));
  NOTE_IDS.forEach(id => {
    if (elementNoteIds.has(id)) {
      let show = false;
      for (const [el, nid] of Object.entries(ELEMENT_NOTE)) { if (nid === id && elements.has(el)) { show = true; break; } }
      if (!show) return;
    }
    const cnt = noteCounts[id] ?? 20;
    if (cnt > 0) parts.push(`${id}:${cnt}`);
  });

  parts.push('@' + playerId);
  out.textContent = parts.join(' ');
  updateDiscOutputText();
  saveState();
  out.style.color = '#6a8a6a';
}

let outputTimeout = null;

function copyOutputText() {
  const out = document.getElementById('output');
  const txt = out.textContent;
  if (!txt || txt === '—') return;
  
  navigator.clipboard.writeText(txt).then(() => {
    const statusSpan = document.getElementById('outputStatus');
    if (outputTimeout) clearTimeout(outputTimeout);
    statusSpan.textContent = 'Copied';
    statusSpan.style.color = '#6c6';
    outputTimeout = setTimeout(() => {
      statusSpan.textContent = '';
      outputTimeout = null;
    }, 1500);
  }).catch(() => {});
}

let base64Timeout = null;

function copyBase64() {
  const input = document.getElementById('importInput');
  if (!input.value.trim()) return;
  
  navigator.clipboard.writeText(input.value).then(() => {
    const statusSpan = document.getElementById('importStatus');
    if (base64Timeout) clearTimeout(base64Timeout);
    statusSpan.textContent = 'Copied';
    statusSpan.style.color = '#6c6';
    base64Timeout = setTimeout(() => {
      if (statusSpan.textContent === 'Copied') {
        statusSpan.textContent = '';
      }
      base64Timeout = null;
    }, 1500);
  }).catch(() => {});
}

document.addEventListener('click', (e) => { if (!e.target.closest('.disc-picker')) closeAllDiscDD(); });

// -------------------------------------------------- BASE64 ENCODE/DECODE -----------------------------------------
function b64ToBytes(b64) {
  b64 = b64.replace(/\s+/g,'').replace(/-/g,'+').replace(/_/g,'/');
  b64 = b64.replace(/[^A-Za-z0-9+/=]/g,'');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function buildCfgMap(charIds) {
  const map = {};
  charIds.forEach(id => {
    const c = charJson[id];
    if (!c?.potential) return;
    const ids = key => (c.potential[key] || []).map(p => p.id);
    map[+id] = {
      MasterSpecificPotentialIds: ids('mainCore'),
      MasterNormalPotentialIds:   ids('mainNormal'),
      AssistSpecificPotentialIds: ids('supportCore'),
      AssistNormalPotentialIds:   ids('supportNormal'),
      CommonPotentialIds:         ids('common'),
    };
  });
  return map;
}

function packPotentials() {
  const chars = [
    selectedChars[0] ? +selectedChars[0] : 0,
    selectedChars[1] ? +selectedChars[1] : 0,
    selectedChars[2] ? +selectedChars[2] : 0,
  ];
  const cfgMap = buildCfgMap(selectedChars.filter(c => c));

  const bits = [];
  const writeBits = (val, n) => { for (let i = n-1; i >= 0; i--) bits.push((val >>> i) & 1); };

  chars.forEach(id => writeBits(id >>> 0, 32));

  chars.forEach((id, idx) => {
    const cfg = cfgMap[id];
    if (!cfg) return;
    const isMain = idx === 0;
    const specIds  = isMain ? cfg.MasterSpecificPotentialIds : cfg.AssistSpecificPotentialIds;
    const normIds  = isMain ? cfg.MasterNormalPotentialIds   : cfg.AssistNormalPotentialIds;
    const commIds  = cfg.CommonPotentialIds;

    specIds.forEach(pid => writeBits(potLevels[pid] > 0 ? 1 : 0, 1));
    normIds.forEach(pid => writeBits(Math.min(7, potLevels[pid] || 0), 3));
    commIds.forEach(pid => writeBits(Math.min(7, potLevels[pid] || 0), 3));
  });

  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i+j] || 0);
    bytes.push(byte & 0xFF);
  }
  return bytesToB64(new Uint8Array(bytes));
}

function unpackPotentials(b64) {
  const bytes = b64ToBytes(b64);
  const bits = [];
  for (const byte of bytes) for (let j = 7; j >= 0; j--) bits.push((byte >> j) & 1);

  let idx = 0;
  const readBits = n => {
    let v = 0;
    for (let i = n-1; i >= 0; i--) v += (bits[idx++] || 0) << i;
    return v >>> 0;
  };

  const charIds = [readBits(32), readBits(32), readBits(32)];
  for (const id of charIds) {
    if (id !== 0 && !charJson[id]) throw new Error(`Unknown character id ${id}`);
  }

  const cfgMap = buildCfgMap(charIds.filter(id => id !== 0).map(String));
  const result = {};

  charIds.forEach((id, slot) => {
    const cfg = cfgMap[id];
    if (!cfg) return;
    const isMain = slot === 0;
    const specIds = isMain ? cfg.MasterSpecificPotentialIds : cfg.AssistSpecificPotentialIds;
    const normIds = isMain ? cfg.MasterNormalPotentialIds   : cfg.AssistNormalPotentialIds;
    const commIds = cfg.CommonPotentialIds;

    specIds.forEach(pid => { const f = readBits(1); result[pid] = f ? 1 : 0; });
    normIds.forEach(pid => { result[pid] = readBits(3); });
    commIds.forEach(pid => { result[pid] = readBits(3); });
  });
  return { charIds, potentials: result };
}

function importPotentials() {
  const raw = document.getElementById('importInput').value.trim();
  const status = document.getElementById('importStatus');
  if (!raw) { status.textContent = ''; return; }

  try {
    const { charIds, potentials } = unpackPotentials(raw);
    const validIds = charIds.map(String).filter(id => id !== '0' && charData[id]);
    selectedChars = [validIds[0]||null, validIds[1]||null, validIds[2]||null];
    Object.entries(potentials).forEach(([pid, lvl]) => { potLevels[+pid] = lvl; });
    refreshCharBadges();
    updatePotentials();
    updateNotes();
    generate();

    const names = validIds.map(id => charData[id] || id).join(', ');
    status.textContent = `✓ Imported: ${names}`;
    status.className = 'import-status ok';
  } catch(e) {
    status.textContent = `✗ ${e.message}`;
    status.className = 'import-status bad';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('importInput');
  if (inp) {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') importPotentials(); });
    inp.addEventListener('paste', () => { setTimeout(importPotentials, 0); });
  }
  document.getElementById('copyOutputBtn')?.addEventListener('click', copyOutputText);

  // Player ID input - value will be set in init() after loadState()
  const playerIdInput = document.getElementById('playerIdInput');
  if (playerIdInput) {
    playerIdInput.addEventListener('input', () => {
      playerId = playerIdInput.value;
      saveState();
      generate();
    });
  }


});

function clearDiscs() {
  selectedDiscs = ["212005", "211006", "211005", null, null, null];
  discCopies = {};
  renderDiscs();
  renderDiscOutput();
  updateNotes();
  saveState();
  generate();
}

function clearPotentials() {
  potLevels = {};
  saveState();
  updatePotentials();
  generate();
}

function clearEmblems(cId) {
  for (const key of Object.keys(emblemStats)) {
    if (key.startsWith(cId + '_')) { emblemStats[key] = ''; emblemStatGroups[key] = ''; }
  }
  computeEmblemBonuses(cId);
  saveState();
  updatePotentials();
  generate();
}

function clearNotes() {
  noteCounts = {};
  saveState();
  updateNotes();
  generate();
}

function clearAll() {
  selectedChars = [null, null, null];
  selectedDiscs = ["212005", "211006", "211005", null, null, null];
  discCopies = {};
  potLevels = {};
  emblemStats = {};
  emblemStatGroups = {};
  emblemPotBonuses = {};
  noteCounts = {};
  activePotTab = 0;
  saveState();
  refreshCharBadges();
  renderDiscs();
  renderDiscOutput();
  updateNotes();
  updatePotentials();
  generate();
}

async function preloadAllDiscImages() {
  if (discImagesPreloaded) return;
  const ids = Object.keys(discData);
  for (const id of ids) {
    const imgId = String(id).slice(2);
    const img = new Image();
    img.src = BASE_ASSETS + `export/assets/assetbundles/icon/outfit/outfit_${imgId}.webp`;
  }
  discImagesPreloaded = true;
}

async function init() {
  try {
    [charData, discData, charJson] = await Promise.all([
      fetchJSON(BASE_RAW + 'characterid.json'),
      fetchJSON(BASE_RAW + 'disc.json'),
      fetchJSON(BASE_RAW + 'character.json'),
    ]);
    // Load saved state before rendering UI
    loadState();
    // Update player ID input with loaded value
    const playerIdInput = document.getElementById('playerIdInput');
    if (playerIdInput) playerIdInput.value = playerId;
    await renderChars();
    renderDiscs();
    renderDiscOutput();
    updateNotes();
    refreshCharBadges();
    updatePotentials();
    generate();
  } catch(e) {
    document.getElementById('charGrid').innerHTML = `<span class="err">Error loading data: ${e.message}</span>`;
  }
  try {
    const potLang = await fetchJSON(BASE_RAW + 'EN/language/en_US/Potential.json');
    potentialDesc = potLang;
  } catch(e) { console.warn('Could not load potential descriptions', e); }
  try {
    [emblemAttrData, itemData] = await Promise.all([
      fetchJSON(BASE_RAW + 'EN/bin/CharGemAttrValue.json'),
      fetchJSON(BASE_RAW + 'EN/language/en_US/Item.json'),
    ]);
  } catch(e) { console.warn('Could not load emblem attr data', e); }

  try {
    charGemAttrGroups = await fetchJSON('https://raw.githubusercontent.com/Melledy/Nebula/main/src/main/resources/defs/CharGemAttrGroups.json');
    // Build TypeId → slot mapping (1,2,3)
    for (const group of charGemAttrGroups) {
      let slot = null;
      const id = group.Id;
      if (id >= 1 && id <= 4) slot = 1;
      else if ((id >= 5 && id <= 8) || id === 11) slot = 2;
      else if ((id >= 9 && id <= 10) || id === 12) slot = 3;
      if (slot && Array.isArray(group.AttrTypes))
        for (const typeId of group.AttrTypes)
          typeIdToSlot[typeId] = slot;
    }
  } catch(e) { console.warn('Could not load CharGemAttrGroups', e); }

  // Recompute emblem bonuses from loaded state, then re-render potentials now that
  // emblemAttrData + typeIdToSlot are fully loaded so dropdowns populate correctly.
  selectedChars.filter(c => c).forEach(cId => computeEmblemBonuses(cId));
  updatePotentials();
  generate();

  preloadAllDiscImages();
}



init();
