const SAVED_BUILDS_KEY = 'nrb-saved-builds';
const CURRENT_BUILD_KEY = 'nrb-current-build-id';
let currentBuildId = null;

function buildCurrentState() {
  return {
    selectedChars: [...selectedChars],
    selectedDiscs: [...selectedDiscs],
    discCopies: {...discCopies},
    noteCounts: {...noteCounts},
    emblemStats: {...emblemStats},
    emblemStatGroups: {...emblemStatGroups},
    potLevels: {...potLevels},
    priorityMap: {...priorityMap},
    potOrder: JSON.parse(JSON.stringify(potOrder))
  };
}

function showToast(msg) {
  const el = document.createElement('div');
  el.textContent = msg;
  Object.assign(el.style, {
    position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)',
    background:'#2a4a2a', border:'1px solid #3a6a3a', color:'#aca',
    padding:'8px 20px', borderRadius:'4px', fontSize:'13px',
    fontFamily:'inherit', zIndex:'10001', opacity:'0',
    transition:'opacity 0.2s', pointerEvents:'none'
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.style.opacity = '1');
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  }, 1500);
}

function showSaveBuildModal(defaultName, onSave) {
  let backdrop = document.querySelector('.save-build-backdrop');
  if (backdrop) return;
  backdrop = document.createElement('div');
  backdrop.className = 'load-build-backdrop save-build-backdrop';
  backdrop.onclick = e => { if (e.target === backdrop) backdrop.remove(); };
  backdrop.innerHTML = `<div class="save-build-modal" onclick="event.stopPropagation()">
    <h2>Save Build</h2>
    <div style="padding:16px 20px;">
      <input type="text" id="saveBuildName" value="${escHtml(defaultName)}" placeholder="Build name..." style="width:100%;background:#111;border:1px solid #333;color:#ccc;padding:8px 10px;border-radius:3px;font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;">
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
        <button class="save-build-cancel" style="background:#222;border:1px solid #444;color:#aaa;padding:6px 16px;border-radius:3px;cursor:pointer;font-size:12px;font-family:inherit;">Cancel</button>
        <button class="save-build-confirm" style="background:#2a4a2a;border:1px solid #3a6a3a;color:#aca;padding:6px 16px;border-radius:3px;cursor:pointer;font-size:12px;font-family:inherit;">Save</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(backdrop);

  const input = backdrop.querySelector('#saveBuildName');
  input.focus();
  input.select();

  backdrop.querySelector('.save-build-cancel').onclick = () => backdrop.remove();
  backdrop.querySelector('.save-build-confirm').onclick = () => {
    const name = input.value.trim() || defaultName;
    backdrop.remove();
    onSave(name);
  };
}

function saveBuildCurrent() {
  const chars = selectedChars.filter(c => c);
  if (!chars.length) { alert('Select at least one character first.'); return; }

  const loadedId = currentBuildId || Number(localStorage.getItem(CURRENT_BUILD_KEY));
  const builds = JSON.parse(localStorage.getItem(SAVED_BUILDS_KEY) || '[]');
  const existing = builds.find(b => b.id === loadedId);

  if (!existing) {
    saveBuildAs();
    return;
  }

  existing.timestamp = Date.now();
  existing.chars = [...selectedChars];
  existing.url = buildRecordUrl().replace('record-png=', 'record-preview=');
  existing.state = buildCurrentState();
  localStorage.setItem(SAVED_BUILDS_KEY, JSON.stringify(builds));
  showToast('Saved');
}

function saveBuildAs() {
  const chars = selectedChars.filter(c => c);
  if (!chars.length) { alert('Select at least one character first.'); return; }

  const defaultName = currentTitle || '';
  showSaveBuildModal(defaultName, (name) => {
    const builds = JSON.parse(localStorage.getItem(SAVED_BUILDS_KEY) || '[]');
    const build = {
      id: Date.now(),
      title: name,
      timestamp: Date.now(),
      chars: [...selectedChars],
      url: buildRecordUrl().replace('record-png=', 'record-preview='),
      state: buildCurrentState()
    };
    builds.push(build);
    localStorage.setItem(SAVED_BUILDS_KEY, JSON.stringify(builds));
    currentBuildId = build.id;
    localStorage.setItem(CURRENT_BUILD_KEY, currentBuildId);
  });
}

function showLoadBuildPopup() {
  let backdrop = document.querySelector('.load-build-backdrop');
  if (backdrop) return;
  const builds = JSON.parse(localStorage.getItem(SAVED_BUILDS_KEY) || '[]');
  backdrop = document.createElement('div');
  backdrop.className = 'load-build-backdrop';
  backdrop.onclick = e => { if (e.target === backdrop) backdrop.remove(); };
  const modal = document.createElement('div');
  modal.className = 'load-build-modal';
  let html = '<h2>Saved Builds</h2>';
  if (!builds.length) {
    html += '<div class="load-build-empty">No saved builds yet.</div>';
  } else {
    const sorted = [...builds].sort((a, b) => {
      const aName = (charJson[a.chars[0]]?.name || '').toLowerCase();
      const bName = (charJson[b.chars[0]]?.name || '').toLowerCase();
      if (aName < bName) return -1;
      if (aName > bName) return 1;
      return b.timestamp - a.timestamp;
    });
    for (const build of sorted) {
      const icons = build.chars.filter(c => c).map(id =>
        `<img src="${BASE_ASSETS}export/assets/assetbundles/icon/head/head_${id}02_XXL.webp" alt="" loading="lazy">`
      ).join('');
      const time = new Date(build.timestamp).toLocaleString();
      html += `<div class="load-build-entry" data-id="${build.id}">
        <div class="load-build-entry-icons">${icons || '<span style="color:#555;font-size:11px;">—</span>'}</div>
        <div class="load-build-entry-info">
          <div class="load-build-entry-title">${escHtml(build.title)}</div>
          <div class="load-build-entry-time">${escHtml(time)}</div>
        </div>
        <button class="load-build-entry-del" data-del="${build.id}" title="Delete">&times;</button>
      </div>`;
    }
  }
  modal.innerHTML = html;
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  modal.querySelectorAll('.load-build-entry').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.load-build-entry-del')) return;
      const id = Number(el.dataset.id);
      const build = builds.find(b => b.id === id);
      if (!build) return;
      backdrop.remove();
      sessionStorage.setItem('nrb-load-extras', JSON.stringify({...build.state, buildId: build.id}));
      window.location.href = build.url;
    });
  });
  modal.querySelectorAll('.load-build-entry-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = Number(btn.dataset.del);
      const filtered = builds.filter(b => b.id !== id);
      localStorage.setItem(SAVED_BUILDS_KEY, JSON.stringify(filtered));
      backdrop.remove();
      showLoadBuildPopup();
    });
  });
}

function applyPendingPrios() {
  if (!pendingPrios.length) return;
  const chars = selectedChars.filter(c => c);
  const cfgMap = buildCfgMap(chars);
  chars.forEach((charId, slot) => {
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

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function preloadAllDiscImages() {
  if (discImagesPreloaded) return;
  if (typeof VANILLA_MODE !== 'undefined' && VANILLA_MODE) return;
  const ids = Object.keys(discData);
  for (const id of ids) {
    const imgId = String(id).slice(2);
    const img = new Image();
    img.src = BASE_ASSETS + `export/assets/assetbundles/icon/outfit/outfit_${imgId}.webp`;
  }
  discImagesPreloaded = true;
}

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
  potOrder = {};
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

function clearNotes(resetNotesCount) {
  noteCounts = {};
  saveState();
  updateNotes(resetNotesCount);
  generate();
}

function clearAll() {
  selectedChars = [];
  selectedDiscs = ["212005", "211006", "211005", null, null, null];
  discCopies = {};
  potLevels = {};
  potOrder = {};
  priorityMap = {};
  priorityMode = false;
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

document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('importInput');
  if (inp) {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') importPotentials(); });
    inp.addEventListener('paste', () => { setTimeout(importPotentials, 0); });
  }
  document.getElementById('copyOutputBtn')?.addEventListener('click', copyOutputText);
  document.getElementById('copyAllOutputBtn')?.addEventListener('click', copyAllOutputs);

  document.getElementById('output')?.addEventListener('click', () => {
    const out = document.getElementById('output');
    const txt = out?.textContent;
    if (!txt || txt === '—') return;
    navigator.clipboard.writeText(txt.replace(/\r?\n/g, '\r\n')).then(() => {
      showToast('Copied');
    }).catch(() => {});
  });

  document.getElementById('importInput')?.addEventListener('click', () => {
    const input = document.getElementById('importInput');
    if (!input.value.trim()) return;
    navigator.clipboard.writeText(input.value).then(() => {
      showToast('Copied');
    }).catch(() => {});
  });

  const playerIdInput = document.getElementById('playerIdInput');
  if (playerIdInput) {
    playerIdInput.addEventListener('input', () => {
      playerId = playerIdInput.value;
      saveState();
      generate();
    });
  }
});

async function init() {
  try {
    [charData, discData, charJson, potentialDesc] = await Promise.all([
      fetchJSON(BASE_RAW + 'characterid.json'),
      fetchJSON(BASE_RAW + 'disc.json'),
      fetchJSON(BASE_RAW + 'character.json'),
      fetchJSON(BASE_RAW + 'EN/language/en_US/Potential.json')
        .catch(e => { console.warn('Could not load potential descriptions', e); return {}; }),
    ]);

    const urlParams = new URLSearchParams(window.location.search.replace(/\+/g, '%2B'));
    const png = urlParams.get('record-png');
    const prioStr = urlParams.get('priorities');
    if (prioStr) {
      const slotStrs = prioStr.split('_');
      const keys = ['core', 'high', 'medium', 'low', 'optional'];
      slotStrs.forEach((slotStr, slot) => {
        const groups = slotStr.split('-');
        const map = {};
        groups.forEach((part, i) => {
          if (i >= keys.length) return;
          (part || '').split(',').filter(Boolean).forEach(id => {
            map[id.trim()] = keys[i];
          });
        });
        if (Object.keys(map).length) pendingPrios[slot] = map;
      });
    }

    if (png) {
      const orderParam = urlParams.get('order');
      const bonusData = urlParams.get('bonus-data');
      let editUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?record-preview=' + encodeURIComponent(png) + (prioStr ? '&priorities=' + encodeURIComponent(prioStr) : '') + (bonusData ? '&bonus-data=' + encodeURIComponent(bonusData) : '');
      const themeParam = urlParams.get('theme');
      if (themeParam) editUrl += '&theme=' + encodeURIComponent(themeParam);
      if (orderParam) editUrl += '&order=' + encodeURIComponent(orderParam);
      const titleParam = urlParams.get('title');
      if (titleParam) editUrl += '&title=' + encodeURIComponent(titleParam);
      currentTitle = '';
      currentThemeName = 'dark';
      const titleP = urlParams.get('title');
      if (titleP) setRecordTitle(titleP);
      const themeP = urlParams.get('theme');
      if (themeP && themes[themeP]) currentThemeName = themeP;
      document.getElementById('importInput').value = png;
      importPotentials();
      applyPendingPrios();
      applyBonusUnitsData(bonusData);
      if (orderParam) resolveOrderFromParam(orderParam);
      renderRecordImage(png);
      setTimeout(async () => {
        const svgEl = document.querySelector('#recordImageContent svg');
        if (!svgEl) return;
        try {
          const pngBlob = await svgToPngBlob(svgEl);
          const pngUrl = URL.createObjectURL(pngBlob);
          const cover = document.getElementById('preloadCover');
          if (cover) cover.innerHTML = `<div id="pngToolbar" style="position:fixed;top:0;left:0;right:0;height:40px;background:#1a1a1a;border-bottom:1px solid #333;display:flex;align-items:center;padding:0 16px;gap:8px;z-index:10;">
  <input class="png-input" type="text" readonly value="${png.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}" style="width:260px;background:#111;border:1px solid #333;color:#aaa;padding:4px 8px;border-radius:3px;font-size:13px;font-family:monospace;outline:none;">
  <button class="png-copy" onclick="var i=this.previousElementSibling;navigator.clipboard.writeText(i.value).then(()=>{showToast('Copied')})" style="background:#222;border:1px solid #444;color:#aaa;padding:4px 12px;border-radius:3px;cursor:pointer;font-size:12px;font-family:inherit;letter-spacing:1px;white-space:nowrap;">Copy Code</button>
  <a class="png-edit" href="${editUrl}" style="background:#222;border:1px solid #444;color:#aaa;padding:4px 12px;border-radius:3px;cursor:pointer;font-size:12px;font-family:inherit;letter-spacing:1px;text-decoration:none;white-space:nowrap;transition:background 0.1s;" onmouseover="this.style.background='#2e2e2e';this.style.color='#ccc'" onmouseout="this.style.background='#222';this.style.color='#aaa'">Edit</a>
  <a class="png-download" href="${pngUrl}" download="record.png" style="background:#222;border:1px solid #444;color:#aaa;padding:4px 12px;border-radius:3px;cursor:pointer;font-size:12px;font-family:inherit;letter-spacing:1px;text-decoration:none;white-space:nowrap;transition:background 0.1s;" onmouseover="this.style.background='#2e2e2e';this.style.color='#ccc'" onmouseout="this.style.background='#222';this.style.color='#aaa'">Download</a>
</div>
<div id="pngImageWrap" style="position:relative;display:inline-flex;margin:48px auto 0;"><img id="recordPngImage" src="${pngUrl}" style="display:block;max-width:90vw;max-height:calc(100vh - 100px);"></div>`;
          const pngImg = document.getElementById('recordPngImage');
          if (pngImg) {
            if (pngImg.complete) {
              enablePngHover(pngImg);
            } else {
              pngImg.onload = () => enablePngHover(pngImg);
            }
          }
        } catch (e) {
          const cover = document.getElementById('preloadCover');
          if (cover) cover.innerHTML = '<p style="color:red">PNG generation failed</p>';
        }
      }, 500);
      return;
    }

    const cover = document.getElementById('preloadCover');
    if (cover) cover.remove();

    loadState();
    currentBuildId = Number(localStorage.getItem(CURRENT_BUILD_KEY)) || null;
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
    if (typeof VANILLA_MODE === 'undefined' || !VANILLA_MODE) {
      [emblemAttrData, itemData] = await Promise.all([
        fetchJSON(BASE_RAW + 'EN/bin/CharGemAttrValue.json'),
        fetchJSON(BASE_RAW + 'EN/language/en_US/Item.json'),
      ]);
    }
  } catch(e) { console.warn('Could not load emblem attr data', e); }

  try {
    if (typeof VANILLA_MODE === 'undefined' || !VANILLA_MODE) {
      const charGemAttrGroups = await fetchJSON('https://raw.githubusercontent.com/Melledy/Nebula/main/src/main/resources/defs/CharGemAttrGroups.json');
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
    }
  } catch(e) { console.warn('Could not load CharGemAttrGroups', e); }

  selectedChars.filter(c => c).forEach(cId => computeEmblemBonuses(cId));
  updatePotentials();
  generate();

  preloadAllDiscImages();

  checkRecordImageParam();

  const extrasJson = sessionStorage.getItem('nrb-load-extras');
  if (extrasJson) {
    sessionStorage.removeItem('nrb-load-extras');
    try {
      const extras = JSON.parse(extrasJson);
      if (extras.selectedChars) selectedChars = extras.selectedChars;
      if (extras.selectedDiscs) selectedDiscs = extras.selectedDiscs;
      if (extras.discCopies) discCopies = extras.discCopies;
      if (extras.noteCounts) noteCounts = extras.noteCounts;
      if (extras.emblemStats) emblemStats = extras.emblemStats;
      if (extras.emblemStatGroups) emblemStatGroups = extras.emblemStatGroups;
      if (extras.potLevels) potLevels = extras.potLevels;
      if (extras.priorityMap) priorityMap = extras.priorityMap;
      if (extras.potOrder) potOrder = extras.potOrder;
      renderDiscOutput();
      renderDiscs();
      updateDiscOutputText();
      updateNotes();
      selectedChars.filter(c => c).forEach(cId => computeEmblemBonuses(cId));
      updatePotentials();
      applyPendingPrios();
      generate();
      currentBuildId = extras.buildId || null;
      if (currentBuildId) localStorage.setItem(CURRENT_BUILD_KEY, currentBuildId);
    } catch(e) { console.warn('Failed to restore extras:', e); }
  }
}

init();

document.addEventListener('click', (e) => {
  const tt = document.querySelector('.pot-tooltip');
  if (!tt || tt.style.display === 'none') return;
  if (!e.target.closest('.pot-item img, [data-id], #recordPngImage')) {
    tt.style.display = 'none';
  }
});

document.addEventListener('touchmove', () => {
  const tt = document.querySelector('.pot-tooltip');
  if (tt) tt.style.display = 'none';
}, { passive: true });
