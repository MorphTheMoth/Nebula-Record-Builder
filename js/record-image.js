let currentThemeName = localStorage.getItem('nrb-theme') || 'dark';
let currentTitle = localStorage.getItem('nrb-title') || '';

function setRecordTitle(value) {
  currentTitle = value;
  localStorage.setItem('nrb-title', value);
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('recordTitle');
  if (input) input.value = currentTitle;
});

function populateThemeSelect() {
  const sel = document.getElementById('themeSelect');
  if (!sel) return;
  sel.innerHTML = '';
  for (const key of Object.keys(themes)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = themes[key].name;
    sel.appendChild(opt);
  }
  sel.value = currentThemeName;
}

function setTheme(name) {
  if (!themes[name]) return;
  currentThemeName = name;
  localStorage.setItem('nrb-theme', name);
  const sel = document.getElementById('themeSelect');
  if (sel) sel.value = name;
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

function prevTheme() {
  const keys = Object.keys(themes);
  const idx = keys.indexOf(currentThemeName);
  setTheme(keys[(idx - 1 + keys.length) % keys.length]);
}

function nextTheme() {
  const keys = Object.keys(themes);
  const idx = keys.indexOf(currentThemeName);
  setTheme(keys[(idx + 1) % keys.length]);
}

function hideRecordImage() {
  document.getElementById('recordImageOverlay').style.display = 'none';
  document.body.classList.remove('modal-open');
}

function renderRecordImage(b64) {
  let decoded;
  try {
    decoded = unpackPotentials(b64);
  } catch(e) {
    console.warn('Invalid record-image base64:', e.message);
    return;
  }

  const { charIds, potentials } = decoded;
  const validIds = charIds.filter(id => id !== 0);
  if (!validIds.length) return;

  const cfgMap = buildCfgMap(validIds.map(String));

  const theme = getTheme(currentThemeName);
  const sectionColors = theme.groups;
  const groupKeys = ['core', 'high', 'medium', 'low', 'optional'];

  const RP = 6, NW = 20, IG = 4, GG = 20;
  const PW = 120, PH = 153;
  const RH = PH + RP * 2, RG = 16;
  const SCL = 1.08, SW = Math.round(PW * SCL), SH = Math.round(PH * SCL), SO = Math.round(-(SW - PW) / 2);

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  const rows = [];
  let maxRowW = 0;

  if (pendingPrios.length) {
    charIds.forEach((charId, slot) => {
      const cfg = cfgMap[charId];
      if (!cfg || !pendingPrios[slot]) return;
      const allIds = [...(cfg.MasterSpecificPotentialIds||[]), ...(cfg.MasterNormalPotentialIds||[]),
                       ...(cfg.AssistSpecificPotentialIds||[]), ...(cfg.AssistNormalPotentialIds||[]),
                       ...(cfg.CommonPotentialIds||[])];
      allIds.forEach(fullId => {
        const shortId = String(fullId).slice(-2);
        const prio = pendingPrios[slot][shortId];
        if (prio) priorityMap[fullId] = prio;
      });
    });
    pendingPrios = [];
  }

  const dividerH = 3;
  const extraGap = 12;

  charIds.forEach((charId, slot) => {
    if (!charId || !charJson[charId]) return;

    const ch = charJson[charId];
    const cfg = cfgMap[charId];
    if (!cfg) return;

    const isMain = slot === 0;
    const specKey = isMain ? 'MasterSpecificPotentialIds' : 'AssistSpecificPotentialIds';
    const normKey = isMain ? 'MasterNormalPotentialIds' : 'AssistNormalPotentialIds';
    const specIds = cfg[specKey] || [];
    const normIds = cfg[normKey] || [];
    const commIds = cfg.CommonPotentialIds || [];

    const allPots = [];
    [...specIds, ...normIds, ...commIds].forEach(pid => {
      const level = potentials[pid];
      if (level && level > 0) allPots.push({ id: pid, level });
    });
    if (!allPots.length) return;

    const groups = { core: [], high: [], medium: [], low: [], optional: [] };
    allPots.forEach(p => {
      const prio = priorityMap[String(p.id)];
      if (prio && groups[prio]) {
        groups[prio].push(p);
      } else if (p.level === 6 || p.level === 1) groups.core.push(p);
      else if (p.level >= 4) groups.high.push(p);
      else if (p.level >= 3) groups.medium.push(p);
      else groups.low.push(p);
    });

    if (potOrder[slot]) {
      for (const key of groupKeys) {
        const ord = potOrder[slot][key];
        if (ord && ord.length) {
          groups[key].sort((a, b) => {
            const oa = ord.indexOf(String(a.id));
            const ob = ord.indexOf(String(b.id));
            if (oa >= 0 && ob >= 0) return oa - ob;
            if (oa >= 0) return -1;
            if (ob >= 0) return 1;
            return 0;
          });
        }
      }
    }

    const charImg = `${BASE_ASSETS}export/assets/assetbundles/icon/head/head_${charId}02_XL.webp`;
    const name = ch.name || '';

    let x = 0;
    const elements = [];

    const pbW = RP + NW + IG + PW + RP;
    elements.push({ t: 'portrait', x, w: pbW, img: charImg, name, slot });
    x += pbW;

    for (const key of groupKeys) {
      const items = groups[key];
      if (!items.length) continue;
      x += GG;
      const gw = RP + NW + IG + items.length * PW + (items.length - 1) * IG + RP;
      elements.push({ t: 'group', x, w: gw, key, items, color: sectionColors[key], slot });
      x += gw;
    }

    const ry = rows.length * (RH + RG);
    const yOff = rows.length > 0 ? extraGap + dividerH : 0;
    rows.push({ elements, y: ry + yOff });
    maxRowW = Math.max(maxRowW, x);
  });

  if (!rows.length) {
    document.getElementById('recordImageContent').innerHTML = '<div style="color:#555;font-size:14px;">No characters to display</div>';
    return;
  }

  const sp = 10;
  const titleH = currentTitle ? 64 : 0;
  const svgW = maxRowW + sp * 2;
  let svgH = titleH + rows.length * RH + (rows.length - 1) * RG + sp * 2;
  let dividerY = 0;
  if (rows.length > 1) {
    svgH += extraGap + dividerH;
    dividerY = sp + RH + (RG + extraGap + dividerH) / 2 + titleH;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="max-width:100%;height:auto;display:block;">
<defs><clipPath id="c"><rect width="${PW}" height="${PH}" rx="4"/></clipPath></defs>
<rect width="${svgW}" height="${svgH}" fill="${theme.svgBg}"/>`;

  if (currentTitle) {
    svg += `<text x="${sp + 20}" y="${titleH - 18}" font-size="36" font-weight="700" fill="${theme.titleColor}" font-family="sans-serif">${esc(currentTitle)}</text>`;
  }

  for (const row of rows) {
    const ry = titleH + row.y + sp;
    for (const el of row.elements) {
      const ex = el.x + sp;
      if (el.t === 'portrait') {
        svg += `<rect x="${ex}" y="${ry}" width="${el.w}" height="${RH}" rx="4" fill="${theme.portrait[el.slot === 0 ? 0 : 1]}"/>`;
        svg += `<g transform="translate(${ex+RP+NW+IG},${ry+RP})" clip-path="url(#c)"><image x="${SO}" y="${SO}" width="${SW}" height="${SH}" href="${esc(el.img)}" preserveAspectRatio="xMidYMid slice"/></g>`;
        svg += `<foreignObject x="${ex+RP}" y="${ry+RP}" width="${NW}" height="${PH}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${NW}px;height:${PH}px;display:flex;justify-content:center;"><div style="writing-mode:vertical-rl;font-size:20px;font-weight:700;color:${theme.titleColor};line-height:0.85;font-family:sans-serif;">${esc(el.name)}</div></div></foreignObject>`;
      } else {
        svg += `<rect x="${ex}" y="${ry}" width="${el.w}" height="${RH}" rx="4" fill="${el.color}"/>`;
        svg += `<foreignObject x="${ex+RP}" y="${ry+RP}" width="${NW}" height="${PH}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${NW}px;height:${PH}px;display:flex;justify-content:center;"><div style="writing-mode:vertical-rl;font-size:20px;font-weight:700;color:${theme.titleColor};line-height:0.85;font-family:sans-serif;">${el.key.charAt(0).toUpperCase()+el.key.slice(1)}</div></div></foreignObject>`;
        let ix = ex + RP + NW + IG;
        for (const p of el.items) {
          svg += `<g data-id="${p.id}" data-slot="${el.slot}" data-group="${el.key}" transform="translate(${ix},${ry+RP})" clip-path="url(#c)"><image x="0" y="0" width="${PW}" height="${PH}" href="${esc(BASE_ASSETS)}potential/${p.id}.webp" preserveAspectRatio="xMidYMid slice"/></g>`;
          if (!['01','02','03','04','21','22','23','24'].includes(String(p.id).slice(-2)))
            svg += `<text x="${ix+15}" y="${ry+RP+16}" font-size="16" font-family="Consolas,monospace" font-weight="bold" fill="#568">${p.level}</text>`;
          ix += PW + IG;
        }
      }
    }
  }

  if (dividerY > 0) {
    svg += `<line x1="${sp}" y1="${dividerY}" x2="${sp + maxRowW}" y2="${dividerY}" stroke="${theme.dividerColor}" stroke-width="${dividerH}" stroke-linecap="round"/>`;
  }

  svg += `</svg>`;

  document.getElementById('recordImageContent').innerHTML = svg;
  populateThemeSelect();

  attachPotentialTooltips(document.querySelector('#recordImageContent svg'));

  enableSvgReorder();

  document.getElementById('recordImageOverlay').style.display = 'block';
  document.body.classList.add('modal-open');
}

function downloadRecordSVG() {
  const svgEl = document.querySelector('#recordImageContent svg');
  if (!svgEl) return;
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'record-preview.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function svgToPngBlob(svgEl) {
  const clone = svgEl.cloneNode(true);
  const imgs = clone.querySelectorAll('image');
  await Promise.all(Array.from(imgs).map(async el => {
    const href = el.getAttribute('href');
    if (!href || href.startsWith('data:')) return;
    try {
      const resp = await fetch(href);
      const blob = await resp.blob();
      const dataUrl = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); });
      el.setAttribute('href', dataUrl);
    } catch (e) { console.warn('PNG embed failed:', href, e); }
  }));
  const svgData = new XMLSerializer().serializeToString(clone);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const scale = 2;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(pngBlob => resolve(pngBlob));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('PNG conversion failed')); };
    img.src = url;
  });
}

async function downloadRecordPNG() {
  const svgEl = document.querySelector('#recordImageContent svg');
  if (!svgEl) return;
  try {
    const pngBlob = await svgToPngBlob(svgEl);
    const pngUrl = URL.createObjectURL(pngBlob);
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = 'record-preview.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(pngUrl);
  } catch (e) { alert('PNG export failed.'); }
}

function buildRecordUrl() {
  const b64 = packPotentials();
  const chars = selectedChars.filter(c => c);
  const cfgMap = buildCfgMap(chars);
  const keys = ['core', 'high', 'medium', 'low', 'optional'];
  const slotStrs = [];
  chars.forEach((cId, slot) => {
    const cfg = cfgMap[cId];
    if (!cfg) { slotStrs.push(''); return; }
    const allIds = [...(cfg.MasterSpecificPotentialIds||[]), ...(cfg.MasterNormalPotentialIds||[]),
                     ...(cfg.AssistSpecificPotentialIds||[]), ...(cfg.AssistNormalPotentialIds||[]),
                     ...(cfg.CommonPotentialIds||[])];
    const byPrio = {};
    allIds.forEach(fullId => {
      if (priorityMap[fullId]) {
        const short = String(fullId).slice(-2);
        (byPrio[priorityMap[fullId]] || (byPrio[priorityMap[fullId]] = [])).push(short);
      }
    });
    const parts = keys.map(k => (byPrio[k] || []).join(','));
    slotStrs.push(parts.join('-'));
  });
  const base = window.location.protocol + '//' + window.location.host + window.location.pathname;
  let url = base + '?record-png=' + encodeURIComponent(b64);
  const prioStr = slotStrs.join('_');
  if (prioStr.replace(/-/g, '')) url += '&priorities=' + encodeURIComponent(prioStr);
  if (currentTitle) url += '&title=' + encodeURIComponent(currentTitle);
  url += '&theme=' + encodeURIComponent(currentThemeName);

  const groupKeys = ['core', 'high', 'medium', 'low', 'optional'];
  const orderParts = [];
  chars.forEach((cId, slot) => {
    if (!potOrder[slot]) { orderParts.push(''); return; }
    const encoded = groupKeys.map(key => {
      const ids = potOrder[slot][key];
      if (!ids || !ids.length) return '';
      return ids.map(id => String(id).slice(-2)).join('');
    }).join('-');
    orderParts.push(encoded);
  });
  const orderStr = orderParts.join('_');
  if (orderStr.replace(/_/g, '')) url += '&order=' + encodeURIComponent(orderStr);

  return url;
}

function openRecordPNG() {
  window.location.href = buildRecordUrl();
}

function copyRecordLink() {
  const url = buildRecordUrl();
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('copyRecordLinkBtn');
    if (btn) { const t = btn.textContent; btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = t, 1500); }
  }).catch(() => alert('Failed to copy link.'));
}

function getPotPriority(potId, level) {
  const p = priorityMap[String(potId)];
  if (p && ['core','high','medium','low','optional'].includes(p)) return p;
  if (level === 6 || level === 1) return 'core';
  if (level >= 4) return 'high';
  if (level >= 3) return 'medium';
  return 'low';
}

function getCurrentGroupOrder(slot, group) {
  const charId = selectedChars[slot];
  if (!charId) return [];
  const cfgMap = buildCfgMap([String(charId)]);
  const cfg = cfgMap[Number(charId)];
  if (!cfg) return [];
  const isMain = slot === 0;
  const specKey = isMain ? 'MasterSpecificPotentialIds' : 'AssistSpecificPotentialIds';
  const normKey = isMain ? 'MasterNormalPotentialIds' : 'AssistNormalPotentialIds';
  const ids = [...(cfg[specKey]||[]), ...(cfg[normKey]||[]), ...(cfg.CommonPotentialIds||[])];
  const pots = ids.filter(pid => (potLevels[pid] || 0) > 0).map(pid => ({ id: pid, level: potLevels[pid] }));
  return pots.filter(p => getPotPriority(p.id, p.level) === group).map(p => String(p.id));
}

function resetPotOrder() {
  potOrder = {};
  saveState();
  renderRecordImage(packPotentials());
}

function enableSvgReorder() {
  const svg = document.querySelector('#recordImageContent svg');
  if (!svg) return;
  svg.querySelectorAll('g[data-id]').forEach(el => {
    el.style.cursor = 'grab';
    el.addEventListener('mousedown', onSvgPotMouseDown);
  });
}

let _svgDrag = null;
let _lastStateKey = null;
let _dragActive = false;

function clearSvgDragTargets() {
  document.querySelectorAll('g[data-id]').forEach(el => {
    el.classList.remove('svg-drag-src');
    el.style.cursor = 'grab';
  });
}

function onSvgPotMouseDown(e) {
  if (e.button !== 0) return;
  const g = e.currentTarget;
  if (!g) return;
  _svgDrag = {
    el: g,
    id: g.getAttribute('data-id'),
    slot: g.getAttribute('data-slot'),
    group: g.getAttribute('data-group')
  };
  _lastStateKey = null;
  _dragActive = true;
  const tt = document.querySelector('.pot-tooltip');
  if (tt) tt.style.display = 'none';
  g.classList.add('svg-drag-src');
  document.addEventListener('mousemove', onSvgDragMove);
  document.addEventListener('mouseup', onSvgDragEnd);
  e.preventDefault();
}

function onSvgDragMove(e) {
  if (!_svgDrag) return;
  const raw = document.elementFromPoint(e.clientX, e.clientY);
  if (!raw) return;
  const g = raw.closest('g[data-id]');
  if (!g) return;
  if (g.getAttribute('data-slot') !== _svgDrag.slot) return;

  const targetId = g.getAttribute('data-id');
  const targetGroup = g.getAttribute('data-group');
  if (targetId === _svgDrag.id) return;

  const rect = g.getBoundingClientRect();
  const insertBefore = e.clientX < rect.left + rect.width / 2;

  const slot = parseInt(_svgDrag.slot);
  const sourceGroup = _svgDrag.group;
  const draggedId = _svgDrag.id;

  if (targetGroup !== sourceGroup) {
    _lastStateKey = null;
    priorityMap[draggedId] = targetGroup;

    if (!potOrder[slot]) potOrder[slot] = {};
    if (potOrder[slot][sourceGroup]) {
      const idx = potOrder[slot][sourceGroup].indexOf(draggedId);
      if (idx !== -1) potOrder[slot][sourceGroup].splice(idx, 1);
    }
    if (!potOrder[slot][targetGroup]) {
      potOrder[slot][targetGroup] = getCurrentGroupOrder(slot, targetGroup);
    }

    const tgtArr = potOrder[slot][targetGroup];
    const curIdx = tgtArr.indexOf(draggedId);
    if (curIdx !== -1) tgtArr.splice(curIdx, 1);

    const toIdx = tgtArr.indexOf(targetId);
    if (toIdx !== -1) {
      tgtArr.splice(insertBefore ? toIdx : toIdx + 1, 0, draggedId);
    } else {
      tgtArr.push(draggedId);
    }

    _svgDrag.group = targetGroup;
    _svgDrag.slot = String(slot);
    saveState();
    renderRecordImage(packPotentials());
    _svgDrag.el = document.querySelector(`g[data-id="${_svgDrag.id}"]`);
    if (_svgDrag.el) { _svgDrag.el.classList.add('svg-drag-src'); _svgDrag.el.style.cursor = 'grabbing'; }
    return;
  }

  const stateKey = targetId + (insertBefore ? '<' : '>');
  if (stateKey === _lastStateKey) return;
  _lastStateKey = stateKey;

  const group = sourceGroup;

  if (!potOrder[slot]) potOrder[slot] = {};
  if (!potOrder[slot][group]) potOrder[slot][group] = getCurrentGroupOrder(slot, group);

  const arr = potOrder[slot][group];
  const fromIdx = arr.indexOf(draggedId);
  const toIdx = arr.indexOf(targetId);
  if (toIdx === -1) return;
  if (fromIdx === -1) {
    arr.push(draggedId);
    const newFromIdx = arr.indexOf(draggedId);
    arr.splice(newFromIdx, 1);
    const newToIdx = arr.indexOf(targetId);
    arr.splice(insertBefore ? newToIdx : newToIdx + 1, 0, draggedId);
    renderRecordImage(packPotentials());
    _svgDrag.el = document.querySelector(`g[data-id="${_svgDrag.id}"]`);
    if (_svgDrag.el) { _svgDrag.el.classList.add('svg-drag-src'); _svgDrag.el.style.cursor = 'grabbing'; }
    return;
  }

  arr.splice(fromIdx, 1);
  const newToIdx = arr.indexOf(targetId);
  arr.splice(insertBefore ? newToIdx : newToIdx + 1, 0, draggedId);

  renderRecordImage(packPotentials());

  _svgDrag.el = document.querySelector(`g[data-id="${_svgDrag.id}"]`);
  if (_svgDrag.el) {
    _svgDrag.el.classList.add('svg-drag-src');
    _svgDrag.el.style.cursor = 'grabbing';
  }
}

function onSvgDragEnd() {
  document.removeEventListener('mousemove', onSvgDragMove);
  document.removeEventListener('mouseup', onSvgDragEnd);
  _lastStateKey = null;
  if (!_svgDrag) { clearSvgDragTargets(); return; }

  _dragActive = false;
  clearSvgDragTargets();
  saveState();
  _svgDrag = null;
}

function resolveOrderFromParam(orderStr) {
  if (!orderStr) return;
  potOrder = {};
  const chars = selectedChars.filter(c => c);
  if (!chars.length) return;
  const cfgMap = buildCfgMap(chars);
  const groupKeys = ['core', 'high', 'medium', 'low', 'optional'];

  orderStr.split('_').forEach((slotStr, slot) => {
    if (!slotStr) return;
    const parts = slotStr.split('-');
    const charId = selectedChars[slot];
    if (!charId || !cfgMap[+charId]) return;
    const cfg = cfgMap[+charId];
    const isMain = slot === 0;
    const specKey = isMain ? 'MasterSpecificPotentialIds' : 'AssistSpecificPotentialIds';
    const normKey = isMain ? 'MasterNormalPotentialIds' : 'AssistNormalPotentialIds';
    const allFullIds = [...(cfg[specKey]||[]), ...(cfg[normKey]||[]), ...(cfg.CommonPotentialIds||[])];

    const shortToFull = {};
    allFullIds.forEach(fid => { shortToFull[String(fid).slice(-2)] = fid; });

    const orders = {};
    parts.forEach((part, i) => {
      if (i >= groupKeys.length) return;
      const fullIds = [];
      for (let j = 0; j < part.length; j += 2) {
        const short = part.slice(j, j + 2);
        if (short.length === 2 && shortToFull[short]) fullIds.push(String(shortToFull[short]));
      }
      if (fullIds.length) orders[groupKeys[i]] = fullIds;
    });

    if (Object.keys(orders).length) potOrder[slot] = orders;
  });
}

function attachPotentialTooltips(container) {
  let tt = document.querySelector('.pot-tooltip');
  if (!tt) {
    tt = document.createElement('div');
    tt.className = 'pot-tooltip';
    tt.style.display = 'none';
    document.body.appendChild(tt);
  }
  if (!container) return;
  container.querySelectorAll('[data-id]').forEach(el => {
    let moveHandler = null;
    const pid = el.getAttribute('data-id');
    el.addEventListener('mouseenter', e => {
      if (_dragActive) return;
      const tooltip = document.querySelector('.pot-tooltip');
      if (!tooltip) return;
      let def = null;
      for (const key of Object.keys(charJson)) {
        const c = charJson[key];
        if (!c?.potential) continue;
        for (const pk of ['mainCore','mainNormal','supportCore','supportNormal','common']) {
          const arr = c.potential[pk];
          if (!Array.isArray(arr)) continue;
          const found = arr.find(p => String(p.id) === pid);
          if (found) { def = found; break; }
        }
        if (def) break;
      }
      const bigImg = document.createElement('img');
      bigImg.src = BASE_ASSETS + `potential/${pid}.webp`;
      const descDiv = document.createElement('div');
      descDiv.className = 'desc';
      let rawDesc = def ? formatPotentialDesc(pid, def.params) : 'No description available.';
      if (!rawDesc || rawDesc === 'No description available.') rawDesc = 'No detailed description found.';
      rawDesc = formatDescriptionWithColor(rawDesc);
      descDiv.innerHTML = rawDesc;
      tooltip.innerHTML = '';
      tooltip.appendChild(bigImg);
      tooltip.appendChild(descDiv);
      tooltip.style.display = 'flex';
      const updatePos = ev => { tooltip.style.left = (ev.clientX + 15) + 'px'; tooltip.style.top = (ev.clientY + 15) + 'px'; };
      updatePos(e);
      window.addEventListener('mousemove', updatePos);
      moveHandler = updatePos;
    });
    el.addEventListener('mouseleave', () => {
      const tooltip = document.querySelector('.pot-tooltip');
      if (tooltip) tooltip.style.display = 'none';
      if (moveHandler) { window.removeEventListener('mousemove', moveHandler); moveHandler = null; }
    });
  });
}

function enablePngHover(pngImg) {
  const svgEl = document.querySelector('#recordImageContent svg');
  if (!svgEl || !pngImg) return;

  const vb = svgEl.getAttribute('viewBox').split(' ').map(Number);
  const svgW = vb[2], svgH = vb[3];
  const PW = 120, PH = 153;

  const pots = [];
  svgEl.querySelectorAll('[data-id]').forEach(el => {
    const pid = el.getAttribute('data-id');
    const t = el.getAttribute('transform');
    const m = t?.match(/translate\(([^,]+),([^)]+)\)/);
    if (!m) return;
    pots.push({ id: pid, x: parseFloat(m[1]), y: parseFloat(m[2]) });
  });
  if (!pots.length) return;

  let currentPid = null;

  pngImg.addEventListener('mousemove', e => {
    const rect = pngImg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (svgW / rect.width);
    const my = (e.clientY - rect.top) * (svgH / rect.height);

    const hit = pots.find(p => mx >= p.x && mx < p.x + PW && my >= p.y && my < p.y + PH);

    const tooltip = document.querySelector('.pot-tooltip');
    if (!tooltip) return;

    if (hit) {
      if (hit.id !== currentPid) {
        currentPid = hit.id;
        let def = null;
        for (const key of Object.keys(charJson)) {
          const c = charJson[key];
          if (!c?.potential) continue;
          for (const pk of ['mainCore','mainNormal','supportCore','supportNormal','common']) {
            const arr = c.potential[pk];
            if (!Array.isArray(arr)) continue;
            const found = arr.find(p => String(p.id) === hit.id);
            if (found) { def = found; break; }
          }
          if (def) break;
        }
        const bigImg = document.createElement('img');
        bigImg.src = BASE_ASSETS + `potential/${hit.id}.webp`;
        const descDiv = document.createElement('div');
        descDiv.className = 'desc';
        let rawDesc = def ? formatPotentialDesc(hit.id, def.params) : 'No description available.';
        if (!rawDesc || rawDesc === 'No description available.') rawDesc = 'No detailed description found.';
        rawDesc = formatDescriptionWithColor(rawDesc);
        descDiv.innerHTML = rawDesc;
        tooltip.innerHTML = '';
        tooltip.appendChild(bigImg);
        tooltip.appendChild(descDiv);
        tooltip.style.display = 'flex';
      }
      tooltip.style.left = (e.clientX + 15) + 'px';
      tooltip.style.top = (e.clientY + 15) + 'px';
    } else if (currentPid) {
      currentPid = null;
      tooltip.style.display = 'none';
    }
  });

  pngImg.addEventListener('mouseleave', () => {
    currentPid = null;
    const tooltip = document.querySelector('.pot-tooltip');
    if (tooltip) tooltip.style.display = 'none';
  });
}

function checkRecordImageParam() {
  const params = new URLSearchParams(window.location.search);
  const titleParam = params.get('title');
  if (titleParam) {
    currentTitle = titleParam;
    localStorage.setItem('nrb-title', currentTitle);
  }
  const themeParam = params.get('theme');
  if (themeParam && themes[themeParam]) {
    currentThemeName = themeParam;
  }
  const orderParam = params.get('order');
  const preview = params.get('record-preview');
  const png = params.get('record-png');
  const image = params.get('record-image') || png;
  if (preview) {
    document.getElementById('importInput').value = preview;
    importPotentials();
    if (orderParam) resolveOrderFromParam(orderParam);
    renderRecordImage(preview);
  }
  if (image) {
    document.getElementById('importInput').value = image;
    importPotentials();
    if (orderParam) resolveOrderFromParam(orderParam);
    renderRecordImage(image);
    setTimeout(() => downloadRecordPNG(), 500);
  }

  const titleInput = document.getElementById('recordTitle');
  if (titleInput) titleInput.value = currentTitle;
}
