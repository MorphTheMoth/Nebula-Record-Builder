const BASE_RAW = 'https://raw.githubusercontent.com/AutumnVN/StellaSoraData/main/';
const BASE_ASSETS = 'https://raw.githubusercontent.com/AutumnVN/ssassets/main/';

let charData = {}, discData = {}, charJson = {};
let selectedChars = [null, null, null];
let selectedDiscs = ["212005", "211006", "211005", null, null, null];
let potLevels = {};
let noteCounts = {};
let discCopies = {};
let playerId = '10001';
let potentialDesc = {};
let emblemStats = {};
let emblemStatGroups = {};
let emblemAttrData = {};
let itemData = {};
let emblemPotBonuses = {};
let priorityMode = false;
let priorityMap = {};
let pendingPrios = [];
let typeIdToSlot = {};
let discImagesPreloaded = false;
let activePotTab = 0;

const NOTE_IDS = [90011,90012,90013,90014,90015,90016,90017,90018,90019,90020,90021,90022,90023];
const ELEMENT_NOTE = {Aqua:90018,Ignis:90019,Ventus:90020,Terra:90021,Lux:90022,Umbra:90023};

const EFFECT_ATTR_NAMES = {
  1: 'ATK', 2: 'DEF', 3: 'HP', 4: 'HITRATE', 5: 'EVD',
  6: 'CRIT RATE', 7: 'CRIT RESIST', 8: 'CRIT DMG', 9: 'PENETRATE',
  10: 'DEF IGNORE', 11: 'WER', 12: 'FER', 13: 'SER', 14: 'AER',
  15: 'LER', 16: 'DER', 17: 'WEE', 18: 'FEE', 19: 'SEE', 20: 'AEE',
  21: 'LEE', 22: 'DEE', 23: 'WEP', 24: 'FEP', 25: 'SEP', 26: 'AEP',
  27: 'LEP', 28: 'DEP', 29: 'WEI', 30: 'FEI', 31: 'SEI', 32: 'AEI',
  33: 'LEI', 34: 'DEI', 35: 'WEERCD', 36: 'FEERCD', 37: 'SEERCD',
  38: 'AEERCD', 39: 'LEERCD', 40: 'DEERCD', 41: 'WEIGHT',
  42: 'TOUGHNESS_MAX', 43: 'TOUGHNESS_DAMAGE_ADJUST', 44: 'SHIELD_MAX',
  46: 'MOVE SPEED', 47: 'ATK SPD', 48: 'INTENSITY', 49: 'GENDMG',
  50: 'DMGPLUS', 51: 'FINAL DMG', 52: 'FINALDMGPLUS', 53: 'GENDMGRCD',
  54: 'DMGPLUSRCD', 55: 'SUPPRESS', 56: 'AA DMG', 57: 'SKILL DMG',
  58: 'ULTIMATE DMG', 59: 'OTHER DMG', 60: 'RCDNORMALDMG', 61: 'RCDSKILLDMG',
  62: 'RCDULTRADMG', 63: 'RCDOTHERDMG', 64: 'MARK DMG', 65: 'RCDMARKDMG',
  66: 'MINION DMG', 67: 'RCDMINION DMG', 68: 'PROJECTILE DMG', 69: 'RCDPROJECTILEDMG',
  70: 'AA CRIT RATE', 71: 'SKILL CRIT RATE', 72: 'ULTRA CRIT RATE',
  73: 'MARK CRIT RATE', 74: 'MINION CRIT RATE', 75: 'PROJECTILE CRIT RATE',
  76: 'OTHER CRIT RATE', 77: 'AA CRIT POWER', 78: 'SKILL CRIT POWER',
  79: 'ULTRA CRIT POWER', 80: 'MARK CRIT POWER', 81: 'MINION CRIT RATE',
  82: 'PROJECTILE CRIT POWER', 83: 'OTHER CRIT POWER', 84: 'ENERGY_MAX',
  85: 'SKILL_INTENSITY', 86: 'TOUGHNESS_BROKEN_DMG', 87: 'ADD_SHIELD_STRENGTHEN',
  88: 'BE_ADD_SHIELD_STRENGTHEN', 89: 'NORMAL_SUPPRESS', 90: 'SKILL_SUPPRESS',
  91: 'ULTRA_SUPPRESS', 92: 'MARK_SUPPRESS', 93: 'MINION SUPPRESS',
  94: 'PROJECTILE_SUPPRESS', 95: 'OTHER_SUPPRESS', 96: 'ENV_AMEND'
};

const ABILITY_TYPE_NAMES = {
  1: 'AA', 2: 'Skill', 3: 'Support Skill', 4: 'Ultimate'
};

const CHARGE_EFF_TYPE_NAMES = {
  0: 'Supp', 1: 'Main'
};

function capitalizeWords(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function fetchJSON(url) {
  return fetch(url).then(r => { if (!r.ok) throw new Error('Failed: ' + url); return r.json(); });
}

function saveState() {
  const state = {
    playerId, selectedChars, selectedDiscs,
    potLevels: {...potLevels}, emblemStats: {...emblemStats},
    emblemStatGroups: {...emblemStatGroups}, noteCounts: {...noteCounts}, discCopies: {...discCopies},
    priorityMap: {...priorityMap}, priorityMode
  };
  localStorage.setItem('nebulaBuildState', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('nebulaBuildState');
  if (!saved) return;
  try {
    const state = JSON.parse(saved);
    playerId = state.playerId || '10001';
    selectedChars = state.selectedChars || [null, null, null];
    selectedDiscs = state.selectedDiscs || ["212005", "211006", "211005", null, null, null];
    potLevels = state.potLevels || {};
    emblemStats = state.emblemStats || {};
    emblemStatGroups = state.emblemStatGroups || {};
    noteCounts = state.noteCounts || {};
    discCopies = state.discCopies || {};
    priorityMap = state.priorityMap || {};
    if (state.priorityMode) priorityMode = true;
  } catch (e) { console.warn('Failed to load state:', e); }
}

function copyToClipboard(text, feedbackId, msg = 'copied') {
  navigator.clipboard.writeText(text).then(() => {
    const fb = document.getElementById(feedbackId);
    if (fb) { fb.textContent = msg; setTimeout(() => { fb.textContent = ''; }, 1500); }
  }).catch(() => {});
}

function b64ToBytes(b64) {
  b64 = b64.replace(/\s+/g,'').replace(/-/g,'+').replace(/_/g,'/');
  b64 = b64.replace(/[^A-Za-z0-9+/=]/g,'');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function formatDescriptionWithColor(desc) {
  let result = desc.replace(/<color=#([0-9a-fA-F]{6})>(.*?)<\/color>/g, '<span style="color:#$1;">$2</span>');
  result = result.replace(/##(.*?)#\d+#/g, '$1');
  return result;
}

function formatPotentialDesc(id, params) {
  const key = `Potential.${id}.2`;
  let template = potentialDesc[key];
  if (!template) return `[No description available for ${id}]`;

  if (!Array.isArray(params)) params = [];
  params = params.map(p => (p !== undefined && p !== null) ? String(p) : '');

  const currentLevel = potLevels[id] || 0;

  function getTierValue(str, level) {
    if (!str || typeof str !== 'string') return str;
    const parts = str.split('/');
    if (parts.length === 1) return str;
    if (parts.length === 13) return parts[9] || str;
    let idx;
    if (level === 0) idx = 5;
    else idx = Math.min(parts.length - 1, Math.max(0, level - 1));
    return parts[idx] || str;
  }

  let result = template;
  for (let i = 1; i <= 15; i++) {
    const placeholder = `&Param${i}&`;
    if (result.includes(placeholder)) {
      let rawValue = (i-1 < params.length) ? String(params[i-1]) : '?';
      if (rawValue.includes('/')) rawValue = getTierValue(rawValue, currentLevel);
      result = result.replace(new RegExp(placeholder, 'g'), rawValue);
    }
  }

  return formatDescriptionWithColor(result);
}

function getTeamElements() {
  const els = new Set();
  selectedChars.forEach(id => { if (id && charJson[id]?.element) els.add(charJson[id].element); });
  selectedDiscs.forEach(id => { if (id && discData[id]?.element) els.add(discData[id].element); });
  return els;
}

function getRelevantElements() {
  const elements = new Set();
  for (let i = 0; i < 3; i++) {
    const d = selectedDiscs[i];
    if (d && discData[d]) elements.add(discData[d].element);
  }
  selectedChars.forEach(id => {
    if (id && charJson[id]?.element) elements.add(charJson[id].element);
  });
  return elements;
}
