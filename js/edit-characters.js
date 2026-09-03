// Edit Characters popup: generates !c commands per character (and "all" / groups)
// Values are not persisted — blank on load
let editCharsData = {};

// Derived from data (charJson star/source) — fall back to hardcoded lists only if data is missing
const _FOUR_STAR_FALLBACK = ['103','107','108','111','112','113','116','117','118','120','123','126','127','142','147','150'];
const _STANDARD_FALLBACK = ['119','125','132','135','141','149','156'];

function getFourStarIds() {
  try {
    if (typeof charJson !== 'undefined' && charJson && Object.keys(charJson).length) {
      const ids = Object.keys(charJson).filter(id => Number(charJson[id]?.star) === 4);
      if (ids.length) return ids.sort((a, b) => +a - +b);
    }
  } catch (e) {}
  return _FOUR_STAR_FALLBACK;
}

function getStandardIds() {
  try {
    if (typeof charJson !== 'undefined' && charJson && Object.keys(charJson).length) {
      const ids = Object.keys(charJson).filter(id => {
        const c = charJson[id];
        if (Number(c?.star) !== 5) return false;
        const src = c?.source;
        return Array.isArray(src) ? src.includes('Standard') : false;
      });
      if (ids.length) return ids.sort((a, b) => +a - +b);
    }
  } catch (e) {}
  return _STANDARD_FALLBACK;
}

function getEditCharsColKey(id) {
  return String(id);
}

function openEditCharsPopup() {
  renderEditCharsGrid();
  updateEditCharsOutput();
  const ov = document.getElementById('editCharsOverlay');
  if (ov) ov.style.display = 'flex';
  document.body.classList.add('modal-open');
}

function closeEditCharsPopup() {
  const ov = document.getElementById('editCharsOverlay');
  if (ov) ov.style.display = 'none';
  document.body.classList.remove('modal-open');
}

function clearEditCharsInputs() {
  editCharsData = {};
  // clear all input fields in the popup
  document.querySelectorAll('#editCharsGrid input').forEach(inp => { inp.value = ''; });
  updateEditCharsOutput();
}

function renderEditCharsGrid() {
  const grid = document.getElementById('editCharsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const chars = (typeof selectedChars !== 'undefined' ? selectedChars.filter(c => c) : []);
  const columns = ['all', '4stars', 'standards', ...chars];

  for (const colId of columns) {
    const col = document.createElement('div');
    const isGroup = colId === 'all' || colId === '4stars' || colId === 'standards';
    col.className = 'edit-chars-col' + (isGroup ? ' all-col' : '');

    if (colId === 'all') {
      const box = document.createElement('div');
      box.style.cssText = 'width:80px;height:80px;background:#333;display:flex;align-items:center;justify-content:center;color:#888;font-size:14px;letter-spacing:2px;border-radius:3px;font-weight:bold;';
      box.textContent = 'ALL';
      col.appendChild(box);
      const lbl = document.createElement('div');
      lbl.className = 'col-label';
      lbl.textContent = 'ALL';
      col.appendChild(lbl);
    } else if (colId === '4stars') {
      const box = document.createElement('div');
      box.style.cssText = 'width:80px;height:80px;background:#333;display:flex;align-items:center;justify-content:center;color:#888;font-size:13px;letter-spacing:1px;border-radius:3px;font-weight:bold;';
      box.textContent = '4★';
      col.appendChild(box);
      const lbl = document.createElement('div');
      lbl.className = 'col-label';
      lbl.textContent = '4 Stars';
      col.appendChild(lbl);
    } else if (colId === 'standards') {
      const box = document.createElement('div');
      box.style.cssText = 'width:80px;height:80px;background:#333;display:flex;align-items:center;justify-content:center;color:#888;font-size:11px;letter-spacing:1px;border-radius:3px;font-weight:bold;text-align:center;line-height:1.2;';
      box.textContent = 'STANDARDS';
      col.appendChild(box);
      const lbl = document.createElement('div');
      lbl.className = 'col-label';
      lbl.textContent = 'Standards';
      col.appendChild(lbl);
    } else {
      // Use same image as characters section: BASE_ASSETS + head_${id}02_XXL.webp
      const base = (typeof BASE_ASSETS !== 'undefined' ? BASE_ASSETS : 'https://raw.githubusercontent.com/AutumnVN/ssassets/main/');
      const wrap = headCropEl(base + `export/assets/assetbundles/icon/head/head_${colId}02_XXL.webp`);
      const img = wrap.querySelector('img');
      img.alt = colId;
      img.onerror = () => { img.style.opacity = '0.2'; };
      col.appendChild(wrap);
      const lbl = document.createElement('div');
      lbl.className = 'col-label';
      const name = (typeof charData !== 'undefined' && charData[colId]) ? charData[colId] : (typeof charJson !== 'undefined' && charJson[colId]?.name ? charJson[colId].name : colId);
      lbl.textContent = name;
      lbl.title = name + ' (' + colId + ')';
      col.appendChild(lbl);
    }

    const fieldsWrap = document.createElement('div');
    fieldsWrap.className = 'edit-chars-fields';

    const fieldDefs = [
      { key: 's', label: 'Skill', min: 1, max: 10, placeholder: '-' },
      { key: 't', label: 'Talent', min: 0, max: 5, placeholder: '-' },
      { key: 'f', label: 'Affinity', min: 0, max: 30, placeholder: '-' },
    ];

    const key = getEditCharsColKey(colId);
    if (!editCharsData[key]) editCharsData[key] = {};

    for (const fd of fieldDefs) {
      const field = document.createElement('div');
      field.className = 'edit-chars-field';
      const lab = document.createElement('label');
      lab.textContent = fd.label;
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.placeholder = fd.placeholder;
      inp.min = String(fd.min);
      inp.max = String(fd.max);
      inp.dataset.col = key;
      inp.dataset.field = fd.key;
      const val = editCharsData[key][fd.key];
      if (val !== undefined && val !== '' && val !== null) inp.value = val;
      inp.addEventListener('input', () => {
        let v = inp.value.trim();
        if (v === '') {
          if (editCharsData[key]) delete editCharsData[key][fd.key];
        } else {
          if (!editCharsData[key]) editCharsData[key] = {};
          editCharsData[key][fd.key] = v;
        }
        if (editCharsData[key] && Object.keys(editCharsData[key]).length === 0) delete editCharsData[key];
        updateEditCharsOutput();
      });
      field.appendChild(lab);
      field.appendChild(inp);
      fieldsWrap.appendChild(field);
    }

    col.appendChild(fieldsWrap);
    grid.appendChild(col);
  }
}

function buildEditCharsLines() {
  const pid = (typeof playerId !== 'undefined' && playerId ? String(playerId).trim() : '10001');
  const suffix = ` @${pid}`;
  const chars = (typeof selectedChars !== 'undefined' ? selectedChars.filter(c => c) : []);
  // order: all, 4stars, standards, then selected chars
  const columns = ['all', '4stars', 'standards', ...chars];
  const lines = [];

  function suffixForData(data) {
    let hasAny = false;
    const s = data.s;
    const t = data.t;
    const f = data.f;
    if ((s !== undefined && s !== '') || (t !== undefined && t !== '') || (f !== undefined && f !== '')) hasAny = true;
    if (!hasAny) return null;
    let params = '';
    if (s !== undefined && s !== '' && !isNaN(Number(s))) params += ` s${String(s).trim()}`;
    if (t !== undefined && t !== '' && !isNaN(Number(t))) params += ` t${String(t).trim()}`;
    if (f !== undefined && f !== '' && !isNaN(Number(f))) params += ` f${String(f).trim()}`;
    if (!params) return null;
    return params;
  }

  for (const colId of columns) {
    const key = getEditCharsColKey(colId);
    const data = editCharsData[key];
    if (!data) continue;
    const params = suffixForData(data);
    if (!params) continue;

    if (colId === 'all') {
      lines.push(`c all${params}${suffix}`);
    } else if (colId === '4stars') {
      for (const cid of getFourStarIds()) {
        lines.push(`c ${cid}${params}${suffix}`);
      }
    } else if (colId === 'standards') {
      for (const cid of getStandardIds()) {
        lines.push(`c ${cid}${params}${suffix}`);
      }
    } else {
      lines.push(`c ${colId}${params}${suffix}`);
    }
  }
  return lines;
}

function updateEditCharsOutput() {
  const out = document.getElementById('editCharsOutput');
  if (!out) return;
  const lines = buildEditCharsLines();
  if (!lines.length) {
    out.textContent = '—';
    out.style.color = '#555';
  } else {
    out.textContent = lines.join('\n') + '\n';
    out.style.color = '#888';
  }
}

function copyEditCharsOutput() {
  const out = document.getElementById('editCharsOutput');
  if (!out) return;
  const txt = out.textContent;
  if (!txt || txt.trim() === '—' || txt.trim() === '' || txt.includes('no characters')) return;
  const normalized = txt.replace(/\r?\n+$/, '');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(normalized + '\n').then(() => {
      if (typeof showToast === 'function') showToast('Copied');
    }).catch(()=>{});
  } else {
    const ta = document.createElement('textarea');
    ta.value = normalized + '\n';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    if (typeof showToast === 'function') showToast('Copied');
  }
}

// Allow Escape to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const ov = document.getElementById('editCharsOverlay');
    if (ov && ov.style.display !== 'none') closeEditCharsPopup();
  }
});

// Extend copyAllOutputs to include edit chars if present
(function() {
  function patch() {
    if (typeof window.copyAllOutputs !== 'function') return;
    const base = window.copyAllOutputs;
    if (base.__patchedEditChars) return;
    const wrapped = function() {
      const parts = [];
      const mainOutput = document.getElementById('output');
      if (mainOutput && mainOutput.textContent && mainOutput.textContent !== '—' && !mainOutput.textContent.includes('select')) {
        parts.push(mainOutput.textContent);
      }
      const discOutput = document.getElementById('discOutputText');
      if (discOutput && discOutput.textContent && discOutput.textContent !== '—') {
        parts.push(discOutput.textContent);
      }
      const emblemOutputs = document.querySelectorAll('[id^="emblem-output-"]');
      emblemOutputs.forEach(el => {
        if (el.textContent && el.textContent !== '—') parts.push(el.textContent);
      });
      const editOut = document.getElementById('editCharsOutput');
      if (editOut && editOut.textContent && editOut.textContent !== '—' && !editOut.textContent.includes('no characters')) {
        parts.push(editOut.textContent);
      }
      if (parts.length === 0) return;
      const combined = parts.map(p => p.replace(/\r?\n|\r|\n/g, '\n').replace(/\n+/g, '\n').replace(/^\n+|\n+$/g, '')).join('\r\n') + '\r\n';
      navigator.clipboard.writeText(combined).then(() => { if (typeof showToast === 'function') showToast('All Copied'); }).catch(()=>{});
    };
    wrapped.__patchedEditChars = true;
    window.copyAllOutputs = wrapped;
  }
  if (document.readyState === 'complete') setTimeout(patch, 500);
  else window.addEventListener('load', () => setTimeout(patch, 500));
  setTimeout(patch, 1500);
})();
