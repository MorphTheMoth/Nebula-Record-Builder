let charElementFilters = new Set();
let charRarityFilters = new Set();
// legacy alias (single-filter) kept for compat
let charElementFilter = null;

function getCharStar(id) {
  const s = (typeof charJson !== 'undefined' && charJson[id] != null) ? charJson[id].star : undefined;
  return (s === 4 || s === '4') ? 4 : (s === 5 || s === '5') ? 5 : null;
}

function setCharElementFilter(el) {
  if (el === '__all' || el === 'None') { clearCharElementFilters(); return; }
  if (charElementFilters.has(el)) charElementFilters.delete(el);
  else charElementFilters.add(el);
  charElementFilter = charElementFilters.size === 1 ? [...charElementFilters][0] : null;
  updateCharFilterButtons();
  applyCharElementFilter();
}

function clearCharElementFilters() {
  charElementFilters.clear();
  charElementFilter = null;
  updateCharFilterButtons();
  applyCharElementFilter();
}

function setCharRarityFilter(star) {
  star = Number(star);
  if (charRarityFilters.has(star) && charRarityFilters.size === 1) charRarityFilters.clear();
  else { charRarityFilters.clear(); charRarityFilters.add(star); }
  updateCharFilterButtons();
  applyCharElementFilter();
}

function updateCharFilterButtons() {
  document.querySelectorAll('#charElementFilters .char-filter-btn').forEach(btn => {
    if (btn.dataset.star) {
      btn.classList.toggle('active', charRarityFilters.has(Number(btn.dataset.star)));
      return;
    }
    const el = btn.dataset.element;
    if (el === '__all') btn.classList.toggle('active', charElementFilters.size === 0);
    else btn.classList.toggle('active', charElementFilters.has(el));
  });
}

function applyCharElementFilter() {
  document.querySelectorAll('.char-card').forEach(card => {
    const elOk = charElementFilters.size === 0 || charElementFilters.has(card.dataset.element);
    let starOk = true;
    if (charRarityFilters.size !== 0) {
      const cardStar = card.dataset.star ? Number(card.dataset.star) : getCharStar(card.dataset.charId);
      starOk = cardStar != null && charRarityFilters.has(Number(cardStar));
    }
    card.style.display = (elOk && starOk) ? '' : 'none';
  });
}

async function renderChars() {
  const grid = document.getElementById('charGrid');
  grid.innerHTML = '';

  // Only show released units: charData (characterid.json) contains unreleased
  // IDs not yet present in character.json — hide those from the grid.
  const ids = Object.keys(charData).filter(id => charJson[id] != null).sort((a,b) => +a - +b);
  // Probe the real XXL portrait; chars whose art isn't on ssassets yet stay
  // visible via the playerhead placeholder instead of being dropped.
  const probes = await Promise.all(ids.map(id => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = headXXLUrl(id, '02');
  })));

  const validChars = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const element = charJson[id]?.element || 'Other';
    const star = charJson[id]?.star ?? null;
    validChars.push({ id, element, star, name: charData[id] || charJson[id]?.name || id, hasArt: probes[i] });
  }

  const elementOrder = { Aqua:0, Ignis:1, Ventus:2, Terra:3, Lux:4, Umbra:5, Other:6 };
  validChars.sort((a,b) => {
    const ea = elementOrder[a.element] ?? 99;
    const eb = elementOrder[b.element] ?? 99;
    if (ea !== eb) return ea - eb;
    return a.name.localeCompare(b.name);
  });

  for (const ch of validChars) {
    const div = document.createElement('div');
    div.className = 'char-card';
    div.dataset.charId = ch.id;
    div.dataset.element = ch.element;
    if (ch.star != null) div.dataset.star = String(ch.star);

    div.appendChild(headCropEl(
      ch.hasArt ? headXXLUrl(ch.id, '02') : FALLBACK_HEAD_XXL_URL,
      FALLBACK_HEAD_XXL_URL));

    const lbl = document.createElement('div');
    lbl.className = 'label'; lbl.textContent = ch.name;
    div.appendChild(lbl);

    div.onclick = () => toggleChar(ch.id);
    grid.appendChild(div);
  }

  refreshCharBadges();
  applyCharElementFilter();
}

function refreshCharBadges() {
  document.querySelectorAll('.char-card').forEach(card => {
    const id = card.dataset.charId;
    const slotIdx = selectedChars.indexOf(id);
    card.classList.toggle('selected', slotIdx >= 0);
    let badge = card.querySelector('.slot-badge');
    if (slotIdx >= 0) {
      if (!badge) { badge = document.createElement('span'); badge.className = 'slot-badge'; card.appendChild(badge); }
      badge.textContent = slotIdx < 3 ? `#${slotIdx + 1}` : '+';
    } else {
      if (badge) badge.remove();
    }
  });
  syncDiscSelTeamElements();
}

function toggleChar(id) {
  const idx = selectedChars.indexOf(id);
  if (idx >= 0) {
    selectedChars.splice(idx, 1);
  } else {
    selectedChars.push(id);
  }
  if (!selectedChars.length) {
    currentBuildId = null;
    localStorage.removeItem(CURRENT_BUILD_KEY);
    updatePotSaveButton();
  }
  refreshCharBadges();
  updatePotentials();
  updateNotes();
  generate();
}

function createDiscSlot(i) {
    const labels = ['Main','Main','Main','Support','Support','Support'];
    const slot = document.createElement('div');
    slot.className = 'disc-slot';
    slot.innerHTML = `<div class="disc-slot-label">${labels[i]}</div>`;
    const picker = document.createElement('div');
    picker.className = 'disc-picker';
    const thumb = document.createElement('div');
    thumb.className = 'disc-thumb' + (selectedDiscs[i] ? ' selected' : '') + (activeDiscSlot === i ? ' picking' : '');
    thumb.dataset.discSlot = String(i);
    if (selectedDiscs[i]) {
      const thumbImg = document.createElement('img');
      thumbImg.decoding = 'sync';
      thumbImg.draggable = false;
      discImg(thumbImg, selectedDiscs[i]);
      thumb.appendChild(thumbImg);
    } else {
      thumb.innerHTML = `<span class="plus">+</span>`;
    }
    thumb.onclick = (e) => { e.stopPropagation(); openDiscSelForSlot(i); };
    if (selectedDiscs[i]) attachDiscTooltip(thumb, selectedDiscs[i]);
    slot.dataset.discSlot = String(i);
    if (selectedDiscs[i]) {
      thumb.draggable = true;
      thumb.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.setData('text/x-disc-slot', String(i));
        ev.dataTransfer.effectAllowed = 'move';
        try { ev.dataTransfer.setData('text/plain', String(i)); } catch (err) {}
        thumb.classList.add('dragging');
      });
      thumb.addEventListener('dragend', () => {
        thumb.classList.remove('dragging');
        document.querySelectorAll('#discRow .drag-over').forEach(el => el.classList.remove('drag-over'));
      });
      thumb.addEventListener('touchstart', () => { thumb.dataset.touchSrc = String(i); thumb.classList.add('dragging'); }, { passive: true });
      thumb.addEventListener('touchend', (ev) => {
        thumb.classList.remove('dragging');
        const fromIdx = Number(thumb.dataset.touchSrc);
        const t = ev.changedTouches && ev.changedTouches[0];
        if (!t || Number.isNaN(fromIdx)) return;
        const target = document.elementFromPoint(t.clientX, t.clientY);
        const slotTarget = target && target.closest ? target.closest('#discRow .disc-slot') : null;
        if (!slotTarget) return;
        const toIdx = Number(slotTarget.dataset.discSlot);
        if (!Number.isNaN(toIdx) && toIdx !== fromIdx) { ev.preventDefault(); swapDiscSlots(fromIdx, toIdx); }
      });
    }
    slot.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      let isDiscDrop = false;
      try {
        const types = ev.dataTransfer.types || [];
        for (let t = 0; t < types.length; t++) {
          if (types[t] === 'text/x-disc-id') { isDiscDrop = true; break; }
        }
      } catch (err) {}
      ev.dataTransfer.dropEffect = isDiscDrop ? 'copy' : 'move';
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', (ev) => {
      ev.preventDefault();
      slot.classList.remove('drag-over');
      let discDrop = null;
      try { discDrop = ev.dataTransfer.getData('text/x-disc-id'); } catch (err) {}
      if (discDrop && typeof discData !== 'undefined' && discData[discDrop]) {
        // No duplicates via drag either
        if ((selectedDiscs || []).includes(discDrop)) return;
        selectDisc(i, discDrop);
        return;
      }
      let fromRaw = null;
      try { fromRaw = ev.dataTransfer.getData('text/x-disc-slot'); } catch (err) {}
      if (fromRaw === null || fromRaw === '' || fromRaw === undefined) { try { fromRaw = ev.dataTransfer.getData('text/plain'); } catch (err) {} }
      const fromIdx = Number(fromRaw);
      if (Number.isNaN(fromIdx) || fromIdx === i) return;
      swapDiscSlots(fromIdx, i);
    });

    picker.appendChild(thumb);
    // Notes overlay on the slot itself: Main discs show the harmony notes they
    // need, Support discs show the notes they give (same look as the grid).
    if (selectedDiscs[i]) {
      const noteOverlay = buildDiscNoteOverlay(selectedDiscs[i], i < 3 ? 'main' : 'support');
      if (noteOverlay) picker.appendChild(noteOverlay);
    }
    slot.appendChild(picker);

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
      const placeholder = document.createElement('div');
      placeholder.className = 'disc-copies-ctrl';
      placeholder.style.height = '22px';
      slot.appendChild(placeholder);
    }

    return slot;
}

function renderDiscRow() {
  const row = document.getElementById('discRow');
  if (!row) return;
  row.innerHTML = '';
  // Warm the outfit image cache so the drag ghost includes them on the first drag
  selectedDiscs.forEach((dId) => {
    if (!dId) return;
    try {
      const warm = new Image();
      warm.decoding = 'sync';
      discImg(warm, dId);
      if (warm.decode) warm.decode().catch(() => {});
    } catch (err) {}
  });
  for (let i = 0; i < 6; i++) {
    if (i === 3) { const sep = document.createElement('div'); sep.className = 'sep'; row.appendChild(sep); }
    row.appendChild(createDiscSlot(i));
  }
}

function renderDiscs() {
  renderDiscRow();
  ensureDiscSelInit();
  syncDiscSelTeamElements();
  updateDiscSelectionState();
}

function refreshDiscSlot(i) {
  const row = document.getElementById('discRow');
  if (!row) return;
  const old = row.querySelector(`.disc-slot[data-disc-slot="${i}"]`);
  if (!old) { renderDiscRow(); return; }
  old.replaceWith(createDiscSlot(i));
}

function updateDiscSelectionState() {
  updateDiscPickingHighlight();
  const inUse = new Set();
  (selectedDiscs || []).forEach((sid) => { if (sid) inUse.add(sid); });
  document.querySelectorAll('#discSelGrid .disc-sel-card').forEach(card => {
    if (card.dataset.discId) card.classList.toggle('in-use', inUse.has(card.dataset.discId));
  });
}

// ---- Disc selection submenu (in-discs-section grid, folded by default) ----
let activeDiscSlot = null;
let discSelElements = new Set();
let discSelStars = new Set([5]);
let discSelSource = '';
let discSelHighlight = 'main';
let discSelInitialized = false;

function getDiscSelDefaultElements() {
  const els = new Set();
  (selectedChars || []).filter(c => c).slice(0, 3).forEach(id => {
    const el = (typeof charJson !== 'undefined' && charJson[id]) ? charJson[id].element : null;
    if (el) els.add(el);
  });
  return els;
}

function resetDiscSelFiltersToDefaults() {
  discSelElements = getDiscSelDefaultElements();
  discSelStars = new Set([5]);
  discSelSource = '';
  updateDiscSelFilterButtons();
}

// Keep the disc element filter aligned with the current team. The filter is
// derived from the selected characters' elements, so any change to the team
// (selecting/clearing/reordering characters, loading a build, importing) must
// refresh it — otherwise the grid keeps showing the team from first load.
// Star/source filters are left alone; they're not derived from characters.
function syncDiscSelTeamElements() {
  if (!discSelInitialized) return;
  const newEls = getDiscSelDefaultElements();
  const same = discSelElements.size === newEls.size &&
    [...newEls].every(el => discSelElements.has(el));
  if (same) return;
  discSelElements = newEls;
  updateDiscSelFilterButtons();
  renderDiscSelection();
}

function ensureDiscSelInit() {
  if (discSelInitialized) return;
  if (typeof discData === 'undefined' || !discData) return;
  const bar = document.getElementById('discSelFilters');
  if (!bar) return;
  discSelInitialized = true;
  resetDiscSelFiltersToDefaults();
  renderDiscSelFilters();
  renderDiscSelection();
}

function renderDiscSelFilters() {
  const bar = document.getElementById('discSelFilters');
  if (!bar) return;
  bar.innerHTML = '';
  const mkEl = (el, img, title, onclick, isText) => {
    const b = document.createElement('button');
    b.className = 'char-filter-btn' + (isText ? ' star-btn none-btn' : '');
    b.dataset.element = el;
    b.title = title;
    if (isText) {
      b.textContent = 'NONE';
    } else {
      const im = document.createElement('img');
      im.src = img;
      im.alt = el;
      b.appendChild(im);
    }
    b.onclick = onclick;
    bar.appendChild(b);
    return b;
  };
  mkEl('__all', null, 'Show all', clearDiscSelElementFilters, true);
  mkEl('None', 'data/disc badges/None.avif', 'Show only None', () => setDiscSelElementFilter('None'));
  ['Aqua', 'Ignis', 'Ventus', 'Terra', 'Lux', 'Umbra'].forEach(el => {
    mkEl(el, `data/disc badges/${el}.avif`, `Show only ${el}`, () => setDiscSelElementFilter(el));
  });
  const sep = document.createElement('div');
  sep.className = 'char-filter-sep';
  bar.appendChild(sep);
  [3, 4, 5].forEach(star => {
    const b = document.createElement('button');
    b.className = 'char-filter-btn star-btn';
    b.dataset.star = String(star);
    b.title = `Filter ${star}-star`;
    b.textContent = `${star}★`;
    b.onclick = () => setDiscSelStarFilter(star);
    bar.appendChild(b);
  });
  const srcSep = document.createElement('div');
  srcSep.className = 'char-filter-sep';
  bar.appendChild(srcSep);
  const srcSel = document.createElement('select');
  srcSel.className = 'priority-select';
  srcSel.id = 'discSelSource';
  srcSel.title = 'Filter by source';
  [['', 'All sources'], ['Limited', 'Limited'], ['Standard', 'Standard'], ['Event', 'Event'], ['f2p', 'F2P']].forEach(([val, label]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    srcSel.appendChild(opt);
  });
  srcSel.value = discSelSource || '';
  srcSel.onchange = () => setDiscSelSourceFilter(srcSel.value);
  bar.appendChild(srcSel);
  const hlSep = document.createElement('div');
  hlSep.className = 'char-filter-sep';
  bar.appendChild(hlSep);
  const hlSeg = document.createElement('div');
  hlSeg.className = 'disc-sel-hl-seg';
  hlSeg.id = 'discSelHlSeg';
  [['main', 'Main'], ['support', 'Support']].forEach(([val, label]) => {
    const b = document.createElement('button');
    b.className = 'disc-sel-hl-btn';
    b.dataset.hl = val;
    b.title = val === 'main' ? 'Highlight harmony notes needed' : 'Highlight support notes given';
    b.textContent = label;
    b.onclick = () => setDiscSelHighlight(val);
    hlSeg.appendChild(b);
  });
  bar.appendChild(hlSeg);
  updateDiscSelFilterButtons();
}

function updateDiscSelFilterButtons() {
  document.querySelectorAll('#discSelFilters .char-filter-btn').forEach(btn => {
    if (btn.dataset.star) {
      btn.classList.toggle('active', discSelStars.has(Number(btn.dataset.star)));
      return;
    }
    const el = btn.dataset.element;
    if (el === '__all') btn.classList.toggle('active', discSelElements.size === 0);
    else btn.classList.toggle('active', discSelElements.has(el));
  });
  const srcSel = document.getElementById('discSelSource');
  if (srcSel) srcSel.value = discSelSource || '';
  document.querySelectorAll('#discSelHlSeg .disc-sel-hl-btn').forEach(btn => {
    btn.classList.toggle('active', discSelHighlight === btn.dataset.hl);
  });
}

function applyDiscSelHighlight(val) {
  discSelHighlight = val || '';
  document.querySelectorAll('#discSelHlSeg .disc-sel-hl-btn').forEach(btn => {
    btn.classList.toggle('active', discSelHighlight === btn.dataset.hl);
  });
  updateDiscSelNoteOverlays();
}

function setDiscSelHighlight(val) {
  applyDiscSelHighlight(discSelHighlight === val ? '' : val);
}

// Highlight mode follows the slot being filled: main slots (0-2) → 'main',
// support slots (3-5) → 'support'. With no slot, use the first empty slot's
// role (so the Main/Support button auto-selects as you move through the row).
function discHighlightForSlot(i) {
  const idx = (i != null) ? i : (selectedDiscs || []).findIndex(d => !d);
  if (idx < 0) return 'main';
  return idx < 3 ? 'main' : 'support';
}

function getDiscSelNotes(id, mode) {
  const d = (typeof discData !== 'undefined' && discData) ? discData[id] : null;
  mode = mode || discSelHighlight;
  if (!d || !mode) return [];
  const out = new Map();
  if (mode === 'main') {
    [d.secondarySkill1, d.secondarySkill2].forEach(sk => {
      const req = sk && sk.req1;
      if (!req) return;
      for (const [melody, qty] of Object.entries(req)) {
        const prev = out.get(melody) || 0;
        out.set(melody, Math.max(prev, Number(qty) || 0));
      }
    });
  } else if (mode === 'support') {
    const sup = d.support;
    if (!sup) return [];
    for (const [melody, qty] of Object.entries(sup)) out.set(melody, Number(qty) || 0);
  }
  const notes = [];
  for (const [melody, qty] of out.entries()) {
    const nid = discMelodyToNoteId(melody);
    if (!nid) continue;
    notes.push({ melody: String(melody).replace(/^Melody of\s+/i, ''), qty, nid });
  }
  const order = { Pummel: 0, Luck: 1, Burst: 2, Stamina: 3, Focus: 4, Skill: 5, Ultimate: 6, Aqua: 7, Ignis: 8, Ventus: 9, Terra: 10, Lux: 11, Umbra: 12 };
  notes.sort((a, b) => (order[a.melody] ?? 99) - (order[b.melody] ?? 99));
  return notes;
}

// Build the note-icon overlay (bottom-right) for a disc. `mode` is 'main'
// (harmony notes the disc needs, icons only) or 'support' (notes it gives,
// with the quantity beside each icon). Returns null when there is nothing.
function buildDiscNoteOverlay(id, mode) {
  if (!id || !mode) return null;
  const notes = getDiscSelNotes(id, mode);
  if (!notes.length) return null;
  const div = document.createElement('div');
  div.className = 'disc-sel-notes ' + mode;
  const showQty = mode !== 'main';
  notes.forEach(n => {
    const chip = document.createElement('span');
    chip.className = 'disc-sel-note';
    chip.title = `${n.melody} ×${n.qty}`;
    if (showQty) {
      const q = document.createElement('span');
      q.className = 'disc-sel-note-qty';
      q.textContent = n.qty;
      chip.appendChild(q);
    }
    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.draggable = false;
    noteImg(img, n.nid);
    chip.appendChild(img);
    div.appendChild(chip);
  });
  return div;
}

function updateDiscSelNoteOverlays() {
  document.querySelectorAll('#discSelGrid .disc-sel-card').forEach(card => {
    const old = card.querySelector('.disc-sel-notes');
    if (old) old.remove();
    if (!discSelHighlight) return;
    const wrap = card.querySelector('.disc-sel-imgwrap');
    if (!wrap) return;
    const el = buildDiscNoteOverlay(card.dataset.discId, discSelHighlight);
    if (el) wrap.appendChild(el);
  });
}

function setDiscSelSourceFilter(val) {
  discSelSource = val || '';
  updateDiscSelFilterButtons();
  renderDiscSelection();
}

function setDiscSelElementFilter(el) {
  if (discSelElements.has(el)) discSelElements.delete(el);
  else discSelElements.add(el);
  updateDiscSelFilterButtons();
  renderDiscSelection();
}

function clearDiscSelElementFilters() {
  discSelElements.clear();
  updateDiscSelFilterButtons();
  renderDiscSelection();
}

function setDiscSelStarFilter(star) {
  star = Number(star);
  if (discSelStars.has(star) && discSelStars.size === 1) discSelStars.clear();
  else { discSelStars.clear(); discSelStars.add(star); }
  updateDiscSelFilterButtons();
  renderDiscSelection();
}

function toggleDiscSelFold() {
  const wrap = document.getElementById('discSelWrap');
  if (!wrap) return;
  ensureDiscSelInit();
  wrap.classList.toggle('open');
  if (wrap.classList.contains('open')) {
    // No specific slot active → pick the mode from the first empty slot.
    if (activeDiscSlot == null) applyDiscSelHighlight(discHighlightForSlot(null));
    const grid = document.getElementById('discSelGrid');
    if (grid && !grid.children.length) renderDiscSelection();
  }
}

function openDiscSelForSlot(i) {
  ensureDiscSelInit();
  if (activeDiscSlot === i) {
    activeDiscSlot = null;
    updateDiscSelectionState();
    return;
  }
  activeDiscSlot = i;
  // Auto-select Main/Support to match the slot being filled.
  applyDiscSelHighlight(discHighlightForSlot(i));
  const wrap = document.getElementById('discSelWrap');
  if (wrap && !wrap.classList.contains('open')) wrap.classList.add('open');
  // Switching slots keeps the same grid content (in-use no longer depends on
  // the active slot), so only re-render if the default filters actually changed.
  // Otherwise just move the picking highlight — no grid rebuild, no blink.
  const newEls = getDiscSelDefaultElements();
  const newStars = new Set([5]);
  const newSrc = '';
  const sameEls = discSelElements.size === newEls.size && [...newEls].every(el => discSelElements.has(el));
  const sameStars = discSelStars.size === newStars.size && [...newStars].every(s => discSelStars.has(s));
  const sameSrc = (discSelSource || '') === newSrc;
  if (!sameEls || !sameStars || !sameSrc) {
    discSelElements = newEls;
    discSelStars = newStars;
    discSelSource = newSrc;
    updateDiscSelFilterButtons();
    renderDiscSelection();
  }
  updateDiscPickingHighlight();
}

function updateDiscPickingHighlight() {
  document.querySelectorAll('#discRow .disc-thumb').forEach(th => {
    th.classList.toggle('picking', activeDiscSlot != null && Number(th.dataset.discSlot) === activeDiscSlot);
  });
}

function renderDiscSelection() {
  const grid = document.getElementById('discSelGrid');
  if (!grid || typeof discData === 'undefined' || !discData) return;
  grid.innerHTML = '';
  const inUseOther = new Set();
  (selectedDiscs || []).forEach((sid) => { if (sid) inUseOther.add(sid); });

  const ids = Object.keys(discData).filter(id => {
    const d = discData[id];
    const elOk = discSelElements.size === 0 || discSelElements.has(d.element);
    const starOk = discSelStars.size === 0 || discSelStars.has(Number(d.star));
    let srcOk = true;
    if (discSelSource) {
      const tags = Array.isArray(d.source) ? d.source : [];
      if (discSelSource === 'f2p') srcOk = tags.some(t => String(t).toLowerCase() === 'f2p');
      else if (discSelSource === 'Limited') srcOk = tags.includes('Limited') || tags.includes('Exclusive');
      else srcOk = tags.includes(discSelSource);
    }
    return elOk && starOk && srcOk;
  });
  const DISC_EL_ORDER = { Aqua: 0, Ignis: 1, Ventus: 2, Terra: 3, Lux: 4, Umbra: 5, None: 6 };
  ids.sort((a, b) => {
    const ea = DISC_EL_ORDER[discData[a].element] ?? 99;
    const eb = DISC_EL_ORDER[discData[b].element] ?? 99;
    if (ea !== eb) return ea - eb;
    const na = Number(a), nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
    return String(a).localeCompare(String(b));
  });
  if (!ids.length) {
    const empty = document.createElement('div');
    empty.className = 'disc-sel-empty';
    empty.textContent = 'No discs match these filters.';
    grid.appendChild(empty);
    return;
  }
  ids.forEach(id => {
    const d = discData[id];
    const card = document.createElement('div');
    card.className = 'disc-sel-card' + (inUseOther.has(id) ? ' in-use' : '');
    card.dataset.discId = id;
    card.draggable = true;
    card.addEventListener('dragstart', (ev) => {
      try {
        ev.dataTransfer.setData('text/x-disc-id', id);
        ev.dataTransfer.effectAllowed = 'copy';
      } catch (err) {}
      const tt = document.querySelector('.disc-tooltip');
      if (tt) tt.style.display = 'none';
    });
    card.addEventListener('dragend', () => {
      document.querySelectorAll('#discRow .drag-over').forEach(el => el.classList.remove('drag-over'));
    });
    const wrap = document.createElement('div');
    wrap.className = 'disc-sel-imgwrap';
    const img = document.createElement('img');
    img.className = 'disc-sel-art';
    img.loading = 'lazy';
    img.alt = d.name || id;
    img.draggable = false;
    discImg(img, id);
    wrap.appendChild(img);
    const badge = document.createElement('img');
    badge.className = 'disc-sel-el';
    badge.alt = d.element || '';
    badge.draggable = false;
    badge.src = `data/disc badges/${d.element || 'None'}.avif`;
    badge.onerror = () => badge.remove();
    wrap.appendChild(badge);
    card.appendChild(wrap);
    const nm = document.createElement('div');
    nm.className = 'disc-sel-name';
    nm.textContent = d.name || id;
    card.appendChild(nm);
    card.onclick = () => {
      // Already equipped → swap with active slot, else remove
      if ((selectedDiscs || []).includes(id)) {
        const fromIdx = selectedDiscs.indexOf(id);
        if (activeDiscSlot != null && fromIdx !== activeDiscSlot) {
          const target = activeDiscSlot;
          const tmp = selectedDiscs[target];
          selectedDiscs[target] = id;
          selectedDiscs[fromIdx] = tmp || null;
          activeDiscSlot = null;
          refreshDiscSlot(target);
          refreshDiscSlot(fromIdx);
          updateDiscSelectionState();
          renderDiscOutput();
          updateNotes();
          generate();
          return;
        }
        unselectDiscById(id);
        return;
      }
      if (activeDiscSlot == null) {
        const firstEmpty = (selectedDiscs || []).findIndex(x => !x);
        if (firstEmpty < 0) return;
        selectDisc(firstEmpty, id);
      } else {
        selectDisc(activeDiscSlot, id);
      }
    };
    attachDiscTooltip(card, id);
    grid.appendChild(card);
  });
  updateDiscSelNoteOverlays();
}

function discSkillIconUrl(icon) {
  return `${BASE_ASSETS}export/assets/assetbundles/icon/discskill/${icon}.webp`;
}

const DISC_MELODY_NOTE_IDS = {
  Pummel: 90011, Luck: 90012, Burst: 90013, Stamina: 90014, Focus: 90015,
  Skill: 90016, Ultimate: 90017, Aqua: 90018, Ignis: 90019, Ventus: 90020,
  Terra: 90021, Lux: 90022, Umbra: 90023
};

function discMelodyToNoteId(melodyName) {
  const key = String(melodyName || '').replace(/^Melody of\s+/i, '').trim();
  return DISC_MELODY_NOTE_IDS[key] || null;
}

function formatDiscSkillDesc(skill) {
  if (!skill || !skill.desc) return '';
  const vals = String(skill.p1 || '').split(',');
  let out = String(skill.desc);
  vals.forEach((v, i) => { out = out.split(`{${i + 1}}`).join(v); });
  out = out.replace(/\u000b/g, '<br>');
  return formatDescriptionWithColor(out);
}

function getDiscTooltipEl() {
  let el = document.querySelector('.disc-tooltip');
  if (!el) {
    el = document.createElement('div');
    el.className = 'disc-tooltip';
    el.style.display = 'none';
    document.body.appendChild(el);
  }
  return el;
}

let _discTtMove = null;

function positionDiscTooltip(tt, e) {
  const r = tt.getBoundingClientRect();
  let x = e.clientX + 15, y = e.clientY + 15;
  if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - 12;
  if (y + r.height > window.innerHeight - 8) y = window.innerHeight - r.height - 8;
  tt.style.left = Math.max(8, x) + 'px';
  tt.style.top = Math.max(8, y) + 'px';
}

function buildDiscTooltip(discId) {
  const tt = getDiscTooltipEl();
  const d = discData[discId];
  tt.innerHTML = '';
  if (!d) return tt;
  const top = document.createElement('div');
  top.className = 'disc-tt-top';
  const img = document.createElement('img');
  img.alt = '';
  img.src = discImageUrl(discId);
  img.onerror = () => { img.src = FALLBACK_DISC_URL; img.onerror = null; };
  top.appendChild(img);
  const right = document.createElement('div');
  const nm = document.createElement('div');
  nm.className = 'disc-tt-name';
  nm.textContent = d.name || discId;
  right.appendChild(nm);
  const stats = document.createElement('div');
  stats.className = 'disc-tt-stats';
  if (d.maxStat) {
    for (const [k, v] of Object.entries(d.maxStat)) {
      const line = document.createElement('div');
      line.textContent = `${k}: ${typeof v === 'number' ? v.toLocaleString('en-US') : v}`;
      stats.appendChild(line);
    }
  }
  right.appendChild(stats);
  top.appendChild(right);
  tt.appendChild(top);

  const skills = [];
  if (d.mainSkill) skills.push(['Melody', d.mainSkill]);
  if (d.secondarySkill1 && d.secondarySkill2) {
    skills.push(['Harmony 1', d.secondarySkill1]);
    skills.push(['Harmony 2', d.secondarySkill2]);
  } else {
    if (d.secondarySkill1) skills.push(['Harmony', d.secondarySkill1]);
    if (d.secondarySkill2) skills.push(['Harmony', d.secondarySkill2]);
  }
  skills.forEach(([kind, skill]) => {
    const sec = document.createElement('div');
    sec.className = 'disc-tt-skill';
    const head = document.createElement('div');
    head.className = 'disc-tt-skill-head';
    const sImg = document.createElement('img');
    sImg.alt = '';
    sImg.src = discSkillIconUrl(skill.icon);
    sImg.onerror = () => { sImg.onerror = null; sImg.src = FALLBACK_DISC_URL; };
    head.appendChild(sImg);
    const titleWrap = document.createElement('div');
    titleWrap.className = 'disc-tt-titlewrap';
    const kindEl = document.createElement('span');
    kindEl.className = 'disc-tt-skill-kind';
    kindEl.textContent = `${kind} · Lv 1`;
    const titleEl = document.createElement('span');
    titleEl.className = 'disc-tt-skill-title';
    titleEl.textContent = skill.name || kind;
    titleWrap.appendChild(kindEl);
    titleWrap.appendChild(titleEl);
    head.appendChild(titleWrap);
    const buildNotes = () => {
      const notes = document.createElement('div');
      notes.className = 'disc-tt-notes';
      if (!skill.req1) return notes;
      for (const [melody, qty] of Object.entries(skill.req1)) {
        const nid = discMelodyToNoteId(melody);
        if (!nid) continue;
        const chip = document.createElement('span');
        chip.className = 'disc-tt-note';
        chip.title = `${melody} ×${qty}`;
        const nImg = document.createElement('img');
        nImg.alt = '';
        noteImg(nImg, nid);
        chip.appendChild(nImg);
        notes.appendChild(chip);
      }
      return notes;
    };
    const isHarmony = /^harmony/i.test(kind);
    if (isHarmony) {
      const notes = buildNotes();
      if (notes.children.length) head.appendChild(notes);
    }
    sec.appendChild(head);
    const desc = document.createElement('div');
    desc.className = 'disc-tt-desc';
    desc.innerHTML = formatDiscSkillDesc(skill);
    sec.appendChild(desc);
    if (!isHarmony && skill.req1) {
      const notes = buildNotes();
      if (notes.children.length) sec.appendChild(notes);
    }
    tt.appendChild(sec);
  });
  return tt;
}

function attachDiscTooltip(el, discId) {
  if (!el || !discId) return;
  el.addEventListener('mouseenter', (e) => {
    const tt = buildDiscTooltip(discId);
    tt.style.display = 'block';
    positionDiscTooltip(tt, e);
    if (_discTtMove) window.removeEventListener('mousemove', _discTtMove);
    _discTtMove = (ev) => positionDiscTooltip(tt, ev);
    window.addEventListener('mousemove', _discTtMove);
  });
  el.addEventListener('mouseleave', () => {
    const tt = document.querySelector('.disc-tooltip');
    if (tt) tt.style.display = 'none';
    if (_discTtMove) { window.removeEventListener('mousemove', _discTtMove); _discTtMove = null; }
  });
}

function selectDisc(slotIdx, id) {
  if (slotIdx == null || slotIdx < 0 || slotIdx >= selectedDiscs.length) return;
  if (!id) return;
  // No duplicates: disc already equipped elsewhere → ignore
  const existingIdx = selectedDiscs.indexOf(id);
  if (existingIdx >= 0 && existingIdx !== slotIdx) return;
  if (selectedDiscs[slotIdx] === id) return;
  selectedDiscs[slotIdx] = id;
  activeDiscSlot = null;
  refreshDiscSlot(slotIdx);
  updateDiscSelectionState();
  renderDiscOutput();
  updateNotes();
  generate();
}

function unselectDiscById(id) {
  const idx = (selectedDiscs || []).indexOf(id);
  if (idx < 0) return false;
  selectedDiscs[idx] = null;
  activeDiscSlot = null;
  refreshDiscSlot(idx);
  updateDiscSelectionState();
  renderDiscOutput();
  updateNotes();
  generate();
  return true;
}

function swapDiscSlots(fromIdx, toIdx) {
  fromIdx = Number(fromIdx);
  toIdx = Number(toIdx);
  if (Number.isNaN(fromIdx) || Number.isNaN(toIdx)) return;
  if (fromIdx === toIdx) return;
  if (fromIdx < 0 || fromIdx >= selectedDiscs.length) return;
  if (toIdx < 0 || toIdx >= selectedDiscs.length) return;
  if (!selectedDiscs[fromIdx]) return;
  const tmp = selectedDiscs[fromIdx];
  selectedDiscs[fromIdx] = selectedDiscs[toIdx];
  selectedDiscs[toIdx] = tmp;
  renderDiscs();
  renderDiscOutput();
  updateNotes();
  generate();
}

function renderDiscOutput() {
  const panel = document.getElementById('discOutputPanel');
  if (!panel || panel.dataset.built) { updateDiscOutputText(); return; }
  panel.dataset.built = '1';

  const outEl = document.createElement('div');
  outEl.className = 'disc-output-text';
  outEl.id = 'discOutputText';
  outEl.addEventListener('click', () => {
    const txt = outEl.textContent;
    if (!txt || txt === '—') return;
    copyToClipboard(txt.replace(/\r?\n+$/, ''));
  });
  panel.appendChild(outEl);

  const btnRow = document.createElement('div');
  btnRow.className = 'emblem-output-btn-row';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'emblem-output-btn disc-output-btn';
  copyBtn.textContent = 'Copy';

  copyBtn.onclick = () => {
    const txt = document.getElementById('discOutputText')?.textContent;
    if (!txt || txt === '—') return;
    copyToClipboard(txt);
  };

  btnRow.appendChild(copyBtn);
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

function updateNotes(resetNotesCount = 20) {
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
    if (noteCounts[id] === undefined) noteCounts[id] = resetNotesCount;
    const item = document.createElement('div');
    item.className = 'note-item';

    const img = document.createElement('img');
    noteImg(img, id);

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


