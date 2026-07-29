const CANVAS_NOTE_TYPES = {
  text: {
    label: 'Text',
    icon: 'T',
    defaults: { fontSize: 18, text: 'Note', color: 10 }
  },
  discImg: {
    label: 'Disc Img',
    icon: 'D',
    defaults: { fontSize: 18, text: '', discId: null, imgSize: 80 }
  },
  chain: {
    label: 'Chain',
    icon: 'C',
    defaults: { fontSize: 18, text: '', targetId: null, length: 80 }
  }
};

function _genNoteId() {
  return 'cn-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function _roundPct(n) {
  return Math.round(n * 100) / 100;
}

function _defaultDiscId() {
  const ELEMENT_ORDER = { Aqua:0, Ignis:1, Ventus:2, Terra:3, Lux:4, Umbra:5, None:6, Other:7 };
  const ids = Object.keys(discData).filter(id => discData[id] && discData[id].element);
  ids.sort((a, b) => {
    const da = discData[a], db = discData[b];
    const ea = ELEMENT_ORDER[da.element] ?? 99;
    const eb = ELEMENT_ORDER[db.element] ?? 99;
    if (ea !== eb) return ea - eb;
    if ((db.star || 0) !== (da.star || 0)) return (db.star || 0) - (da.star || 0);
    return (da.name || '').localeCompare(db.name || '');
  });
  return ids[0] || null;
}

function _firstPotId() {
  const svg = document.querySelector('#recordImageContent svg');
  if (!svg) return null;
  const g = svg.querySelector('g[data-id]');
  return g ? g.getAttribute('data-id') : null;
}

function _potIdAtPoint(svgEl, clientX, clientY) {
  if (!svgEl) return null;
  const PW = 120, PH = 153;
  const rect = svgEl.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const vb = svgEl.getAttribute('viewBox').split(' ').map(Number);
  const svgW = vb[2], svgH = vb[3];
  if (!svgW || !svgH) return null;
  const mx = ((clientX - rect.left) / rect.width) * svgW;
  const my = ((clientY - rect.top) / rect.height) * svgH;
  const pots = [];
  svgEl.querySelectorAll('g[data-id]').forEach(g => {
    const t = g.getAttribute('transform');
    const m = t && t.match(/translate\(([^,]+),([^)]+)\)/);
    if (!m) return;
    pots.push({ id: g.getAttribute('data-id'), x: parseFloat(m[1]), y: parseFloat(m[2]) });
  });
  const hit = pots.find(p => mx >= p.x && mx < p.x + PW && my >= p.y && my < p.y + PH);
  return hit ? hit.id : null;
}

function _chainAnchorInfo(svgEl, targetId) {
  if (!svgEl || !targetId) return null;
  const PW = 120, PH = 153;
  const targetG = svgEl.querySelector(`g[data-id="${CSS.escape(String(targetId))}"]`);
  if (!targetG) return null;
  const t = targetG.getAttribute('transform');
  const m = t && t.match(/translate\(([^,]+),([^)]+)\)/);
  if (!m) return null;
  const tx = parseFloat(m[1]);
  const ty = parseFloat(m[2]);
  const cx = tx + PW / 2;
  const cy = ty + PH / 2;
  return { cx: cx + 61, cy: cy + 35 };
}

function getCanvasNote(id) {
  return canvasNotes.find(n => n.id === id);
}

function addCanvasNote(type, xPct, yPct) {
  if (!CANVAS_NOTE_TYPES[type]) return null;
  const def = CANVAS_NOTE_TYPES[type].defaults;
  const note = {
    id: _genNoteId(),
    type,
    x: _roundPct(xPct ?? 50),
    y: _roundPct(yPct ?? 50),
    fontSize: def.fontSize,
    text: def.text,
    color: def.color ?? 10,
    discId: type === 'discImg' && !def.discId ? (_defaultDiscId() ?? null) : (def.discId ?? null),
    imgSize: def.imgSize ?? 80,
    targetId: type === 'chain' ? (def.targetId ?? _firstPotId() ?? null) : null,
    length: def.length ?? 80
  };
  canvasNotes.push(note);
  saveState();
  return note;
}

function updateCanvasNote(id, patch) {
  const n = getCanvasNote(id);
  if (!n) return null;
  Object.assign(n, patch);
  if (patch.x !== undefined) n.x = _roundPct(patch.x);
  if (patch.y !== undefined) n.y = _roundPct(patch.y);
  saveState();
  return n;
}

function removeCanvasNote(id) {
  canvasNotes = canvasNotes.filter(n => n.id !== id);
  saveState();
}

function _escAttr(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const _RARITY_GRADIENTS = {
  3: ['#88ccee', '#ddffff'],
  4: ['#ffdd55', '#eeffcc'],
  5: ['#dd88ee', '#77ffff']
};
const _DISC_BADGE_BASE = 'data/disc badges/';
const _CHAIN_HREF = 'data/chain.webp';
const _CHAIN_SRC_W = 6, _CHAIN_SRC_H = 28;

function _renderNoteSvg(note, svgW, svgH) {
  const fs = note.fontSize || 18;
  if (note.type === 'text') {
    const outlinePad = 6;
    const text = note.text || '';
    const lines = text.split('\n');
    const lineHeight = fs * 1.2;
    const maxLineLen = Math.max(...lines.map(l => l.length), 1);
    const w = Math.max(80, maxLineLen * fs * 0.6 + outlinePad * 2);
    const h = lines.length * lineHeight + outlinePad * 2;
    const tspans = lines.map((line, i) => {
      const dy = i === 0 ? -((lines.length - 1) * lineHeight) / 2 : lineHeight;
      return `<tspan x="0" dy="${dy}">${_escAttr(line) || ' '}</tspan>`;
    }).join('');
    return {
      w, h,
      inner: `<text x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-size="${fs}" font-weight="bold" fill="${_getThemeColor(note.color)}" font-family="Consolas, monospace">${tspans}</text>`
    };
  }
  if (note.type === 'discImg') {
    const size = note.imgSize || 80;
    if (!note.discId) {
      return {
        w: size, h: size,
        inner: `<rect x="${-size/2}" y="${-size/2}" width="${size}" height="${size}" fill="rgba(255,255,255,0.06)" stroke="#888" stroke-width="2" stroke-dasharray="4 3" rx="4"/><text x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-size="${Math.max(10, size*0.18)}" fill="#888" font-family="Consolas, monospace">pick disc</text>`
      };
    }
    const dd = discData?.[note.discId] || {};
    const imgId = String(note.discId).slice(2);
    const href = BASE_ASSETS + `export/assets/assetbundles/icon/outfit/outfit_${imgId}_a.webp`;
    const star = dd.star || 0;
    const el = dd.element;
    const showBadge = !!el;
    const grad = _RARITY_GRADIENTS[star];
    const fw = Math.max(3, size * 0.05);
    const is = size - 2 * fw;
    const ix = -is / 2;
    const iy = -is / 2;
    const bs = size * 0.35;
    const zoom = 10;
    const iz = is + zoom;
    const uid = String(note.id).replace(/[^a-zA-Z0-9]/g, '_');
    const gradId = `rg_${uid}`;
    const clipId = `dc_${uid}`;
    let defs = `<clipPath id="${clipId}"><rect x="${ix}" y="${iy}" width="${is}" height="${is}" rx="3"/></clipPath>`;
    if (grad) {
      defs += `<linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${grad[0]}"/><stop offset="1" stop-color="${grad[1]}"/></linearGradient>`;
    }
    const frameFill = grad ? `url(#${gradId})` : '#2a2a2a';
    let inner = `<defs>${defs}</defs>`;
    inner += `<rect x="${-size/2}" y="${-size/2}" width="${size}" height="${size}" fill="${frameFill}" rx="4"/>`;
    inner += `<g clip-path="url(#${clipId})">`;
    inner += `<rect x="${ix}" y="${iy}" width="${is}" height="${is}" fill="#2a2a2a"/>`;
    inner += `<image x="${-iz/2}" y="${-iz/2}" width="${iz}" height="${iz}" href="${_escAttr(href)}" preserveAspectRatio="xMidYMid slice"/>`;
    inner += `</g>`;
    if (showBadge) {
      const badgeHref = _DISC_BADGE_BASE + el + '.avif';
      inner += `<image x="${-size/2}" y="${-size/2}" width="${bs}" height="${bs}" href="${_escAttr(badgeHref)}"/>`;
    }
    return { w: size, h: size, inner };
  }
  if (note.type === 'chain') {
    const length = note.length || 80;
    const visualLen = length;
    const visualW = visualLen * (_CHAIN_SRC_W / _CHAIN_SRC_H);
    const w = visualW, h = visualLen;
    return {
      w: visualLen, h: visualW,
      inner: `<g transform="rotate(-90)" opacity="0.75" style="image-rendering:pixelated;shape-rendering:crispEdges"><image x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" href="${_escAttr(_CHAIN_HREF)}" preserveAspectRatio="none" style="image-rendering:pixelated"/></g>`
    };
  }
  return null;
}

function renderCanvasNotes(svgEl) {
  if (!svgEl) return;
  if (_noteDrag) {
    _noteDrag = null;
  }
  svgEl.querySelectorAll('g[data-note-id]').forEach(el => el.remove());

  const vb = svgEl.getAttribute('viewBox').split(' ').map(Number);
  const svgW = vb[2], svgH = vb[3];
  if (!svgW || !svgH) return;

  const PW = 120, PH = 153;
  const chainById = new Map();
  const orphanedChainIds = [];
  for (const note of canvasNotes) {
    if (note.type !== 'chain') continue;
    if (!note.targetId) continue;
    const info = _chainAnchorInfo(svgEl, note.targetId);
    if (!info) {
      orphanedChainIds.push(note.id);
      continue;
    }
    chainById.set(note.id, { note, cx: info.cx, cy: info.cy });
  }
  if (orphanedChainIds.length) {
    canvasNotes = canvasNotes.filter(n => !orphanedChainIds.includes(n.id));
    if (typeof saveState === 'function') saveState();
  }

  const NS = 'http://www.w3.org/2000/svg';
  for (const note of canvasNotes) {
    const r = _renderNoteSvg(note, svgW, svgH);
    if (!r) continue;
    let x, y;
    if (note.type === 'chain') {
      const info = chainById.get(note.id);
      if (!info) continue;
      x = info.cx;
      y = info.cy;
    } else {
      x = (note.x / 100) * svgW;
      y = (note.y / 100) * svgH;
    }
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('data-note-id', note.id);
    g.setAttribute('class', 'canvas-note');
    g.setAttribute('transform', `translate(${x},${y})`);
    g.style.cursor = editNotesMode ? 'grab' : 'default';

    if (editNotesMode) {
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('class', 'canvas-note-outline');
      rect.setAttribute('x', String(-r.w / 2));
      rect.setAttribute('y', String(-r.h / 2));
      rect.setAttribute('width', String(r.w));
      rect.setAttribute('height', String(r.h));
      rect.setAttribute('rx', '3');
      rect.setAttribute('fill', 'rgba(255,255,255,0.04)');
      rect.setAttribute('stroke', '#888');
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('stroke-dasharray', '4 3');
      g.appendChild(rect);
    }

    const content = document.createElementNS(NS, 'g');
    content.setAttribute('class', 'canvas-note-content');
    content.innerHTML = r.inner;
    g.appendChild(content);

    svgEl.appendChild(g);
  }

  attachCanvasNoteEvents(svgEl);
}

function buildNotesSvgString(svgW, svgH, potPositions) {
  if (!canvasNotes.length) return '';
  const PW = 120, PH = 153;
  const svgEl = document.querySelector('#recordImageContent svg');
  const chainCenters = new Map();
  for (const note of canvasNotes) {
    if (note.type !== 'chain') continue;
    if (!note.targetId) continue;
    let info = null;
    if (svgEl) {
      info = _chainAnchorInfo(svgEl, note.targetId);
    }
    if (!info && Array.isArray(potPositions)) {
      const PW_ = PW, PH_ = PH;
      const anchor = potPositions.find(p => p.id === String(note.targetId));
      if (anchor) {
        const ax = anchor.x + PW_ / 2;
        const ay = anchor.y + PH_ / 2;
        info = { cx: ax + 61, cy: ay + 35 };
      }
    }
    if (info) chainCenters.set(note.id, info);
  }
  let out = '';
  for (const note of canvasNotes) {
    const r = _renderNoteSvg(note, svgW, svgH);
    if (!r) continue;
    let x, y;
    if (note.type === 'chain') {
      const info = chainCenters.get(note.id);
      if (!info) continue;
      x = info.cx;
      y = info.cy;
    } else {
      x = (note.x / 100) * svgW;
      y = (note.y / 100) * svgH;
    }
    out += `<g data-note-id="${note.id}" class="canvas-note" transform="translate(${x},${y})">${r.inner}</g>`;
  }
  return out;
}

function attachCanvasNoteEvents(svgEl) {
  if (!svgEl) return;
  svgEl.querySelectorAll('g[data-note-id]').forEach(g => {
    g.addEventListener('pointerdown', onCanvasNotePointerDown);
    g.addEventListener('dblclick', onCanvasNoteDblClick);
  });
}

let _noteDrag = null;
let _lastNoteClick = null;

function onCanvasNotePointerDown(e) {
  if (!editNotesMode) return;
  if (e.button !== 0) return;
  const g = e.currentTarget;
  const id = g.getAttribute('data-note-id');
  e.stopPropagation();
  e.preventDefault();
  try { g.setPointerCapture(e.pointerId); } catch(_) {}

  const note = getCanvasNote(id);
  const isChain = note && note.type === 'chain';
  _noteDrag = {
    id,
    el: g,
    startX: e.clientX,
    startY: e.clientY,
    moved: false,
    isChain
  };
  if (isChain) {
    g.addEventListener('pointermove', onCanvasChainPointerMove);
    g.addEventListener('pointerup', onCanvasNotePointerUp);
    g.addEventListener('pointercancel', onCanvasNotePointerUp);
  } else {
    g.addEventListener('pointermove', onCanvasNotePointerMove);
    g.addEventListener('pointerup', onCanvasNotePointerUp);
    g.addEventListener('pointercancel', onCanvasNotePointerUp);
  }
}

function onCanvasNotePointerMove(e) {
  if (!_noteDrag) return;
  const dx = e.clientX - _noteDrag.startX;
  const dy = e.clientY - _noteDrag.startY;

  if (!_noteDrag.moved) {
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    _noteDrag.moved = true;
    _noteDrag.startVx = (getCanvasNote(_noteDrag.id)?.x ?? 0) / 100;
    _noteDrag.startVy = (getCanvasNote(_noteDrag.id)?.y ?? 0) / 100;
    _noteDrag.startSvgW = 0;
    _noteDrag.startSvgH = 0;
    const svgEl = document.querySelector('#recordImageContent svg');
    if (svgEl) {
      const vb = svgEl.getAttribute('viewBox').split(' ').map(Number);
      _noteDrag.startSvgW = vb[2];
      _noteDrag.startSvgH = vb[3];
      _noteDrag.svgRect = svgEl.getBoundingClientRect();
    }
    closeNoteToolbar();
    _noteDrag.el.style.cursor = 'grabbing';
  }

  if (!_noteDrag.startSvgW) return;
  const vw = _noteDrag.startSvgW, vh = _noteDrag.startSvgH;
  const rect = _noteDrag.svgRect;
  const newVx = _noteDrag.startVx * vw + (dx / rect.width) * vw;
  const newVy = _noteDrag.startVy * vh + (dy / rect.height) * vh;
  _noteDrag.el.setAttribute('transform', `translate(${newVx},${newVy})`);
  _noteDrag.lastVx = newVx;
  _noteDrag.lastVy = newVy;
}

function onCanvasChainPointerMove(e) {
  if (!_noteDrag) return;
  const dx = e.clientX - _noteDrag.startX;
  const dy = e.clientY - _noteDrag.startY;

  if (!_noteDrag.moved) {
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    _noteDrag.moved = true;
    closeNoteToolbar();
    _noteDrag.el.style.cursor = 'grabbing';
  }

  const svgEl = document.querySelector('#recordImageContent svg');
  if (!svgEl) return;
  const potId = _potIdAtPoint(svgEl, e.clientX, e.clientY);
  if (potId) {
    const info = _chainAnchorInfo(svgEl, potId);
    if (info) {
      _noteDrag.el.setAttribute('transform', `translate(${info.cx},${info.cy})`);
      _noteDrag.pendingTargetId = potId;
      return;
    }
  }
  if (_noteDrag.pendingTargetId) {
    const info = _chainAnchorInfo(svgEl, _noteDrag.pendingTargetId);
    if (info) {
      _noteDrag.el.setAttribute('transform', `translate(${info.cx},${info.cy})`);
      return;
    }
  }
}

function onCanvasNotePointerUp(e) {
  if (!_noteDrag) return;
  const g = _noteDrag.el;
  g.removeEventListener('pointermove', onCanvasNotePointerMove);
  g.removeEventListener('pointermove', onCanvasChainPointerMove);
  g.removeEventListener('pointerup', onCanvasNotePointerUp);
  g.removeEventListener('pointercancel', onCanvasNotePointerUp);
  try { g.releasePointerCapture(e.pointerId); } catch(_) {}

  if (_noteDrag.isChain) {
    if (_noteDrag.moved && _noteDrag.pendingTargetId) {
      updateCanvasNote(_noteDrag.id, { targetId: _noteDrag.pendingTargetId });
      _noteDrag.el.style.cursor = editNotesMode ? 'grab' : 'default';
    } else if (!_noteDrag.moved) {
      const now = Date.now();
      const clickedId = _noteDrag.id;
      if (_lastNoteClick && _lastNoteClick.id === clickedId && now - _lastNoteClick.time < 300) {
        _lastNoteClick = null;
      } else {
        _lastNoteClick = { id: clickedId, time: now };
        openNoteToolbar(clickedId, g);
      }
    }
    _noteDrag = null;
    return;
  }

  if (_noteDrag.moved && _noteDrag.lastVx !== undefined) {
    const vw = _noteDrag.startSvgW, vh = _noteDrag.startSvgH;
    const xPct = _roundPct((_noteDrag.lastVx / vw) * 100);
    const yPct = _roundPct((_noteDrag.lastVy / vh) * 100);
    updateCanvasNote(_noteDrag.id, { x: xPct, y: yPct });
    _noteDrag.el.style.cursor = editNotesMode ? 'grab' : 'default';
  } else if (!_noteDrag.moved) {
    const now = Date.now();
    const clickedId = _noteDrag.id;
    if (_lastNoteClick && _lastNoteClick.id === clickedId && now - _lastNoteClick.time < 300) {
      _lastNoteClick = null;
    } else {
      _lastNoteClick = { id: clickedId, time: now };
      openNoteToolbar(clickedId, g);
    }
  }
  _noteDrag = null;
}

function onCanvasNoteDblClick(e) {
  if (!editNotesMode) return;
  e.stopPropagation();
  e.preventDefault();
  _lastNoteClick = null;
  closeNoteToolbar();
  const id = e.currentTarget.getAttribute('data-note-id');
  const note = getCanvasNote(id);
  if (!note) return;
  if (note.type === 'discImg') {
    openDiscPickerForNote(id, e.currentTarget);
  } else if (note.type === 'text') {
    startTextEditInPlace(id);
  }
}

function setEditNotesMode(on) {
  editNotesMode = !!on;
  const btn = document.getElementById('editNotesBtn');
  if (btn) {
    btn.classList.toggle('active-toggle', editNotesMode);
  }
  closeNoteToolbar();
  closeAddNoteMenu();
  const svg = document.querySelector('#recordImageContent svg');
  if (svg) renderCanvasNotes(svg);
}

function toggleCanvasNotesMode() {
  setEditNotesMode(!editNotesMode);
}

function openAddNoteMenu(anchorEl) {
  closeAddNoteMenu();
  if (!editNotesMode) setEditNotesMode(true);
  const menu = document.createElement('div');
  menu.className = 'add-note-menu';
  menu.id = 'addNoteMenu';
  const types = Object.keys(CANVAS_NOTE_TYPES);
  menu.innerHTML = types.map(t => {
    const meta = CANVAS_NOTE_TYPES[t];
    return `<button class="add-note-type" data-type="${t}"><span class="add-note-type-icon">${_escAttr(meta.icon)}</span><span>${_escAttr(meta.label)}</span></button>`;
  }).join('');
  document.body.appendChild(menu);
  const r = anchorEl.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.left = (r.left) + 'px';
  menu.style.top = (r.bottom + 4) + 'px';
  menu.style.zIndex = '100002';
  menu.querySelectorAll('.add-note-type').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      const type = btn.getAttribute('data-type');
      const note = addCanvasNote(type, 50, 50);
      closeAddNoteMenu();
      if (note) {
        renderRecordImage(packPotentials());
        const g = document.querySelector(`g[data-note-id="${note.id}"]`);
        if (g) openNoteToolbar(note.id, g);
      }
    });
  });
  setTimeout(() => {
    document.addEventListener('mousedown', _onAddNoteMenuOutside, { once: true });
  }, 0);
}

function _onAddNoteMenuOutside(e) {
  const menu = document.getElementById('addNoteMenu');
  if (!menu) return;
  if (e.target.closest('#addNoteMenu') || e.target.closest('#addNoteBtn')) return;
  closeAddNoteMenu();
}

function closeAddNoteMenu() {
  const menu = document.getElementById('addNoteMenu');
  if (menu) menu.remove();
}

function openDiscPickerForNote(noteId, anchorEl, clickPos) {
  closeDiscPicker();
  const note = getCanvasNote(noteId);
  if (!note) return;
  const ids = Object.keys(discData || {});
  if (!ids.length) {
    showToast('No discs loaded yet');
    return;
  }

  const ELEMENT_ORDER = { Aqua:0, Ignis:1, Ventus:2, Terra:3, Lux:4, Umbra:5, None:6, Other:7 };
  const ELEMENT_COLORS = {
    Aqua:   '#4aa3ff',
    Ignis:  '#ff6b4a',
    Ventus: '#5fd97e',
    Terra:  '#c4a04a',
    Lux:    '#ffd84a',
    Umbra:  '#a06fff',
    None:   '#888888',
    Other:  '#888888'
  };

  const charElementCount = {};
  if (typeof selectedChars !== 'undefined' && typeof charJson !== 'undefined') {
    selectedChars.filter(c => c).slice(0, 3).forEach(id => {
      const el = charJson[id] && charJson[id].element;
      if (el) charElementCount[el] = (charElementCount[el] || 0) + 1;
    });
  }

  const grouped = {};
  for (const id of ids) {
    const d = discData[id];
    const el = d.element || 'Other';
    if (!grouped[el]) grouped[el] = [];
    grouped[el].push({ id, d });
  }
  const elementKeys = Object.keys(grouped).sort((a, b) => {
    const ca = charElementCount[a] || 0;
    const cb = charElementCount[b] || 0;
    if (cb !== ca) return cb - ca;
    const oa = ELEMENT_ORDER[a] ?? 99;
    const ob = ELEMENT_ORDER[b] ?? 99;
    if (oa !== ob) return oa - ob;
    return a.localeCompare(b);
  });
  for (const k of elementKeys) {
    grouped[k].sort((a, b) => {
      const sa = a.d.star || 0;
      const sb = b.d.star || 0;
      if (sb !== sa) return sb - sa;
      return (a.d.name || '').localeCompare(b.d.name || '');
    });
  }

  const menu = document.createElement('div');
  menu.className = 'disc-picker-menu';
  menu.id = 'discPickerMenu';
  const head = document.createElement('div');
  head.className = 'disc-picker-head';
  head.innerHTML = `<span>Choose a disc</span><button class="disc-picker-close" title="Close">×</button>`;
  menu.appendChild(head);
  head.querySelector('.disc-picker-close').onclick = closeDiscPicker;

  const body = document.createElement('div');
  body.className = 'disc-picker-body';
  for (const el of elementKeys) {
    const section = document.createElement('div');
    section.className = 'disc-picker-section';
    const bar = document.createElement('div');
    bar.className = 'disc-picker-section-bar';
    bar.style.background = ELEMENT_COLORS[el] || '#888';
    section.appendChild(bar);
    const grid = document.createElement('div');
    grid.className = 'disc-picker-grid';
    for (const { id, d } of grouped[el]) {
      const imgId = String(id).slice(2);
      const cell = document.createElement('button');
      cell.type = 'button';
      let cellClass = 'disc-picker-cell';
      if (note.discId === id) cellClass += ' selected';
      if (d.star === 3 || d.star === 4 || d.star === 5) cellClass += ' star' + d.star;
      cell.className = cellClass;
      cell.title = `${d.name || id}${d.element && d.element !== 'None' ? ' (' + d.element + ')' : ''} · ${'★'.repeat(d.star || 0)}`;
      cell.setAttribute('data-id', id);
      let cellHTML = `<div class="disc-picker-clip"><img loading="lazy" src="${BASE_ASSETS}export/assets/assetbundles/icon/outfit/outfit_${imgId}_a.webp" onerror="this.style.opacity=0.2"></div>`;
      if (d.element) {
        cellHTML += `<img class="disc-picker-badge" loading="lazy" src="${_DISC_BADGE_BASE}${d.element}.avif" alt="${d.element}">`;
      }
      cell.innerHTML = cellHTML;
      cell.onclick = (ev) => {
        ev.stopPropagation();
        updateCanvasNote(noteId, { discId: id });
        closeDiscPicker();
        renderRecordImage(packPotentials());
        const g = document.querySelector(`g[data-note-id="${noteId}"]`);
        if (g) openNoteToolbar(noteId, g);
      };
      grid.appendChild(cell);
    }
    section.appendChild(grid);
    body.appendChild(section);
  }
  menu.appendChild(body);

  document.body.appendChild(menu);
  const menuRect = menu.getBoundingClientRect();
  const margin = 8;
  let left, top;
  if (clickPos) {
    left = clickPos.clientX - menuRect.width / 2;
    top = clickPos.clientY + 4;
    if (top + menuRect.height > window.innerHeight - margin) {
      top = Math.max(margin, clickPos.clientY - menuRect.height - 4);
    }
    left = Math.max(margin, Math.min(window.innerWidth - menuRect.width - margin, left));
  } else {
    const r = (anchorEl && anchorEl.getBoundingClientRect) ? anchorEl.getBoundingClientRect() : { left: window.innerWidth/2, right: window.innerWidth/2, top: window.innerHeight/2, bottom: window.innerHeight/2 };
    left = r.left + r.width/2 - menuRect.width/2;
    left = Math.max(margin, Math.min(window.innerWidth - menuRect.width - margin, left));
    top = r.bottom + 4;
    if (top + menuRect.height > window.innerHeight - margin) {
      top = Math.max(margin, r.top - menuRect.height - 4);
    }
  }
  menu.style.position = 'fixed';
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  menu.style.zIndex = '100005';

  setTimeout(() => {
    document.addEventListener('mousedown', _onDiscPickerOutside, { once: true });
  }, 0);
}

function _onDiscPickerOutside(e) {
  const menu = document.getElementById('discPickerMenu');
  if (!menu) return;
  if (e.target.closest('#discPickerMenu') || e.target.closest('.note-toolbar')) return;
  closeDiscPicker();
}

function closeDiscPicker() {
  const menu = document.getElementById('discPickerMenu');
  if (menu) menu.remove();
}

function _openColorPicker(anchorEl, note) {
  _closeColorPicker();
  const bar = anchorEl.closest('.note-toolbar') || document.getElementById('noteToolbar');
  if (!bar) return;
  const popup = document.createElement('div');
  popup.className = 'color-picker-popup';
  popup.id = 'colorPickerPopup';
  popup.innerHTML = _getThemeColorSwatches(note.color);
  document.body.appendChild(popup);

  const r = anchorEl.getBoundingClientRect();
  popup.style.position = 'fixed';
  popup.style.left = r.left + 'px';
  popup.style.top = (r.bottom + 4) + 'px';
  popup.style.zIndex = '100003';

  popup.querySelectorAll('.ntb-clr').forEach(swatch => {
    swatch.addEventListener('mousedown', e => e.preventDefault());
    swatch.addEventListener('click', e => {
      e.stopPropagation();
      const idxStr = swatch.getAttribute('data-index');
      if (idxStr == null) return;
      const idx = parseInt(idxStr, 10);
      updateCanvasNote(note.id, { color: idx });
      const clrBtn = bar.querySelector('.ntb-clr-btn');
      if (clrBtn) clrBtn.style.background = _getThemeColor(idx);
      _closeColorPicker();
      renderRecordImage(packPotentials());
    });
  });

  document.removeEventListener('mousedown', _onColorPickerOutside);
  setTimeout(() => {
    document.addEventListener('mousedown', _onColorPickerOutside, { once: true });
  }, 0);
}

function _closeColorPicker() {
  document.removeEventListener('mousedown', _onColorPickerOutside);
  const popup = document.getElementById('colorPickerPopup');
  if (popup) popup.remove();
}

function _onColorPickerOutside(e) {
  const popup = document.getElementById('colorPickerPopup');
  if (!popup) return;
  if (e.target.closest('#colorPickerPopup') || e.target.closest('.ntb-clr-btn')) return;
  _closeColorPicker();
}

function openNoteToolbar(noteId, gEl) {
  closeNoteToolbar();
  const note = getCanvasNote(noteId);
  if (!note) return;
  const svgEl = document.querySelector('#recordImageContent svg');
  if (!svgEl) return;

  const vb = svgEl.getAttribute('viewBox').split(' ').map(Number);
  const svgW = vb[2], svgH = vb[3];
  let noteVx, noteVy;
  if (note.type === 'chain') {
    const info = _chainAnchorInfo(svgEl, note.targetId);
    if (info) {
      noteVx = info.cx;
      noteVy = info.cy;
    }
  }
  if (noteVx == null) {
    noteVx = (note.x / 100) * svgW;
    noteVy = (note.y / 100) * svgH;
  }
  const svgRect = svgEl.getBoundingClientRect();
  const screenX = svgRect.left + (noteVx / svgW) * svgRect.width;
  const screenY = svgRect.top + (noteVy / svgH) * svgRect.height;

  const r = _renderNoteSvg(note, svgW, svgH);
  if (!r) return;
  const noteScreenH = (r.h / svgH) * svgRect.height;
  const noteTopY = screenY - noteScreenH / 2;
  const noteBotY = screenY + noteScreenH / 2;

  const bar = document.createElement('div');
  bar.className = 'note-toolbar';
  bar.id = 'noteToolbar';
  bar.setAttribute('data-note-id', noteId);
  bar.innerHTML = _noteToolbarInner(note);
  document.body.appendChild(bar);

  const barRect = bar.getBoundingClientRect();
  let left = screenX - barRect.width / 2;
  let top = noteTopY - barRect.height - 12;
  const margin = 8;
  if (left < margin) left = margin;
  if (left + barRect.width > window.innerWidth - margin) left = window.innerWidth - barRect.width - margin;
  if (top < margin) top = noteBotY + 12;
  bar.style.position = 'fixed';
  bar.style.left = left + 'px';
  bar.style.top = top + 'px';
  bar.style.zIndex = '100003';

  _wireNoteToolbar(bar, note);
  document.addEventListener('pointerdown', _onToolbarOutsideClick);
}

function _onToolbarOutsideClick(e) {
  const bar = document.getElementById('noteToolbar');
  if (!bar) return;
  if (e.target.closest('.note-toolbar')) return;
  if (e.target.closest('g[data-note-id]')) return;
  if (e.target.closest('#addNoteMenu')) return;
  if (e.target.closest('#discPickerMenu')) return;
  if (e.target.closest('#colorPickerPopup')) return;
  if (e.target.closest('#addNoteBtn')) return;
  if (e.target.closest('#editNotesBtn')) return;
  closeNoteToolbar();
}

function _getThemePalette() {
  const theme = getTheme(currentThemeName);
  return [
    theme.svgBg,
    theme.portrait[0],
    theme.portrait[1],
    theme.titleColor,
    theme.dividerColor,
    theme.groups.core,
    theme.groups.high,
    theme.groups.medium,
    theme.groups.low,
    theme.groups.optional,
    '#ffffff'
  ];
}

function _getThemeColor(index) {
  return _getThemePalette()[index] || '#ffffff';
}

function _getThemeColorSwatches(currentIndex) {
  const palette = _getThemePalette();
  const labels = ['Bg', 'P1', 'P2', 'Title', 'Div', 'Core', 'High', 'Med', 'Low', 'Opt', 'Wht'];
  return palette.map((color, idx) => {
    const active = idx === (currentIndex ?? 10) ? ' is-active' : '';
    return `<button class="ntb-clr${active}" data-index="${idx}" style="background:${color}" title="${labels[idx]}"></button>`;
  }).join('');
}

function _noteToolbarInner(note) {
  if (note.type === 'text') {
    return `
      <button class="ntb-btn" data-act="edit" title="Edit text">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11.5 2.5l2 2-7 7-2.5.5.5-2.5 7-7z"/>
        </svg>
      </button>
      <input class="ntb-size-input" type="number" value="${note.fontSize||18}" min="8" max="96" step="1" title="Font size">
      <span class="ntb-sep"></span>
      <button class="ntb-clr-btn" data-act="color" title="Text color" style="background:${_getThemeColor(note.color)}"></button>
      <span class="ntb-sep"></span>
      <button class="ntb-btn" data-act="del" title="Delete note">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 5h10M6 5V3h4v2M5 5l1 9h4l1-9"/>
        </svg>
      </button>
    `;
  }
  if (note.type === 'discImg') {
    return `
      <button class="ntb-btn" data-act="pick-disc" title="Choose disc">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="12" height="12" rx="1.5"/>
          <path d="M2 6h12M6 6v8"/>
        </svg>
      </button>
      <input class="ntb-size-input" type="number" value="${(note.imgSize||80)/10}" min="2" max="40" step="0.5" title="Disc size (×10)">
      <span class="ntb-sep"></span>
      <button class="ntb-btn" data-act="del" title="Delete note">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 5h10M6 5V3h4v2M5 5l1 9h4l1-9"/>
        </svg>
      </button>
    `;
  }
  if (note.type === 'chain') {
    const anchorLabel = note.targetId != null ? String(note.targetId) : '—';
    return `
      <span class="ntb-label" title="Anchored potential">${_escAttr(anchorLabel)}</span>
      <span class="ntb-sep"></span>
      <input class="ntb-size-input" type="number" value="${note.length||80}" min="30" max="200" step="5" title="Chain length">
      <span class="ntb-sep"></span>
      <button class="ntb-btn" data-act="del" title="Delete note">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 5h10M6 5V3h4v2M5 5l1 9h4l1-9"/>
        </svg>
      </button>
    `;
  }
  return '';
}

function _wireNoteToolbar(bar, note) {
  bar.querySelectorAll('.ntb-btn').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const act = btn.getAttribute('data-act');
      if (act === 'edit') startTextEditInPlace(note.id);
      else if (act === 'pick-disc') {
        const clickPos = { clientX: e.clientX, clientY: e.clientY };
        closeNoteToolbar();
        openDiscPickerForNote(note.id, btn, clickPos);
      } else if (act === 'del') {
        closeNoteToolbar();
        removeCanvasNote(note.id);
        renderRecordImage(packPotentials());
      }
    });
  });
  const clrBtn = bar.querySelector('.ntb-clr-btn');
  if (clrBtn) {
    clrBtn.addEventListener('mousedown', e => e.stopPropagation());
    clrBtn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      const popup = document.getElementById('colorPickerPopup');
      if (popup) {
        _closeColorPicker();
        return;
      }
      _openColorPicker(clrBtn, note);
    });
  }
  const inp = bar.querySelector('.ntb-size-input');
  if (inp) {
    inp.addEventListener('mousedown', e => e.stopPropagation());
    inp.addEventListener('change', () => {
      const val = parseFloat(inp.value);
      if (isNaN(val)) return;
      if (note.type === 'text') {
        updateCanvasNote(note.id, { fontSize: Math.max(8, Math.min(96, val)) });
      } else if (note.type === 'chain') {
        updateCanvasNote(note.id, { length: Math.max(30, Math.min(200, Math.round(val))) });
      } else {
        updateCanvasNote(note.id, { imgSize: Math.max(20, Math.min(400, Math.round(val * 10))) });
      }
      renderRecordImage(packPotentials());
    });
  }
}

function closeNoteToolbar() {
  document.removeEventListener('pointerdown', _onToolbarOutsideClick);
  _closeColorPicker();
  const bar = document.getElementById('noteToolbar');
  if (bar) bar.remove();
  const ed = document.getElementById('noteTextEditor');
  if (ed) ed.remove();
}

function startTextEditInPlace(noteId) {
  const note = getCanvasNote(noteId);
  if (!note) return;
  const svgEl = document.querySelector('#recordImageContent svg');
  if (!svgEl) return;
  const modal = document.querySelector('.record-preview-modal');
  if (!modal) return;

  const vb = svgEl.getAttribute('viewBox').split(' ').map(Number);
  const vw = vb[2], vh = vb[3];
  const noteX = (note.x / 100) * vw;
  const noteY = (note.y / 100) * vh;
  const svgRect = svgEl.getBoundingClientRect();
  const modalRect = modal.getBoundingClientRect();
  const screenX = svgRect.left + (noteX / vw) * svgRect.width;
  const screenY = svgRect.top + (noteY / vh) * svgRect.height;
  const relX = screenX - modalRect.left;
  const relY = screenY - modalRect.top;

  const fs = note.fontSize || 18;
  const lineHeight = fs * 1.2;

  const measure = document.createElement('span');
  measure.style.cssText = `visibility:hidden;position:absolute;left:-9999px;top:-9999px;font:${fs}px Consolas, 'SF Mono', monospace;white-space:pre;padding:0;border:0;`;
  document.body.appendChild(measure);

  const ed = document.createElement('textarea');
  ed.id = 'noteTextEditor';
  ed.className = 'note-text-editor note-text-editor-inplace';
  ed.value = note.text || '';
  ed.maxLength = 200;
  ed.rows = 1;
  ed.style.position = 'absolute';
  ed.style.fontSize = fs + 'px';
  ed.style.lineHeight = lineHeight + 'px';
  ed.style.padding = '2px 6px';
  ed.style.textAlign = 'center';
  ed.style.zIndex = '100004';

  const updateSize = () => {
    const lines = ed.value.split('\n');
    let maxW = 0;
    for (const line of lines) {
      measure.textContent = line || 'M';
      maxW = Math.max(maxW, measure.offsetWidth);
    }
    const maxAllowedW = modalRect.width - 40;
    const w = Math.max(60, Math.min(maxAllowedW, maxW + 16));
    const h = Math.max(lineHeight + 8, lines.length * lineHeight + 12);
    ed.style.width = w + 'px';
    ed.style.height = h + 'px';
    ed.style.left = Math.max(4, Math.min(modalRect.width - w - 4, relX - w / 2)) + 'px';
    ed.style.top = (relY - h / 2 - 4) + 'px';
  };
  const svgNote = svgEl.querySelector(`g[data-note-id="${CSS.escape(noteId)}"]`);
  if (svgNote) svgNote.style.opacity = '0';

  ed.addEventListener('input', updateSize);
  modal.appendChild(ed);
  updateSize();
  ed.focus();
  ed.select();

  let done = false;
  const finish = (commit) => {
    if (done) return;
    done = true;
    const newText = ed.value;
    ed.remove();
    measure.remove();
    if (commit && newText !== note.text) {
      updateCanvasNote(noteId, { text: newText });
    }
    renderRecordImage(packPotentials());
  };
  ed.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finish(true); }
    else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
  });
  ed.addEventListener('blur', () => finish(true));
}

function resetCanvasNotesMode() {
  _lastNoteClick = null;
  _noteDrag = null;
  setEditNotesMode(false);
  closeNoteToolbar();
  closeAddNoteMenu();
  closeDiscPicker();
}

function clearCanvasNotes() {
  closeNoteToolbar();
  closeAddNoteMenu();
  closeDiscPicker();
  canvasNotes = [];
  const svg = document.querySelector('#recordImageContent svg');
  if (svg) renderCanvasNotes(svg);
  if (typeof saveState === 'function') saveState();
}

function _escNoteText(s) {
  return String(s == null ? '' : s)
    .replace(/\\/g, '\\\\')
    .replace(/~/g, '\\~')
    .replace(/_/g, '\\_');
}
function _unescNoteText(s) {
  return String(s).replace(/\\(.)/g, '$1');
}
function _splitEscaped(s, sep) {
  const out = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && i + 1 < s.length) {
      cur += s[i] + s[i + 1];
      i++;
    } else if (s[i] === sep) {
      out.push(cur);
      cur = '';
    } else {
      cur += s[i];
    }
  }
  out.push(cur);
  return out;
}

function encodeCanvasNotesToParam() {
  if (!canvasNotes.length) return '';
  try {
    const parts = canvasNotes.map(n => {
      if (n.type === 'discImg') {
        return `D_${n.x}_${n.y}_${n.fontSize}_${n.imgSize}_${n.discId}`;
      }
      if (n.type === 'chain') {
        const tid = n.targetId == null ? 'null' : String(n.targetId);
        return `C_${tid}_${n.length||80}`;
      }
      return `t_${n.x}_${n.y}_${n.fontSize}_${n.color ?? 10}_${_escNoteText(n.text)}`;
    });
    return parts.join('~');
  } catch(e) { return ''; }
}

function decodeCanvasNotesFromParam(s) {
  if (!s) return;
  try {
    const noteStrs = _splitEscaped(s, '~');
    const parsed = noteStrs.map(ns => {
      const f = ns.split('_');
      const head = f[0];
      const type = head === 'D' ? 'discImg' : (head === 'C' ? 'chain' : 'text');
      const note = {
        id: _genNoteId(),
        type,
        x: Number(f[1]) || 50,
        y: Number(f[2]) || 50,
        fontSize: Number(f[3]) || 18,
      };
      if (type === 'discImg') {
        note.imgSize = Number(f[4]) || 80;
        note.discId = f[5] && f[5] !== 'null' ? f[5] : null;
        note.text = '';
        note.targetId = null;
        note.length = 80;
      } else if (type === 'chain') {
        note.x = 50;
        note.y = 50;
        note.fontSize = 18;
        note.text = '';
        note.discId = null;
        note.imgSize = 80;
        note.targetId = f[1] && f[1] !== 'null' ? f[1] : null;
        note.length = Number(f[2]) || 80;
      } else {
        if (f.length > 5) {
          const raw = f[4];
          const parsedIdx = parseInt(raw, 10);
          if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx <= 10) {
            note.color = parsedIdx;
            note.text = _unescNoteText(f.slice(5).join('_'));
          } else if (/^#[0-9a-fA-F]{6,8}$/.test(raw) || /^rgba?\(/.test(raw)) {
            note.color = 10;
            note.text = _unescNoteText(f.slice(5).join('_'));
          } else {
            note.color = 10;
            note.text = _unescNoteText(f.slice(4).join('_'));
          }
        } else {
          note.color = 10;
          note.text = _unescNoteText(f.slice(4).join('_'));
        }
        note.discId = null;
        note.imgSize = 80;
        note.targetId = null;
        note.length = 80;
      }
      return note;
    });
    canvasNotes = parsed
      .filter(n => CANVAS_NOTE_TYPES[n.type])
      .map(n => ({
        id: n.id || _genNoteId(),
        type: n.type,
        x: typeof n.x === 'number' ? _roundPct(n.x) : 50,
        y: typeof n.y === 'number' ? _roundPct(n.y) : 50,
    fontSize: n.fontSize || 18,
    text: n.text || '',
    color: n.color ?? 10,
    discId: n.discId ?? null,
        imgSize: n.imgSize || 80,
        targetId: n.targetId ?? null,
        length: n.length || 80
      }));
    saveState();
  } catch(e) { console.warn('Failed to decode canvas notes:', e.message); }
}
