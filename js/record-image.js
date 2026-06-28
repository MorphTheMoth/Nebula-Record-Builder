let currentThemeName = localStorage.getItem('nrb-theme') || 'dark';

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
      elements.push({ t: 'group', x, w: gw, key, items, color: sectionColors[key] });
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
  const svgW = maxRowW + sp * 2;
  let svgH = rows.length * RH + (rows.length - 1) * RG + sp * 2;
  let dividerY = 0;
  if (rows.length > 1) {
    svgH += extraGap + dividerH;
    dividerY = sp + RH + (RG + extraGap + dividerH) / 2;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="max-width:100%;height:auto;display:block;">
<defs><clipPath id="c"><rect width="${PW}" height="${PH}" rx="4"/></clipPath></defs>
<rect width="${svgW}" height="${svgH}" fill="${theme.svgBg}"/>`;

  for (const row of rows) {
    const ry = row.y + sp;
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
          svg += `<g data-id="${p.id}" transform="translate(${ix},${ry+RP})" clip-path="url(#c)"><image x="0" y="0" width="${PW}" height="${PH}" href="${esc(BASE_ASSETS)}potential/${p.id}.webp" preserveAspectRatio="xMidYMid slice"/></g>`;
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

  let tt = document.querySelector('.pot-tooltip');
  if (!tt) {
    tt = document.createElement('div');
    tt.className = 'pot-tooltip';
    tt.style.display = 'none';
    document.body.appendChild(tt);
  }
  const svgEl = document.querySelector('#recordImageContent svg');
  if (svgEl) {
    svgEl.querySelectorAll('[data-id]').forEach(el => {
      let moveHandler = null;
      const pid = el.getAttribute('data-id');
      el.addEventListener('mouseenter', e => {
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
  let url = base + '?record-png=' + b64;
  const prioStr = slotStrs.join('_');
  if (prioStr.replace(/-/g, '')) url += '&priorities=' + prioStr;
  url += '&theme=' + currentThemeName;
  return url;
}

function openRecordPNG() {
  window.location.href = buildRecordUrl();
}

function copyRecordLink() {
  const url = buildRecordUrl();
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('#recordImageOverlay .record-preview-header button:nth-child(3)');
    if (btn) { const t = btn.textContent; btn.textContent = '✓ Copied! '; setTimeout(() => btn.textContent = t, 1500); }
  }).catch(() => alert('Failed to copy link.'));
}

function checkRecordImageParam() {
  const params = new URLSearchParams(window.location.search);
  const themeParam = params.get('theme');
  if (themeParam && themes[themeParam]) {
    currentThemeName = themeParam;
  }
  const preview = params.get('record-preview');
  const image = params.get('record-image');
  if (preview) {
    document.getElementById('importInput').value = preview;
    importPotentials();
    renderRecordImage(preview);
  }
  if (image) {
    document.getElementById('importInput').value = image;
    importPotentials();
    renderRecordImage(image);
    setTimeout(() => downloadRecordPNG(), 500);
  }
}
