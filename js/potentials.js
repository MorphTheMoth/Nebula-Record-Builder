function buildEmblemGroups(charId, isMain) {
  const potMap = {};
  const entries = Object.entries(emblemAttrData)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, entry]) => entry);

  const potGroupOrder = {};
  const cData = charJson[charId];
  if (cData?.potential) {
    const coreKey = isMain ? 'mainCore' : 'supportCore';
    const normalKey = isMain ? 'mainNormal' : 'supportNormal';
    const commonKey = 'common';

    const corePots = (cData.potential[coreKey] || []).slice().sort((a, b) => a.id - b.id);
    const normalPots = (cData.potential[normalKey] || []).slice().sort((a, b) => a.id - b.id);
    const commonPots = (cData.potential[commonKey] || []).slice().sort((a, b) => a.id - b.id);

    corePots.slice(0, 2).forEach(p => potGroupOrder[p.id] = 1);
    normalPots.slice(0, 3).forEach(p => potGroupOrder[p.id] = 1);
    corePots.slice(2, 4).forEach(p => potGroupOrder[p.id] = 2);
    normalPots.slice(3, 6).forEach(p => potGroupOrder[p.id] = 2);
    normalPots.slice(6).forEach(p => potGroupOrder[p.id] = 3);
    commonPots.forEach(p => potGroupOrder[p.id] = 3);
  }

  const byEmblem = [{}, {}, {}];

  for (const entry of entries) {
    const typeId = entry.TypeId;
    const slotNumber = typeIdToSlot[typeId];
    if (!slotNumber) continue;
    const emblemIdx = slotNumber - 1;

    const { AttrType, AttrTypeFirstSubtype, AttrTypeSecondSubtype, Level, Id, Value } = entry;

    let name;
    let order = 0;

    if (AttrType === 12 && AttrTypeFirstSubtype >= 17 && AttrTypeFirstSubtype <= 28) {
      const elements = ['Aqua', 'Ignis', 'Terra', 'Ventus', 'Lux', 'Umbra'];
      const suffix = AttrTypeFirstSubtype <= 22 ? 'Dmg %' : 'Pen';
      const elemIndex = (AttrTypeFirstSubtype - 17) % 6;
      const requiredElement = elements[elemIndex];
      const charElement = charJson[charId]?.element;
      if (charElement !== requiredElement) continue;
      name = `${requiredElement} ${suffix}`;
    } else if (AttrType === 12) {
      name = capitalizeWords(EFFECT_ATTR_NAMES[AttrTypeFirstSubtype]) || `Attr${AttrTypeFirstSubtype}`;
    } else if (AttrType === 37) {
      name = `Charge Eff (${CHARGE_EFF_TYPE_NAMES[AttrTypeFirstSubtype] ?? AttrTypeFirstSubtype}) `;
    } else if (AttrType === 7) {
      name = `${ABILITY_TYPE_NAMES[AttrTypeFirstSubtype] ?? AttrTypeFirstSubtype} Levelup`;
    } else if (AttrType === 99) {
      const paddedSub = String(AttrTypeFirstSubtype).padStart(2, '0');
      const fullPotId = Number('5' + charId + paddedSub);
      const groupOrd = potGroupOrder[fullPotId];
      if (groupOrd === undefined) continue;
      order = groupOrd;

      const itemKey = `Item.5${charId}${paddedSub}.1`;
      const itemName = itemData[itemKey];
      name = itemName ? itemName : `Potential ${paddedSub}`;
      potMap[fullPotId] = { emblemIdx, typeId };
    } else {
      continue;
    }

    const groups = byEmblem[emblemIdx];
    if (!groups[typeId]) {
      groups[typeId] = { name, entries: [], order };
    }
    groups[typeId].entries.push({ id: Id, level: Level, value: Value });
    if (AttrType == 99 || AttrType == 7) groups[typeId].isLevelup = true;
  }

  for (let i = 0; i < 3; i++) {
    for (const g of Object.values(byEmblem[i])) {
      g.entries.sort((a, b) => a.level - b.level);
    }
  }

  return { groups: byEmblem, potMap };
}

function computeEmblemBonuses(charId) {
  for (const key in emblemPotBonuses)
    if (key.startsWith('5' + charId)) delete emblemPotBonuses[key];

  for (let e = 0; e < 3; e++) {
    for (let s = 0; s < 4; s++) {
      const key = `${charId}_${e}_${s}`;
      const statEntryId = emblemStats[key];
      if (!statEntryId) continue;

      const entry = emblemAttrData[statEntryId];
      if (!entry || entry.AttrType !== 99) continue;

      const paddedSub = String(entry.AttrTypeFirstSubtype).padStart(2, '0');
      const fullPotId = Number('5' + charId + paddedSub);
      emblemPotBonuses[fullPotId] = (emblemPotBonuses[fullPotId] || 0) + entry.Level;
    }
  }
}

function updatePotentials() {
  let globalTooltip = document.querySelector('.pot-tooltip');
  if (!globalTooltip) {
    globalTooltip = document.createElement('div');
    globalTooltip.className = 'pot-tooltip';
    globalTooltip.style.display = 'none';
    document.body.appendChild(globalTooltip);
  }
  const sec = document.getElementById('potSection');
  const tabs = document.getElementById('potTabs');
  const content = document.getElementById('potContent');
  const chars = selectedChars.filter(c => c);
  if (!chars.length) { sec.style.display = 'none'; return; }
  sec.style.display = '';

  if (activePotTab >= chars.length) activePotTab = 0;

  tabs.innerHTML = '';
  chars.forEach((cId, i) => {
    const name = charJson[cId]?.name || cId;
    const btn = document.createElement('button');
    btn.className = 'pot-tab' + (i === activePotTab ? ' active' : '');
    btn.textContent = name;
    btn.onclick = () => { activePotTab = i; updatePotentials(); };
    tabs.appendChild(btn);
  });

  content.innerHTML = '';
  chars.forEach((cId, tabIdx) => {
    const page = document.createElement('div');
    page.className = 'pot-page' + (tabIdx === activePotTab ? ' active' : '');

    const cData = charJson[cId];
    if (!cData?.potential) return;

    const isMain = tabIdx === 0;
    const coreKey = isMain ? 'mainCore' : 'supportCore';
    const normalKey = isMain ? 'mainNormal' : 'supportNormal';
    const commonKey = 'common';

    let corePots = cData.potential[coreKey] || [];
    let normalPots = cData.potential[normalKey] || [];
    let commonPots = cData.potential[commonKey] || [];

    corePots = [...corePots].sort((a, b) => a.id - b.id);
    normalPots = [...normalPots].sort((a, b) => a.id - b.id);
    commonPots = [...commonPots].sort((a, b) => a.id - b.id);

    const groups = [
      { core: corePots.slice(0, 2), normal: normalPots.slice(0, 3), label: 'Group 1' },
      { core: corePots.slice(2, 4), normal: normalPots.slice(3, 6), label: 'Group 2' },
      { core: [], normal: normalPots.slice(6), common: commonPots, label: 'Group 3' }
    ];

    const groupsRow = document.createElement('div');
    groupsRow.className = 'pot-groups-row';

    groups.forEach((group, idx) => {
      const allItems = [];
      group.core.forEach(p => allItems.push({ ...p, maxLvl: 1, isCore: true }));
      group.normal.forEach(p => allItems.push({ ...p, maxLvl: 6, isCore: false }));
      if (group.common) {
        group.common.forEach(p => allItems.push({ ...p, maxLvl: 6, isCore: false }));
      }

      if (allItems.length === 0) return;

      const groupDiv = document.createElement('div');
      groupDiv.className = 'pot-group';
      const labelText = idx === 0 ? 'Build 1' : (idx === 1 ? 'Build 2' : 'Generic');
      groupDiv.innerHTML = `<div class="pot-group-label">${labelText}</div>`;
      const listDiv = document.createElement('div');
      listDiv.className = 'pot-list';

      allItems.forEach(p => {
        if (potLevels[p.id] === undefined) potLevels[p.id] = 0;
        const maxLvl = p.maxLvl;
        if (potLevels[p.id] > maxLvl) potLevels[p.id] = maxLvl;

        const item = document.createElement('div');
        item.className = 'pot-item' + (potLevels[p.id] > 0 ? ' active' : '');

        const img = document.createElement('img');
        img.src = BASE_ASSETS + `potential/${p.id}.webp`;
        img.onerror = () => img.style.opacity = '0.15';

        const nm = document.createElement('div');
        nm.className = 'pname'; nm.textContent = p.name || `#${p.id}`;

        const controls = document.createElement('div');
        controls.className = 'pot-controls';

        if (priorityMode) {
          if (potLevels[p.id]) {
            const sel = document.createElement('select');
            sel.className = 'priority-select';
            const labels = ['', 'Core', 'High', 'Medium', 'Low', 'Optional'];
            const vals   = ['', 'core', 'high', 'medium', 'low', 'optional'];
            vals.forEach((v, i) => {
              const opt = document.createElement('option');
              opt.value = v; opt.textContent = labels[i];
              if (priorityMap[p.id] === v) opt.selected = true;
              sel.appendChild(opt);
            });
            sel.onchange = () => { priorityMap[p.id] = sel.value; saveState(); };
            controls.appendChild(sel);
          }
        } else {
          const btnMinus = document.createElement('button');
          btnMinus.className = 'pot-btn'; btnMinus.textContent = '−';
          const inp = document.createElement('span');
          inp.className = 'pot-val';
          const bonus = emblemPotBonuses[p.id] || 0;
          inp.textContent = bonus > 0 ? `${potLevels[p.id]}+${bonus}` : potLevels[p.id];
          inp.type = 'number'; inp.min = 0; inp.max = maxLvl; inp.value = potLevels[p.id];
          inp.oninput = () => {
            potLevels[p.id] = Math.min(maxLvl, Math.max(0, +inp.value || 0));
            item.classList.toggle('active', potLevels[p.id] > 0);
            generate();
          };
          const btnPlus = document.createElement('button');
          btnPlus.className = 'pot-btn'; btnPlus.textContent = '+';
          const update = (val, diff) => {
            if (val === 6) {
              if (diff === +1) {
                if (typeof VANILLA_MODE === 'undefined' || !VANILLA_MODE) {
                  if (tryAddEmblemLevel(cId, p.id, potMap, allEmblemGroups)) {
                    computeEmblemBonuses(cId);
                    updatePotentials();
                    generate();
                  }
                }
                return;
              } else if (diff === -1) {
                if (tryRemoveEmblemLevel(cId, p.id, potMap, allEmblemGroups)) {
                  computeEmblemBonuses(cId);
                  updatePotentials();
                  generate();
                  return;
                }
              }
            }
            if (val === -diff) {
              tryRemoveEmblemLevel(cId, p.id, potMap, allEmblemGroups);
            }
            potLevels[p.id] = Math.min(maxLvl, Math.max(0, val+diff));
            const b = emblemPotBonuses[p.id] || 0;
            inp.textContent = b > 0 ? `${potLevels[p.id]}+${b}` : potLevels[p.id];
            item.classList.toggle('active', potLevels[p.id] + b > 0);
            computeEmblemBonuses(cId);
            updatePotentials();
            generate();
          };
          btnMinus.onclick = (e) => { e.stopPropagation(); update(potLevels[p.id], -1); };
          btnPlus.onclick  = (e) => { e.stopPropagation(); update(potLevels[p.id], +1); };
          item.onclick = (e) => {
            if (e.target === btnMinus || e.target === btnPlus || e.target === inp) return;
            update(potLevels[p.id], potLevels[p.id] > 0 ? -potLevels[p.id] : maxLvl);
          };
          controls.appendChild(btnMinus); controls.appendChild(inp); controls.appendChild(btnPlus);
        }
        item.appendChild(img); item.appendChild(nm); item.appendChild(controls);
        listDiv.appendChild(item);

        const tooltipGlobal = document.querySelector('.pot-tooltip');
        let moveHandler = null;

        img.addEventListener('mouseenter', (e) => {
          const tt = document.querySelector('.pot-tooltip');
          if (!tt) return;

          const bigImg = document.createElement('img');
          bigImg.src = img.src;

          const descDiv = document.createElement('div');
          descDiv.className = 'desc';
          let rawDesc = formatPotentialDesc(p.id, p.params);
          if (!rawDesc || rawDesc === 'No description available.') {
            rawDesc = 'No detailed description found.';
          }
          rawDesc = formatDescriptionWithColor(rawDesc);
          descDiv.innerHTML = rawDesc;

          tt.innerHTML = '';
          tt.appendChild(bigImg);
          tt.appendChild(descDiv);
          tt.style.display = 'flex';

          const updatePos = (event) => {
            tt.style.left = (event.clientX + 15) + 'px';
            tt.style.top = (event.clientY + 15) + 'px';
          };
          updatePos(e);
          window.addEventListener('mousemove', updatePos);
          moveHandler = updatePos;
        });

        img.addEventListener('mouseleave', () => {
          const tt = document.querySelector('.pot-tooltip');
          if (tt) tt.style.display = 'none';
          if (moveHandler) {
            window.removeEventListener('mousemove', moveHandler);
            moveHandler = null;
          }
        });
      });

      groupDiv.appendChild(listDiv);
      groupsRow.appendChild(groupDiv);
    });

    page.appendChild(groupsRow);

    const emblemSection = document.createElement('div');
    emblemSection.className = 'emblem-section';

    const emblemLabel = document.createElement('div');
    emblemLabel.className = 'emblem-section-label';
    emblemLabel.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';

    const emblemLabelText = document.createElement('span');
    emblemLabelText.textContent = 'Emblems';
    emblemLabel.appendChild(emblemLabelText);

    const clearEmblemBtn = document.createElement('button');
    clearEmblemBtn.className = 'import-btn clear-btn';
    clearEmblemBtn.textContent = 'Clear';
    clearEmblemBtn.title = 'Reset all emblems for this character';
    clearEmblemBtn.onclick = () => clearEmblems(cId);
    emblemLabel.appendChild(clearEmblemBtn);

    emblemSection.appendChild(emblemLabel);

    const emblemContainer = document.createElement('div');
    emblemContainer.className = 'emblem-container';

    const { groups: allEmblemGroups, potMap } = buildEmblemGroups(cId, isMain);
    for (let e = 0; e < 3; e++) {
      const card = document.createElement('div');
      card.className = 'emblem-card';

      const cardLabel = document.createElement('div');
      cardLabel.className = 'emblem-card-label';
      cardLabel.textContent = `Lvl ${e*10 + 70}`;
      card.appendChild(cardLabel);

      const statsDiv = document.createElement('div');
      statsDiv.className = 'emblem-stats';

      const groups = allEmblemGroups[e];
      const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
        const ga = groups[a];
        const gb = groups[b];
        const oa = ga.order ?? 0;
        const ob = gb.order ?? 0;
        if (oa !== ob) return oa - ob;
        return Number(a) - Number(b);
      });

      for (let s = 0; s < 4; s++) {
        const key = `${cId}_${e}_${s}`;
        if (emblemStats[key] === undefined) emblemStats[key] = '';
        if (emblemStatGroups[key] === undefined) emblemStatGroups[key] = '';

        const row = document.createElement('div');
        row.className = 'emblem-stat-row';

        const statSel = document.createElement('select');
        statSel.className = 'emblem-stat-select';
        const blankOpt = document.createElement('option');
        blankOpt.value = ''; blankOpt.textContent = '— stat —';
        statSel.appendChild(blankOpt);
        sortedGroupKeys.forEach(gk => {
          const opt = document.createElement('option');
          opt.value = gk;
          opt.textContent = groups[gk].name;
          statSel.appendChild(opt);
        });
        if (emblemStatGroups[key]) statSel.value = emblemStatGroups[key];

        const lvlSel = document.createElement('select');
        lvlSel.className = 'emblem-level-select';
        const fillLevelSel = (gk) => {
          lvlSel.innerHTML = '';
          const blk = document.createElement('option');
          blk.value = ''; blk.textContent = '— lv —';
          lvlSel.appendChild(blk);
          if (!gk || !groups[gk]) return;
          groups[gk].entries.forEach(entry => {
            const opt = document.createElement('option');
            opt.value = String(entry.id);
            opt.textContent = groups[gk].isLevelup ? `+${entry.value}` : `${entry.value < 1 ? (entry.value*100)+"%" : entry.value}`;
            lvlSel.appendChild(opt);
          });
          if (emblemStats[key]) lvlSel.value = emblemStats[key];
        };
        fillLevelSel(emblemStatGroups[key]);

        statSel.onchange = () => {
          emblemStatGroups[key] = statSel.value;
          emblemStats[key] = '';
          fillLevelSel(statSel.value);
          if (lvlSel.options.length > 1) {
            lvlSel.selectedIndex = lvlSel.options.length - 1;
            emblemStats[key] = lvlSel.value;
          }
          computeEmblemBonuses(cId);
          updatePotentials();
          generate();
        };
        lvlSel.onchange = () => {
          emblemStats[key] = lvlSel.value;
          computeEmblemBonuses(cId);
          updatePotentials();
          generate();
        };

        row.appendChild(statSel);
        row.appendChild(lvlSel);
        statsDiv.appendChild(row);
      }

      card.appendChild(statsDiv);
      emblemContainer.appendChild(card);
    }

    const emblemOutputContainer = document.createElement('div');
    emblemOutputContainer.className = 'emblem-output-container';

    const emblemOutput = document.createElement('div');
    emblemOutput.className = 'emblem-output';
    emblemOutput.id = `emblem-output-${cId}`;
    emblemOutput.textContent = '—';
    emblemOutput.addEventListener('click', () => {
      const txt = emblemOutput.textContent;
      if (!txt || txt === '—') return;
      copyToClipboard(txt.replace(/\r?\n+$/, ''));
    });

    const btnRow = document.createElement('div');
    btnRow.className = 'emblem-output-btn-row';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'emblem-output-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = () => copyEmblemOutput(cId);
    btnRow.appendChild(copyBtn);

    const copyAllBtn = document.createElement('button');
    copyAllBtn.className = 'emblem-output-btn';
    copyAllBtn.textContent = 'Copy All';
    copyAllBtn.onclick = () => copyAllEmblems(cId);
    btnRow.appendChild(copyAllBtn);

    emblemOutputContainer.appendChild(emblemOutput);
    emblemOutputContainer.appendChild(btnRow);
    emblemContainer.appendChild(emblemOutputContainer);

    emblemSection.appendChild(emblemContainer);
    page.appendChild(emblemSection);

    content.appendChild(page);
    updateEmblemOutput(cId);
  });
}

function updateEmblemOutput(cId) {
  const outputEl = document.getElementById(`emblem-output-${cId}`);
  if (!outputEl) return;

  const lines = [];
  for (let e = 0; e < 3; e++) {
    const statIds = [];
    const base = [101, 6001, 9401];
    for (let s = 0; s < 4; s++) {
      const key = `${cId}_${e}_${s}`;
      const val = emblemStats[key];
      if (val)
        statIds.push(val);
      else
        statIds.push(base[e])
    }
    if (statIds.filter(x => base.includes(x)).length != 4)
      lines.push(`emblem ${cId} ${e + 1} ${statIds.join(' ')} @${playerId}`);
  }
  outputEl.textContent = lines.length > 0 ? lines.join('\n')+'\n' : '—';
}

function tryAddEmblemLevel(charId, potId, potMap, allEmblemGroups) {
  const info = potMap[potId];
  if (!info) return false;
  const { emblemIdx, typeId } = info;
  const typeIdStr = String(typeId);
  const groups = allEmblemGroups[emblemIdx];
  if (!groups || !groups[typeIdStr]) return false;
  const entries = groups[typeIdStr].entries;
  if (!entries.length) return false;

  let targetS = -1;
  for (let s = 0; s < 4; s++) {
    const key = `${charId}_${emblemIdx}_${s}`;
    if (emblemStatGroups[key] === typeIdStr) {
      targetS = s;
      break;
    }
  }

  if (targetS === -1) {
    for (let s = 0; s < 4; s++) {
      const key = `${charId}_${emblemIdx}_${s}`;
      if (!emblemStatGroups[key] || emblemStatGroups[key] === '') {
        targetS = s;
        break;
      }
    }
  }

  if (targetS === -1) return false;

  const key = `${charId}_${emblemIdx}_${targetS}`;
  emblemStatGroups[key] = typeIdStr;

  const currentEntryId = emblemStats[key];
  let currentLevel = 0;
  if (currentEntryId) {
    const cur = entries.find(e => String(e.id) === String(currentEntryId));
    if (cur) currentLevel = cur.level;
  }

  const maxLevel = entries[entries.length - 1].level;
  let nextLevel = currentLevel + 1;
  if (nextLevel > maxLevel) nextLevel = maxLevel;

  const nextEntry = entries.find(e => e.level === nextLevel);
  if (nextEntry) {
    emblemStats[key] = String(nextEntry.id);
  }
  return true;
}

function tryRemoveEmblemLevel(charId, potId, potMap, allEmblemGroups) {
  const info = potMap[potId];
  if (!info) return false;
  const typeIdStr = String(info.typeId);

  for (let e = 2; e >= 0; e--) {
    const groups = allEmblemGroups[e];
    if (!groups || !groups[typeIdStr]) continue;
    const entries = groups[typeIdStr].entries;

    for (let s = 0; s < 4; s++) {
      const key = `${charId}_${e}_${s}`;
      if (emblemStatGroups[key] === typeIdStr) {
        const currentEntryId = emblemStats[key];
        if (!currentEntryId) continue;
        const cur = entries.find(en => String(en.id) === String(currentEntryId));
        if (!cur) continue;
        const currentLevel = cur.level;

        if (currentLevel <= 1) {
          emblemStatGroups[key] = '';
          emblemStats[key] = '';
        } else {
          const prevLevel = currentLevel - 1;
          const prevEntry = entries.find(en => en.level === prevLevel);
          if (prevEntry) {
            emblemStats[key] = String(prevEntry.id);
          }
        }
        return true;
      }
    }
  }
  return false;
}

function copyEmblemOutput(cId) {
  const outputEl = document.getElementById(`emblem-output-${cId}`);
  if (!outputEl) return;
  const txt = outputEl.textContent;
  if (!txt || txt === '—') return;
  copyToClipboard(txt);
}

function copyAllEmblems(clickedCharId) {
  const allLines = [];
  selectedChars.forEach(cId => {
    if (!cId) return;
    const outEl = document.getElementById(`emblem-output-${cId}`);
    if (outEl && outEl.textContent && outEl.textContent !== '—') {
      allLines.push(outEl.textContent.trim());
    }
  });

  if (allLines.length === 0) return;

  navigator.clipboard.writeText(allLines.join('\r\n')+'\r\n').then(() => {
    showToast('All Copied');
  }).catch(() => {});
}

function togglePriorityMode() {
  priorityMode = !priorityMode;
  const btn = document.getElementById('priorityToggle');
  if (btn) {
    btn.textContent = 'Edit Priorities';
    btn.style.background = priorityMode ? '#3a3a3a' : '';
    btn.style.borderColor = priorityMode ? '#ccc' : '';
    btn.style.color = priorityMode ? '#fff' : '';
  }
  updatePotentials();
}
