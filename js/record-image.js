let currentThemeName = resolveThemeName(localStorage.getItem('nrb-theme')) || 'dark';
let currentTitle = localStorage.getItem('nrb-title') || '';
let currentLvlFont = (() => { const v = Number(localStorage.getItem('nrb-lvl-font')); return (v && v > 0) ? v : 17; })();
let showTotalPots = localStorage.getItem('nrb-show-total-pots') !== 'false';
let showTotalPotsCount = localStorage.getItem('nrb-show-total-pots-count') === 'true';
let totalPotsCountPrefix = localStorage.getItem('nrb-total-pots-count-prefix');
if (totalPotsCountPrefix === null) totalPotsCountPrefix = 'Total Pots';
let _lastRecordPngBlob = null;

function setRecordTitle(value) {
  currentTitle = value;
  localStorage.setItem('nrb-title', value);
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

function setLvlFont(value) {
  const v = parseInt(value, 10);
  currentLvlFont = (v && v > 0) ? v : 16;
  localStorage.setItem('nrb-lvl-font', String(currentLvlFont));
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

function openUserSettings() {
  const ov = document.getElementById('userSettingsOverlay');
  if (ov) ov.style.display = 'block';
}

function closeUserSettings() {
  const ov = document.getElementById('userSettingsOverlay');
  if (ov) ov.style.display = 'none';
}

function setShowTotalPots(value) {
  showTotalPots = !!value;
  localStorage.setItem('nrb-show-total-pots', showTotalPots ? 'true' : 'false');
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

function setShowTotalPotsCount(value) {
  showTotalPotsCount = !!value;
  localStorage.setItem('nrb-show-total-pots-count', showTotalPotsCount ? 'true' : 'false');
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

function setTotalPotsCountPrefix(value) {
  totalPotsCountPrefix = value || '';
  localStorage.setItem('nrb-total-pots-count-prefix', totalPotsCountPrefix);
  const overlay = document.getElementById('recordImageOverlay');
  if (overlay && overlay.style.display !== 'none') {
    renderRecordImage(packPotentials());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('recordTitle');
  if (input) input.value = currentTitle;
  const lvlInput = document.getElementById('recordLvlFont');
  if (lvlInput) lvlInput.value = currentLvlFont;
  const totalPotsInput = document.getElementById('recordShowTotalPots');
  if (totalPotsInput) totalPotsInput.checked = showTotalPots;
  const totalPotsCountInput = document.getElementById('recordShowTotalPotsCount');
  if (totalPotsCountInput) totalPotsCountInput.checked = showTotalPotsCount;
  const totalPotsCountPrefixInput = document.getElementById('recordTotalPotsCountPrefix');
  if (totalPotsCountPrefixInput) totalPotsCountPrefixInput.value = totalPotsCountPrefix;
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
  const resolved = resolveThemeName(name);
  if (!resolved) return;
  currentThemeName = resolved;
  localStorage.setItem('nrb-theme', resolved);
  const sel = document.getElementById('themeSelect');
  if (sel) sel.value = resolved;
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
  if (typeof resetCanvasNotesMode === 'function') resetCanvasNotesMode();
}

function previewRecord() {
  const hasChar = selectedChars.some(c => c);
  const currentPotIds = new Set();
  selectedChars.filter(c => c).slice(0, 3).forEach(cId => {
    const cfg = charJson[cId]?.potential;
    if (!cfg) return;
    const isMain = selectedChars.filter(c => c).indexOf(cId) === 0;
    const coreKey = isMain ? 'mainCore' : 'supportCore';
    const normalKey = isMain ? 'mainNormal' : 'supportNormal';
    (cfg[coreKey] || []).forEach(p => currentPotIds.add(p.id));
    (cfg[normalKey] || []).forEach(p => currentPotIds.add(p.id));
    (cfg.common || []).forEach(p => currentPotIds.add(p.id));
  });
  const hasPot = [...currentPotIds].some(pid => (potLevels[pid] || 0) > 0);
  if (!hasChar || !hasPot) {
    showErrorToast('Select a character or potential first.');
    return;
  }
  renderRecordImage(packPotentials());
}

function renderRecordImage(b64, options = {}) {
  const returnSVG = !!options.returnSVG;
  _lastRecordPngBlob = null;
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

  // Include extra selected chars beyond the first 3
  const extraIds = selectedChars.filter(c => c).slice(3).map(id => +id).filter(id => !validIds.includes(id));

  // Merge potentials from base64 (first 3) with extras' levels from global state
  const mergedPots = { ...potentials };
  extraIds.forEach(cId => {
    const ch = charJson[cId];
    if (!ch?.potential) return;
    const allPotIds = [
      ...(ch.potential.mainCore || []).map(p => p.id),
      ...(ch.potential.mainNormal || []).map(p => p.id),
      ...(ch.potential.supportCore || []).map(p => p.id),
      ...(ch.potential.supportNormal || []).map(p => p.id),
      ...(ch.potential.common || []).map(p => p.id),
    ];
    allPotIds.forEach(pid => {
      const lvl = potLevels[pid];
      if (lvl > 0) mergedPots[pid] = lvl;
    });
  });

  const allCharIds = [...validIds, ...extraIds];
  const cfgMap = buildCfgMap(allCharIds.map(String));

  const theme = getTheme(currentThemeName);
  const sectionColors = theme.groups;
  const groupKeys = ['core', 'high', 'medium', 'low', 'optional'];

  const RP = 6, NW = 20, IG = 4, GG = 20;
  const PW = 120, PH = 153;
  const RH = PH + RP * 2, RG = 16;
  const SCL = 1.08, SW = Math.round(PW * SCL), SH = Math.round(PH * SCL), SO = Math.round(-(SW - PW) / 2);

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function vertText(x, y, str, color) {
    const title = str.replace(/\b\w/g, c => c.toUpperCase());
    return `<text transform="translate(${x},${y}) rotate(90)" text-anchor="start" dominant-baseline="hanging" font-size="20" font-weight="900" fill="${color}" font-family="DejaVu Sans, sans-serif">${esc(title)}</text>`;
  }

  const rows = [];
  let maxRowW = 0;
  let totalPotCount = 0;

  const dividerH = 3;
  const extraGap = 12;

  allCharIds.forEach((charId, slot) => {
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
      const level = mergedPots[pid];
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

    const variant = charHeadVariants[String(charId)] || '02';
    const customSrc = customHeadImages[String(charId)];
    const charImg = customSrc || `${BASE_ASSETS}export/assets/assetbundles/icon/head/head_${charId}${variant}_XL.webp`;
    const name = charData[charId] || '';

    let x = 0;
    const elements = [];

    const pbW = RP + NW + IG + PW + RP;
    const potSum = allPots.reduce((s, p) => s + p.level, 0);
    totalPotCount += potSum;
    elements.push({ t: 'portrait', x, w: pbW, img: charImg, name, slot, charId, potSum });
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
    const yOff = (rows.length > 0 ? extraGap + dividerH : 0) + (rows.length >= 2 && allCharIds.length > 3 ? extraGap + dividerH : 0);
    rows.push({ elements, y: ry + yOff });
    maxRowW = Math.max(maxRowW, x);
  });

  if (!rows.length) {
    document.getElementById('recordImageContent').innerHTML = '<div style="color:#555;font-size:14px;">No characters to display</div>';
    return;
  }

  const sp = 10;
  const titleHasCount = showTotalPotsCount && totalPotCount > 0;
  const titleH = (currentTitle || titleHasCount) ? 64 : 0;
  const svgW = maxRowW + sp * 2;
  let svgH = titleH + rows.length * RH + (rows.length - 1) * RG + sp * 2;
  const dividerYs = [];
  if (rows.length > 1) {
    svgH += extraGap + dividerH;
    dividerYs.push(sp + RH + (RG + extraGap + dividerH) / 2 + titleH);
  }
  if (rows.length > 3) {
    svgH += extraGap + dividerH;
    dividerYs.push(sp + 2 * RH + RG + extraGap + dividerH + (RG + extraGap + dividerH) / 2 + titleH);
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="max-width:100%;height:auto;display:block;">
<defs><clipPath id="c"><rect width="${PW}" height="${PH}" rx="4"/></clipPath><style>@font-face{font-family:'DejaVu Sans Mono';src:url('data/fonts/DejaVuSansMono.woff2')format('woff2');}.h-bdg{opacity:0;transition:opacity .12s}.h-ar:hover .h-bdg{opacity:1}.h-ar{cursor:pointer}</style></defs>
<rect width="${svgW}" height="${svgH}" fill="${theme.svgBg}"/>`;

  let titleText = '';
  if (titleHasCount) {
    titleText += (totalPotsCountPrefix ? totalPotsCountPrefix + ' ' : '') + totalPotCount;
    if (currentTitle) titleText += ' | ';
  }
  titleText += (currentTitle || '');
  if (titleText) {
    svg += `<text x="${sp + 20}" y="${titleH - 18}" font-size="36" font-weight="900" fill="${theme.titleColor}" font-family="DejaVu Sans, sans-serif">${esc(titleText)}</text>`;
  }

  const potPositions = [];
  for (const row of rows) {
    const ry = titleH + row.y + sp;
    for (const el of row.elements) {
      const ex = el.x + sp;
      if (el.t === 'portrait') {
        svg += `<rect x="${ex}" y="${ry}" width="${el.w}" height="${RH}" rx="4" fill="${theme.portrait[el.slot === 0 ? 0 : 1]}"/>`;
        svg += `<g class="h-ar" transform="translate(${ex+RP+NW+IG},${ry+RP})" clip-path="url(#c)"><image x="${SO}" y="${SO}" width="${SW}" height="${SH}" href="${esc(el.img)}" preserveAspectRatio="xMidYMid slice"/><g class="h-bdg" style="pointer-events:none"><rect x="0" y="0" width="${PW}" height="${PH}" fill="rgba(0,0,0,0.4)"/><circle cx="${PW/2}" cy="${PH/2}" r="16" fill="rgba(0,0,0,0.55)"/><g transform="translate(${PW/2},${PH/2}) rotate(-45)"><polygon points="-10,-4 -8,-4 4,-4 10,0 4,4 -8,4 -10,4" fill="#eee"/></g></g><rect x="0" y="0" width="${PW}" height="${PH}" fill="transparent" class="char-head-click" data-slot="${el.slot}" data-char-id="${el.charId}"/></g>`;
        svg += vertText(ex + RP + 19, ry + RP + 2, el.name, theme.titleColor);
        if (showTotalPots)
          svg += `<text x="${ex + RP - 1}" y="${ry + RH - 8}" font-size="16" font-family="'DejaVu Sans Mono', monospace" font-weight="bold" fill="${theme.titleColor}">${el.potSum || 0}</text>`;
      } else {
        svg += `<rect x="${ex}" y="${ry}" width="${el.w}" height="${RH}" rx="4" fill="${el.color}"/>`;
        svg += vertText(ex + RP + 19, ry + RP + 2, el.key, theme.titleColor);
        let ix = ex + RP + NW + IG;
        for (const p of el.items) {
          svg += `<g data-id="${p.id}" data-slot="${el.slot}" data-group="${el.key}" transform="translate(${ix},${ry+RP})"><rect width="${PW}" height="${PH}" fill="transparent"/><image x="0" y="0" width="${PW}" height="${PH}" href="${esc(BASE_ASSETS)}potential/${p.id}.webp" preserveAspectRatio="xMidYMid slice" clip-path="url(#c)" style="pointer-events:none;user-select:none"/></g>`;
          if (!['01','02','03','04','21','22','23','24'].includes(String(p.id).slice(-2)))
            svg += `<text x="${ix + 22}" y="${ry + RP + 12}" text-anchor="middle" dominant-baseline="middle" font-size="${currentLvlFont}" font-family="'DejaVu Sans Mono', monospace" font-weight="bold" fill="#568">${p.level}</text>`;
          potPositions.push({ id: String(p.id), slot: el.slot, group: el.key, x: ix, y: ry + RP });
          ix += PW + IG;
        }
      }
    }
  }

  for (const dy of dividerYs) {
    svg += `<line x1="${sp}" y1="${dy}" x2="${sp + maxRowW}" y2="${dy}" stroke="${theme.dividerColor}" stroke-width="${dividerH}" stroke-linecap="round"/>`;
  }

  svg += `</svg>`;

  if (returnSVG) {
    if (typeof buildNotesSvgString === 'function') {
      const notes = buildNotesSvgString(svgW, svgH, potPositions);
      if (notes) svg = svg.replace(/<\/svg>\s*$/, notes + '</svg>');
    }
    return svg;
  }

  document.getElementById('recordImageContent').innerHTML = svg;
  populateThemeSelect();

  attachPotentialTooltips(document.querySelector('#recordImageContent svg'));

  enableSvgReorder();

  const finalSvg = document.querySelector('#recordImageContent svg');
  if (finalSvg) {
    renderCanvasNotes(finalSvg);
    attachCanvasNoteEvents(finalSvg);
  }

  attachHeadVariantClicks();

  document.getElementById('recordImageOverlay').style.display = 'block';
  document.body.classList.add('modal-open');
}

async function svgToPngBlob(svgSource) {
  let svgEl;
  if (typeof svgSource === 'string') {
    svgEl = new DOMParser().parseFromString(svgSource, 'image/svg+xml').documentElement;
  } else {
    svgEl = svgSource;
  }

  const clone = svgEl.cloneNode(true);

  const imgs = clone.querySelectorAll('image');
  let hadFailure = false;
  await Promise.all(Array.from(imgs).map(async el => {
    const href = el.getAttribute('href');
    if (!href || href.startsWith('data:')) return;
    try {
      const resp = await fetch(href);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const dataUrl = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); });
      el.setAttribute('href', dataUrl);
    } catch (e) { console.warn('PNG embed failed:', href, e); hadFailure = true; el.remove(); }
  }));

  const styles = clone.querySelectorAll('style');
  for (const el of styles) {
    const text = el.textContent;
    const urlMatch = text.match(/url\(['"]?([^'"()]+)['"]?\)/);
    if (urlMatch && !urlMatch[1].startsWith('data:')) {
      try {
        const resp = await fetch(urlMatch[1]);
        if (resp.ok) {
          const blob = await resp.blob();
          const dataUrl = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); });
          el.textContent = text.replace(urlMatch[1], dataUrl);
        }
      } catch (e) { console.warn('Font embed failed:', urlMatch[1], e); }
    }
  }

  if (hadFailure) showToast('Some images failed to load');

  const inlinedSvgString = new XMLSerializer().serializeToString(clone);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  const blob = new Blob([inlinedSvgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const scale = 2;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(pngBlob => resolve({ pngBlob, svgString: inlinedSvgString }));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('PNG conversion failed')); };
    img.src = url;
  });
}

async function downloadRecordPNG() {
  const svgEl = document.querySelector('#recordImageContent svg');
  if (!svgEl) return;
  try {
    const { pngBlob } = await svgToPngBlob(svgEl);
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

async function copyRecordPNG() {
  let blob = _lastRecordPngBlob;
  if (!blob) {
    const svgEl = document.querySelector('#recordImageContent svg');
    if (!svgEl) return;
    try {
      const result = await svgToPngBlob(svgEl);
      blob = result.pngBlob;
    } catch (e) { showToast('Copy failed'); return; }
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    showToast('Copied');
  } catch (e) { showToast('Copy failed'); }
}

function buildRecordUrl() {
  const b64 = packPotentials();
  const allChars = selectedChars.filter(c => c);
  const chars = allChars.slice(0, 3);
  const extras = allChars.slice(3);
  const cfgMap = buildCfgMap(chars);
  const keys = ['core', 'high', 'medium', 'low', 'optional'];
  const slotStrs = [];
  const buildPrioSlot = (cId) => {
    const cfg = buildCfgMap([cId])[+cId];
    if (!cfg) return '';
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
    return keys.map(k => (byPrio[k] || []).join('.')).join('-');
  };
  chars.forEach(cId => slotStrs.push(buildPrioSlot(cId)));
  extras.forEach(cId => slotStrs.push(buildPrioSlot(cId)));
  const base = window.location.protocol + '//' + window.location.host + window.location.pathname;
  let url = base + '?png=' + encodeURIComponent(b64);
  const prioStr = slotStrs.join('_');
  if (prioStr.replace(/-/g, '')) url += '&p=' + encodeURIComponent(prioStr);
  if (currentTitle) url += '&t=' + encodeURIComponent(currentTitle);
  url += '&h=' + encodeURIComponent(currentThemeName);

  if (extras.length) {
    url += '&b=' + encodeURIComponent(packPotLevels(extras));
  }

  const groupKeys = ['core', 'high', 'medium', 'low', 'optional'];
  const orderParts = [];
  chars.forEach((cId, slot) => {
    if (!potOrder[slot]) { orderParts.push(''); return; }
    const encoded = groupKeys.map(key => {
      const ids = potOrder[slot][key];
      if (!ids || !ids.length) return '';
      const validIds = ids.filter(id => {
        const level = potLevels[+id] || 0;
        return level > 0 && getPotPriority(id, level) === key;
      });
      if (!validIds.length) return '';
      return validIds.map(id => String(id).slice(-2)).join('');
    }).join('-');
    orderParts.push(encoded);
  });
  const orderStr = orderParts.join('_');
  if (orderStr.replace(/_/g, '')) url += '&o=' + encodeURIComponent(orderStr);

  const notesStr = typeof encodeCanvasNotesToParam === 'function' ? encodeCanvasNotesToParam() : '';
  if (notesStr) url += '&n=' + encodeURIComponent(notesStr);

  const variantParts = [];
  allChars.forEach(cId => {
    const v = charHeadVariants[String(cId)] || '02';
    variantParts.push(v);
  });
  const anyCustom = variantParts.some(v => v !== '02');
  if (anyCustom) {
    const first3 = variantParts.slice(0, 3).join('-');
    if (extras.length) {
      const extraVariants = variantParts.slice(3).join('-');
      url += '&v=' + encodeURIComponent(first3 + '_' + extraVariants);
    } else {
      url += '&v=' + encodeURIComponent(first3);
    }
  }

  return url;
}

function openRecordPNG() {
  if (Object.keys(customHeadImages).length > 0) {
    showConfirmModal(
      'Custom character images won\u2019t render in the PNG view. Use \u2018Copy PNG\u2019 inside the preview instead.',
      () => { window.location.href = buildRecordUrl(); }
    );
    return;
  }
  window.location.href = buildRecordUrl();
}

function copyRecordLink() {
  const url = buildRecordUrl();
  navigator.clipboard.writeText(url).then(() => {
    showToast('Copied');
  }).catch(() => {});
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

function getOrBuildGroupOrder(slot, group) {
  if (!potOrder[slot]) potOrder[slot] = {};
  const arr = potOrder[slot][group];
  if (arr) {
    for (const id of getCurrentGroupOrder(slot, group)) {
      if (!arr.includes(id)) arr.push(id);
    }
    return arr;
  }
  const fresh = getCurrentGroupOrder(slot, group);
  potOrder[slot][group] = [...fresh];
  return potOrder[slot][group];
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
  e.preventDefault();
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
      if (!potOrder[slot][sourceGroup].length) delete potOrder[slot][sourceGroup];
    }

    const tgtArr = getOrBuildGroupOrder(slot, targetGroup);
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
    _svgDrag.el = document.querySelector(`#recordImageContent g[data-slot="${_svgDrag.slot}"][data-id="${_svgDrag.id}"]`);
    if (_svgDrag.el) { _svgDrag.el.classList.add('svg-drag-src'); _svgDrag.el.style.cursor = 'grabbing'; }
    return;
  }

  const stateKey = targetId + (insertBefore ? '<' : '>');
  if (stateKey === _lastStateKey) return;
  _lastStateKey = stateKey;

  const group = sourceGroup;

  const arr = getOrBuildGroupOrder(slot, group);
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

  _svgDrag.el = document.querySelector(`#recordImageContent g[data-slot="${_svgDrag.slot}"][data-id="${_svgDrag.id}"]`);
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
    const corrupted = {};
    parts.forEach((part, i) => {
      if (i >= groupKeys.length) return;
      const key = groupKeys[i];
      if (!part) { corrupted[key] = false; return; }
      const seen = new Set();
      const fullIds = [];
      let rawCount = 0;
      for (let j = 0; j < part.length; j += 2) {
        const short = part.slice(j, j + 2);
        if (short.length === 2 && shortToFull[short]) {
          rawCount++;
          if (!seen.has(short)) {
            seen.add(short);
            fullIds.push(String(shortToFull[short]));
          }
        }
      }
      corrupted[key] = rawCount > seen.size;
      if (fullIds.length) orders[key] = fullIds;
    });

    groupKeys.forEach(key => {
      if (!orders[key]) return;
      const natural = getCurrentGroupOrder(slot, key);
      const naturalSet = new Set(natural);
      const hasForeign = orders[key].some(id => !naturalSet.has(id));
      let cleaned;
      if (corrupted[key] || hasForeign) {
        cleaned = natural;
      } else {
        cleaned = orders[key].filter(id => naturalSet.has(id));
        natural.forEach(id => { if (!cleaned.includes(id)) cleaned.push(id); });
      }
      if (cleaned.length) orders[key] = cleaned;
      else delete orders[key];
    });

    if (Object.keys(orders).length) potOrder[slot] = orders;
  });
}

function attachPotentialTooltips(container) {
  if (window.matchMedia('(max-width: 600px)').matches) return;
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
      let bigImg = tooltip.querySelector('img');
      if (!bigImg) {
        bigImg = document.createElement('img');
        tooltip.insertBefore(bigImg, tooltip.firstChild);
      }
      bigImg.src = BASE_ASSETS + `potential/${pid}.webp`;
      let descDiv = tooltip.querySelector('.desc');
      if (!descDiv) {
        descDiv = document.createElement('div');
        descDiv.className = 'desc';
        tooltip.appendChild(descDiv);
      }
      let rawDesc = def ? formatPotentialDesc(pid, def.params) : 'No description available.';
      if (!rawDesc || rawDesc === 'No description available.') rawDesc = 'No detailed description found.';
      rawDesc = formatDescriptionWithColor(rawDesc);
      descDiv.innerHTML = rawDesc;
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

  let tt = document.querySelector('.pot-tooltip');
  if (!tt) {
    tt = document.createElement('div');
    tt.className = 'pot-tooltip';
    tt.style.display = 'none';
    document.body.appendChild(tt);
  }

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
        let bigImg = tooltip.querySelector('img');
        if (!bigImg) {
          bigImg = document.createElement('img');
          tooltip.insertBefore(bigImg, tooltip.firstChild);
        }
        const imgEl = svgEl.querySelector(`g[data-id="${hit.id}"] image`);
        bigImg.src = imgEl ? imgEl.getAttribute('href') : BASE_ASSETS + `potential/${hit.id}.webp`;
        let descDiv = tooltip.querySelector('.desc');
        if (!descDiv) {
          descDiv = document.createElement('div');
          descDiv.className = 'desc';
          tooltip.appendChild(descDiv);
        }
        let rawDesc = def ? formatPotentialDesc(hit.id, def.params) : 'No description available.';
        if (!rawDesc || rawDesc === 'No description available.') rawDesc = 'No detailed description found.';
        rawDesc = formatDescriptionWithColor(rawDesc);
        descDiv.innerHTML = rawDesc;
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

function applyBonusUnitsData(b64) {
  if (!b64) return;
  try {
    const { charIds, potentials } = unpackPotLevels(b64);
    const validIds = charIds.filter(id => id !== 0).map(String).filter(id => charData[id]);
    validIds.forEach(id => {
      if (!selectedChars.includes(id)) selectedChars.push(id);
    });
    Object.entries(potentials).forEach(([pid, lvl]) => { potLevels[+pid] = lvl; });
  } catch(e) {
    console.warn('Failed to apply bonus units:', e.message);
  }
}

const HEAD_VARIANTS_CACHE = {};

function imageExists(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function getAvailableHeadVariants(charId) {
  if (HEAD_VARIANTS_CACHE[charId]) return HEAD_VARIANTS_CACHE[charId];
  const available = [];
  for (let i = 1; i <= 20; i++) {
    const v = String(i).padStart(2, '0');
    const exists = await imageExists(`${BASE_ASSETS}export/assets/assetbundles/icon/head/head_${charId}${v}_XL.webp`);
    if (exists) {
      available.push(v);
    } else {
      break;
    }
  }
  HEAD_VARIANTS_CACHE[charId] = available.length > 0 ? available : ['01'];
  return HEAD_VARIANTS_CACHE[charId];
}

function showHeadVariantMenu(charId, slot, clickX, clickY) {
  let menu = document.querySelector('.head-variant-menu');
  if (menu) menu.remove();

  menu = document.createElement('div');
  menu.className = 'head-variant-menu';
  menu.style.cssText = `position:fixed;z-index:100001;background:#1e1e1e;border:1px solid #555;border-radius:6px;padding:8px;box-shadow:0 6px 20px rgba(0,0,0,0.7);display:flex;gap:6px;`;

  const loading = document.createElement('div');
  loading.textContent = 'Loading...';
  loading.style.cssText = 'color:#888;font-size:12px;padding:8px 12px;';
  menu.appendChild(loading);
  menu.style.left = Math.min(clickX, window.innerWidth - 200) + 'px';
  menu.style.top = Math.min(clickY, window.innerHeight - 100) + 'px';
  document.body.appendChild(menu);

  getAvailableHeadVariants(charId).then(variants => {
    menu.innerHTML = '';

    const uploadOpt = document.createElement('div');
    uploadOpt.style.cssText = 'cursor:pointer;border-radius:4px;overflow:hidden;border:2px dashed #555;display:flex;flex-direction:column;align-items:center;gap:2px;padding:2px;';

    const uploadWrap = document.createElement('div');
    uploadWrap.style.cssText = 'width:72px;height:92px;display:flex;align-items:center;justify-content:center;border-radius:2px;background:#2a2a2a;';

    const plusIcon = document.createElement('span');
    plusIcon.textContent = '+';
    plusIcon.style.cssText = 'font-size:28px;color:#666;line-height:1;';

    const uploadLbl = document.createElement('div');
    uploadLbl.textContent = 'Custom';
    uploadLbl.style.cssText = 'font-size:10px;color:#888;text-align:center;';

    uploadWrap.appendChild(plusIcon);
    uploadOpt.appendChild(uploadWrap);
    uploadOpt.appendChild(uploadLbl);

    uploadOpt.onclick = () => {
      menu.remove();
      showCropModal(charId, slot);
    };

    menu.appendChild(uploadOpt);

    variants.forEach(v => {
      const opt = document.createElement('div');
      opt.style.cssText = 'cursor:pointer;border-radius:4px;overflow:hidden;border:2px solid transparent;display:flex;flex-direction:column;align-items:center;gap:2px;padding:2px;';

      const wrap = document.createElement('div');
      wrap.style.cssText = 'width:72px;height:92px;overflow:hidden;border-radius:2px;background:#2a2a2a;';

      const img = document.createElement('img');
      img.src = `${BASE_ASSETS}export/assets/assetbundles/icon/head/head_${charId}${v}_XL.webp`;
      img.style.cssText = 'width:100%;height:100%;display:block;object-fit:cover;';
      img.loading = 'lazy';

      const lbl = document.createElement('div');
      lbl.textContent = v;
      lbl.style.cssText = 'font-size:10px;color:#888;text-align:center;';

      wrap.appendChild(img);
      opt.appendChild(wrap);
      opt.appendChild(lbl);

      const current = charHeadVariants[String(charId)] || '02';

      opt.onclick = () => {
        setHeadVariant(charId, slot, v);
        menu.remove();
      };

      menu.appendChild(opt);
    });
  });
}

function setHeadVariant(charId, slot, variant) {
  charHeadVariants[String(charId)] = variant;
  saveState();
  renderRecordImage(packPotentials());
}

function attachHeadVariantClicks() {
  const svg = document.querySelector('#recordImageContent svg');
  if (!svg) return;
  svg.querySelectorAll('.char-head-click').forEach(el => {
    el.addEventListener('click', e => {
      const charId = el.getAttribute('data-char-id');
      const slot = el.getAttribute('data-slot');
      const rect = svg.getBoundingClientRect();
      showHeadVariantMenu(charId, slot, e.clientX, e.clientY);
    });
  });
}

function parseHeadVariantsParam(str) {
  if (!str) return;
  const allChars = selectedChars.filter(c => c);
  const parts = str.split('_');
  const first3 = parts[0] ? parts[0].split('-') : [];
  const extras = parts[1] ? parts[1].split('-') : [];
  const all = [...first3, ...extras];
  all.forEach((v, i) => {
    if (i < allChars.length && v.match(/^\d{2}$/)) {
      charHeadVariants[String(allChars[i])] = v;
    }
  });
}

function checkRecordImageParam() {
  const params = new URLSearchParams(window.location.search.replace(/\+/g, '%2B'));
  const orderParam = params.get('o') ?? params.get('order');
  const preview = params.get('r') ?? params.get('record-preview');
  const png = params.get('png') ?? params.get('record-png');
  const image = params.get('record-image') || png;
  const bonusData = params.get('b') ?? params.get('bonus-data');
  const titleParam = params.get('t') ?? params.get('title');
  const themeParam = params.get('h') ?? params.get('theme');
  const notesParam = params.get('n') ?? params.get('notes');
  const variantParam = params.get('v') ?? params.get('variants');
  if (preview || image) {
    currentTitle = '';
    currentThemeName = 'dark';
    if (typeof clearCanvasNotes === 'function') clearCanvasNotes();
    if (titleParam) {
      currentTitle = titleParam;
      localStorage.setItem('nrb-title', currentTitle);
    }
    if (themeParam) {
      const resolved = resolveThemeName(themeParam);
      if (resolved) currentThemeName = resolved;
    }
    if (notesParam && typeof decodeCanvasNotesFromParam === 'function') {
      decodeCanvasNotesFromParam(notesParam);
    }
  }
  if (preview) {
    document.getElementById('importInput').value = preview;
    importPotentials();
    applyBonusUnitsData(bonusData);
    applyPendingPrios();
    if (orderParam) resolveOrderFromParam(orderParam);
    if (variantParam) parseHeadVariantsParam(variantParam);
    renderRecordImage(preview);
    generate();
    refreshCharBadges();
    updatePotentials();
  }
  if (image) {
    document.getElementById('importInput').value = image;
    importPotentials();
    applyBonusUnitsData(bonusData);
    applyPendingPrios();
    if (orderParam) resolveOrderFromParam(orderParam);
    if (variantParam) parseHeadVariantsParam(variantParam);
    renderRecordImage(image);
    setTimeout(() => downloadRecordPNG(), 500);
  }

  const titleInput = document.getElementById('recordTitle');
  if (titleInput) titleInput.value = currentTitle;

  const lvlFontInput = document.getElementById('recordLvlFont');
  if (lvlFontInput) lvlFontInput.value = currentLvlFont;

  if (bonusData || preview || image) {
    history.replaceState(null, '', window.location.pathname);
  }
}

function showCropModal(charId, slot) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => buildCropUI(charId, slot, reader.result);
    reader.readAsDataURL(file);
  };
  document.body.appendChild(input);
  input.click();
  input.remove();
}

function buildCropUI(charId, slot, dataUrl) {
  let scale = 1, tx = 0, ty = 0;
  const cropW = 240, cropH = 306;
  const vpW = 360, vpH = 459;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200000;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;';

  const panel = document.createElement('div');
  panel.style.cssText = 'background:#1e1e1e;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;';

  const title = document.createElement('div');
  title.textContent = 'Crop Head Image';
  title.style.cssText = 'font-size:14px;font-weight:bold;color:#ccc;padding:14px 16px 0;';

  const viewport = document.createElement('div');
  viewport.style.cssText = `position:relative;width:${vpW}px;height:${vpH}px;overflow:hidden;background:#222;margin:12px 16px;border-radius:4px;cursor:grab;`;

  const img = new Image();
  img.style.cssText = 'position:absolute;left:0;top:0;transform-origin:0 0;user-select:none;pointer-events:none;-webkit-user-drag:none;';
  img.draggable = false;

  const mask = document.createElement('div');
  mask.style.cssText = `position:absolute;width:${cropW}px;height:${cropH}px;left:50%;top:50%;transform:translate(-50%,-50%);box-shadow:0 0 0 9999px rgba(0,0,0,0.6);pointer-events:none;z-index:2;`;

  const frame = document.createElement('div');
  frame.style.cssText = `position:absolute;width:${cropW}px;height:${cropH}px;left:50%;top:50%;transform:translate(-50%,-50%);border:2px solid #fff;pointer-events:none;z-index:3;box-sizing:border-box;border-radius:2px;`;

  viewport.appendChild(img);
  viewport.appendChild(mask);
  viewport.appendChild(frame);

  const controls = document.createElement('div');
  controls.style.cssText = 'display:flex;align-items:center;gap:10px;padding:0 16px 8px;';

  const zoomLabel = document.createElement('span');
  zoomLabel.textContent = 'Zoom';
  zoomLabel.style.cssText = 'color:#aaa;font-size:12px;';

  const zoomSlider = document.createElement('input');
  zoomSlider.type = 'range';
  zoomSlider.min = '10';
  zoomSlider.max = '500';
  zoomSlider.step = '1';
  zoomSlider.style.cssText = 'flex:1;accent-color:#4a8;';

  const zoomVal = document.createElement('span');
  zoomVal.style.cssText = 'color:#aaa;font-size:12px;width:50px;text-align:right;font-variant-numeric:tabular-nums;';

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;padding:0 16px 12px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = 'padding:6px 16px;border:1px solid #555;border-radius:4px;background:#333;color:#ccc;cursor:pointer;font-size:12px;';
  cancelBtn.onclick = () => { cleanup(); overlay.remove(); };

  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply';
  applyBtn.style.cssText = 'padding:6px 16px;border:none;border-radius:4px;background:#4a8;color:#fff;cursor:pointer;font-size:12px;font-weight:bold;';

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(applyBtn);
  controls.appendChild(zoomLabel);
  controls.appendChild(zoomSlider);
  controls.appendChild(zoomVal);
  panel.appendChild(title);
  panel.appendChild(viewport);
  panel.appendChild(controls);
  panel.appendChild(btnRow);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  let isDragging = false;
  let dragStartX, dragStartY, startTx, startTy;

  function update() {
    const dw = Math.round(img.naturalWidth * scale);
    const dh = Math.round(img.naturalHeight * scale);
    img.style.width = dw + 'px';
    img.style.height = dh + 'px';
    img.style.transform = `translate(${tx}px, ${ty}px)`;
    zoomSlider.value = String(Math.round(scale * 100));
    zoomVal.textContent = Math.round(scale * 100) + '%';
  }

  function centerImage() {
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    tx = (vpW - dw) / 2;
    ty = (vpH - dh) / 2;
    update();
  }

  img.onload = () => {
    const sx = vpW / img.naturalWidth;
    const sy = vpH / img.naturalHeight;
    scale = Math.min(sx, sy);
    centerImage();
  };
  img.src = dataUrl;

  zoomSlider.oninput = () => {
    const newScale = parseFloat(zoomSlider.value) / 100;
    const ratio = newScale / scale;
    const cx = vpW / 2, cy = vpH / 2;
    tx = cx - (cx - tx) * ratio;
    ty = cy - (cy - ty) * ratio;
    scale = newScale;
    update();
  };

  viewport.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startTx = tx;
    startTy = ty;
    viewport.style.cursor = 'grabbing';
    e.preventDefault();
  });

  function onMove(e) {
    if (!isDragging) return;
    tx = startTx + (e.clientX - dragStartX);
    ty = startTy + (e.clientY - dragStartY);
    update();
  }

  function onUp() {
    if (!isDragging) return;
    isDragging = false;
    viewport.style.cursor = 'grab';
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(5, Math.max(0.1, scale * delta));
    const ratio = newScale / scale;
    const cx = vpW / 2, cy = vpH / 2;
    tx = cx - (cx - tx) * ratio;
    ty = cy - (cy - ty) * ratio;
    scale = newScale;
    update();
  }, { passive: false });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) { cleanup(); overlay.remove(); }
  });

  applyBtn.onclick = () => {
    finalizeCrop(charId, slot, dataUrl, scale, tx, ty, img.naturalWidth, img.naturalHeight, vpW, vpH, cropW, cropH);
    cleanup();
    overlay.remove();
  };

  function cleanup() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
}

function finalizeCrop(charId, slot, dataUrl, scale, tx, ty, naturalW, naturalH, vpW, vpH, cropW, cropH) {
  const cfx = (vpW - cropW) / 2;
  const cfy = (vpH - cropH) / 2;
  const sx = (cfx - tx) / scale;
  const sy = (cfy - ty) / scale;
  const sw = cropW / scale;
  const sh = cropH / scale;

  const img = new Image();
  img.onload = () => {
    const scale2 = 2;
    const canvas = document.createElement('canvas');
    canvas.width = 120 * scale2;
    canvas.height = 153 * scale2;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 120 * scale2, 153 * scale2);
    customHeadImages[String(charId)] = canvas.toDataURL('image/png');
    const menu = document.querySelector('.head-variant-menu');
    if (menu) menu.remove();
    renderRecordImage(packPotentials());
    if (typeof renderChars === 'function') renderChars();
  };
  img.src = dataUrl;
}
