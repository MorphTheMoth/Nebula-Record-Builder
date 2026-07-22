async function renderChars() {
  const grid = document.getElementById('charGrid');
  grid.innerHTML = '';

  const ids = Object.keys(charData).sort((a,b) => +a - +b);
  const probes = await Promise.all(ids.map(id => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = BASE_ASSETS + `export/assets/assetbundles/icon/head/head_${id}02_XXL.webp`;
  })));

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
      badge.textContent = slotIdx < 3 ? `#${slotIdx + 1}` : '+';
    } else {
      if (badge) badge.remove();
    }
  });
}

function toggleChar(id) {
  const idx = selectedChars.indexOf(id);
  if (idx >= 0) {
    selectedChars.splice(idx, 1);
  } else {
    selectedChars.push(id);
  }
  refreshCharBadges();
  updatePotentials();
  updateNotes();
  generate();
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

    row.appendChild(slot);
  }
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
          <div class="dname">${d.name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
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

document.addEventListener('click', (e) => { if (!e.target.closest('.disc-picker')) closeAllDiscDD(); });
