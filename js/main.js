function preloadAllDiscImages() {
  if (discImagesPreloaded) return;
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
  selectedChars = [null, null, null];
  selectedDiscs = ["212005", "211006", "211005", null, null, null];
  discCopies = {};
  potLevels = {};
  potOrder = {};
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

    const urlParams = new URLSearchParams(window.location.search);
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
      let editUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?record-preview=' + encodeURIComponent(png) + (prioStr ? '&priorities=' + encodeURIComponent(prioStr) : '');
      const themeParam = urlParams.get('theme');
      if (themeParam) editUrl += '&theme=' + encodeURIComponent(themeParam);
      if (orderParam) editUrl += '&order=' + encodeURIComponent(orderParam);
      document.getElementById('importInput').value = png;
      importPotentials();
      if (orderParam) resolveOrderFromParam(orderParam);
      renderRecordImage(png);
      setTimeout(async () => {
        const svgEl = document.querySelector('#recordImageContent svg');
        if (!svgEl) return;
        try {
          const pngBlob = await svgToPngBlob(svgEl);
          const pngUrl = URL.createObjectURL(pngBlob);
          const cover = document.getElementById('preloadCover');
          if (cover) cover.innerHTML = `<div style="position:fixed;top:0;left:0;right:0;height:36px;background:#1a1a1a;border-bottom:1px solid #333;display:flex;align-items:center;padding:0 16px;gap:8px;z-index:10;"><a href="${editUrl}" style="background:#222;border:1px solid #444;color:#aaa;padding:4px 12px;border-radius:3px;cursor:pointer;font-size:11px;font-family:inherit;letter-spacing:1px;text-decoration:none;transition:background 0.1s;" onmouseover="this.style.background='#2e2e2e';this.style.color='#ccc'" onmouseout="this.style.background='#222';this.style.color='#aaa'">Edit</a><a href="${pngUrl}" download="record.png" style="background:#222;border:1px solid #444;color:#aaa;padding:4px 12px;border-radius:3px;cursor:pointer;font-size:11px;font-family:inherit;letter-spacing:1px;text-decoration:none;transition:background 0.1s;" onmouseover="this.style.background='#2e2e2e';this.style.color='#ccc'" onmouseout="this.style.background='#222';this.style.color='#aaa'">Download</a></div><div style="position:relative;display:inline-flex;margin:40px auto 0;"><img id="recordPngImage" src="${pngUrl}" style="display:block;max-width:90vw;max-height:calc(100vh - 100px);"></div>`;
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
    [emblemAttrData, itemData] = await Promise.all([
      fetchJSON(BASE_RAW + 'EN/bin/CharGemAttrValue.json'),
      fetchJSON(BASE_RAW + 'EN/language/en_US/Item.json'),
    ]);
  } catch(e) { console.warn('Could not load emblem attr data', e); }

  try {
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
  } catch(e) { console.warn('Could not load CharGemAttrGroups', e); }

  selectedChars.filter(c => c).forEach(cId => computeEmblemBonuses(cId));
  updatePotentials();
  generate();

  preloadAllDiscImages();

  checkRecordImageParam();
}

init();
