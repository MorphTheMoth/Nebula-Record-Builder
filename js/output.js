function updateBase64() {
  const importInp = document.getElementById('importInput');
  if (importInp && document.activeElement !== importInp) {
    try { importInp.value = packPotentials(); } catch(e) { importInp.value = ''; }
  }
}

function cleanupPotOrder() {
  for (const slot of Object.keys(potOrder)) {
    for (const group of Object.keys(potOrder[slot])) {
      potOrder[slot][group] = potOrder[slot][group].filter(id => (potLevels[+id] || 0) > 0);
      if (!potOrder[slot][group].length) delete potOrder[slot][group];
    }
    if (!Object.keys(potOrder[slot]).length) delete potOrder[slot];
  }
}

function generate() {
  cleanupPotOrder();
  const out = document.getElementById('output');
  const chars = selectedChars.filter(c => c).slice(0, 3);
  updateBase64();
  if (!chars.length) { out.textContent = '— select characters —'; out.style.color='#a66'; return; }
  if (selectedDiscs.slice(0, 3).filter(d => d).length < 3) { out.textContent = '— select main discs —'; out.style.color='#a66'; return; }

  let parts = ['build', ...chars, ...selectedDiscs.filter(id => id != null)];

  const potIds = [];
  const addPots = (cId, keys) => { const d = charJson[cId]; if (d?.potential) keys.forEach(k => (d.potential[k]||[]).forEach(p => potIds.push(p.id))); };
  if (chars[0]) addPots(chars[0], ['mainCore','mainNormal','common']);
  for (let i = 1; i < chars.length; i++) addPots(chars[i], ['supportCore','supportNormal','common']);
  const seen = new Set();
  potIds.forEach(id => {
    if (!seen.has(id)) {
      seen.add(id);
      const lvl = potLevels[id]||0;
      if (lvl > 0) {
        const totalLevel = potLevels[id];
        if (totalLevel > 0) parts.push(`${id}:${totalLevel}`);
      }
    }
  });

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

  parts.push('@' + playerId);
  out.textContent = parts.join(' ');
  updateDiscOutputText();
  saveState();
  out.style.color = '#6a8a6a';
}

function copyOutputText() {
  const out = document.getElementById('output');
  const txt = out.textContent;
  if (!txt || txt === '—') return;

  navigator.clipboard.writeText(txt.replace(/\r?\n/g, '\r\n') + '\r\n').then(() => {
    showToast('Copied');
  }).catch(() => {});
}

function copyAllOutputs() {
  const parts = [];

  const mainOutput = document.getElementById('output');
  if (mainOutput && mainOutput.textContent && mainOutput.textContent !== '—') {
    parts.push(mainOutput.textContent);
  }

  const discOutput = document.getElementById('discOutputText');
  if (discOutput && discOutput.textContent && discOutput.textContent !== '—') {
    parts.push(discOutput.textContent);
  }

  const emblemOutputs = document.querySelectorAll('[id^="emblem-output-"]');
  emblemOutputs.forEach(el => {
    if (el.textContent && el.textContent !== '—') {
      parts.push(el.textContent);
    }
  });

  if (parts.length === 0) return;

  const combined = parts.join('\r\n').replace(/\r?\n/g, '\r\n');
  navigator.clipboard.writeText(combined).then(() => {
    showToast('All Copied');
  }).catch(() => {});
}

function copyBase64() {
  const input = document.getElementById('importInput');
  if (!input.value.trim()) return;

  navigator.clipboard.writeText(input.value).then(() => {
    showToast('Copied');
  }).catch(() => {});
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

function packPotLevels(charIds) {
  const bits = [];
  const writeBits = (val, n) => { for (let i = n-1; i >= 0; i--) bits.push((val >>> i) & 1); };

  writeBits(charIds.length, 8);
  charIds.forEach(id => writeBits(+id >>> 0, 32));

  const cfgMap = buildCfgMap(charIds);
  charIds.forEach(id => {
    const cfg = cfgMap[+id];
    if (!cfg) return;
    const specIds  = cfg.AssistSpecificPotentialIds || [];
    const normIds  = cfg.AssistNormalPotentialIds   || [];
    const commIds  = cfg.CommonPotentialIds         || [];

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

function unpackPotLevels(b64) {
  const bytes = b64ToBytes(b64);
  const bits = [];
  for (const byte of bytes) for (let j = 7; j >= 0; j--) bits.push((byte >> j) & 1);

  let idx = 0;
  const readBits = n => {
    let v = 0;
    for (let i = n-1; i >= 0; i--) v += (bits[idx++] || 0) << i;
    return v >>> 0;
  };

  const count = readBits(8);
  const charIds = [];
  for (let i = 0; i < count; i++) {
    const id = readBits(32);
    if (id !== 0 && !charJson[id]) throw new Error(`Unknown bonus character id ${id}`);
    charIds.push(id);
  }

  const cfgMap = buildCfgMap(charIds.filter(id => id !== 0).map(String));
  const potentials = {};

  charIds.forEach(id => {
    const cfg = cfgMap[id];
    if (!cfg) return;
    const specIds = cfg.AssistSpecificPotentialIds || [];
    const normIds = cfg.AssistNormalPotentialIds   || [];
    const commIds = cfg.CommonPotentialIds         || [];

    specIds.forEach(pid => { const f = readBits(1); if (f) potentials[pid] = 1; });
    normIds.forEach(pid => { const v = readBits(3); if (v) potentials[pid] = v; });
    commIds.forEach(pid => { const v = readBits(3); if (v) potentials[pid] = v; });
  });

  return { charIds, potentials };
}

function packPotentials() {
  const top3 = selectedChars.filter(c => c).slice(0, 3);
  const chars = [
    top3[0] ? +top3[0] : 0,
    top3[1] ? +top3[1] : 0,
    top3[2] ? +top3[2] : 0,
  ];
  const cfgMap = buildCfgMap(top3);

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
    selectedChars = validIds;
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


