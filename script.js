
const BASE_RAW = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/main/';
const BASE_ASSETS = 'https://raw.githubusercontent.com/AutumnVN/ssassets/main/';

let charData = {}, discData = {}, charJson = {};
let selectedChars = [null, null, null];
let selectedDiscs = [null, null, null, null, null, null];
let potLevels = {};
let noteCounts = {};
let potentialDesc = {};

const NOTE_IDS = [90011,90012,90013,90014,90015,90016,90017,90018,90019,90020,90021,90022,90023];
const ELEMENT_NOTE = {Aqua:90018,Ignis:90019,Ventus:90020,Terra:90021,Lux:90022,Umbra:90023};

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
  updateNotes();
  generate();
}

// -------------------------------------------------- POTENTIALS -----------------------------------------
let activePotTab = 0;

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

        const inp = document.createElement('input');
        inp.className = 'pot-val';
        inp.type = 'number'; inp.min = 0; inp.max = maxLvl; inp.value = potLevels[p.id];
        inp.oninput = () => {
          potLevels[p.id] = Math.min(maxLvl, Math.max(0, +inp.value || 0));
          item.classList.toggle('active', potLevels[p.id] > 0);
          generate();
        };

        const btnPlus = document.createElement('button');
        btnPlus.className = 'pot-btn'; btnPlus.textContent = '+';

        const update = (val) => {
          potLevels[p.id] = Math.min(maxLvl, Math.max(0, val));
          inp.value = potLevels[p.id];
          item.classList.toggle('active', potLevels[p.id] > 0);
          generate();
        };

        btnMinus.onclick = (e) => { e.stopPropagation(); update(potLevels[p.id] - 1); };
        btnPlus.onclick  = (e) => { e.stopPropagation(); update(potLevels[p.id] + 1); };

        item.onclick = (e) => {
          if (e.target === btnMinus || e.target === btnPlus || e.target === inp) return;
          update(potLevels[p.id] > 0 ? 0 : maxLvl);
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
      page.appendChild(groupDiv);
    });

    content.appendChild(page);
  });
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
  if (selectedDiscs.filter(d => d).length < 6) { out.textContent = '— select discs —'; out.style.color='#a66'; return; }

  let parts = ['build', ...chars, ...selectedDiscs];

  const potIds = [];
  const addPots = (cId, keys) => { const d = charJson[cId]; if (d?.potential) keys.forEach(k => (d.potential[k]||[]).forEach(p => potIds.push(p.id))); };
  if (chars[0]) addPots(chars[0], ['mainCore','mainNormal','common']);
  for (let i = 1; i < chars.length; i++) addPots(chars[i], ['supportCore','supportNormal','common']);
  const seen = new Set();
  potIds.forEach(id => { if (!seen.has(id)) { seen.add(id); const lvl = potLevels[id]||0; if (lvl > 0) parts.push(`${id}:${lvl}`); }});

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

  parts.push('@10001');
  out.textContent = parts.join(' ');
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
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') importPotentials(); });
  document.getElementById('copyOutputBtn')?.addEventListener('click', copyOutputText);
});

async function init() {
  try {
    [charData, discData, charJson] = await Promise.all([
      fetchJSON(BASE_RAW + 'characterid.json'),
      fetchJSON(BASE_RAW + 'disc.json'),
      fetchJSON(BASE_RAW + 'character.json'),
    ]);
    await renderChars();
    renderDiscs();
    updateNotes();
  } catch(e) {
    document.getElementById('charGrid').innerHTML = `<span class="err">Error loading data: ${e.message}</span>`;
  }
  try {
    const potLang = await fetchJSON(BASE_RAW + 'EN/language/en_US/Potential.json');
    potentialDesc = potLang;
  } catch(e) { console.warn('Could not load potential descriptions', e); }
}

init();
