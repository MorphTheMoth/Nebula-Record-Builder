const themes = {
  dark: {
    name: 'Dark',
    svgBg: '#1a1a1a',
    portrait: ['rgba(82,75,120,0.45)', 'rgba(90,90,120,0.4)'],
    groups: {
      core: 'rgba(255,120,180,0.55)',
      high: 'rgba(100,230,200,0.5)',
      medium: 'rgba(200,200,80,0.5)',
      low: 'rgba(240,200,120,0.55)',
      optional: 'rgba(150,150,150,0.45)'
    },
    titleColor: '#ffffff',
    dividerColor: '#333333'
  },
  ventus: {
    name: 'Ventus',
    aliases: ['forest'],
    svgBg: '#0f1a0f',
    portrait: ['rgba(40,120,60,0.4)', 'rgba(30,100,50,0.35)'],
    groups: {
      core: 'rgba(80,255,120,0.55)',
      high: 'rgba(180,255,60,0.50)',
      medium: 'rgba(0,220,180,0.50)',
      low: 'rgba(255,220,50,0.48)',
      optional: 'rgba(140,200,120,0.42)'
    },
    titleColor: '#f2fbf0',
    dividerColor: '#1a3a1a'
  },
  terra: {
    name: 'Terra',
    aliases: ['desert'],
    svgBg: '#1e1610',
    portrait: ['rgba(180,120,60,0.4)', 'rgba(160,100,50,0.35)'],
    groups: {
      core: 'rgba(255,180,0,0.60)',
      high: 'rgba(255,100,40,0.55)',
      medium: 'rgba(220,230,80,0.50)',
      low: 'rgba(80,200,160,0.50)',
      optional: 'rgba(200,170,130,0.42)'
    },
    titleColor: '#fdf6ee',
    dividerColor: '#3a2a14'
  },
  aqua: {
    name: 'Aqua',
    aliases: ['ocean'],
    svgBg: '#050e1a',
    portrait: ['rgba(0,120,200,0.4)', 'rgba(0,80,180,0.35)'],
    groups: {
      core: 'rgba(0,200,255,0.60)',
      high: 'rgba(0,255,200,0.52)',
      medium: 'rgba(80,160,255,0.52)',
      low: 'rgba(120,220,255,0.48)',
      optional: 'rgba(80,160,200,0.42)'
    },
    titleColor: '#eef8ff',
    dividerColor: '#0a2040'
  },
  ignis: {
    name: 'Ignis',
    aliases: ['ember'],
    svgBg: '#160a02',
    portrait: ['rgba(220,80,20,0.4)', 'rgba(200,60,10,0.35)'],
    groups: {
      core: 'rgba(255,80,20,0.65)',
      high: 'rgba(255,180,0,0.58)',
      medium: 'rgba(255,40,80,0.54)',
      low: 'rgba(80,220,120,0.50)',
      optional: 'rgba(220,140,100,0.42)'
    },
    titleColor: '#fff0e8',
    dividerColor: '#2c1206'
  },
  lux: {
    name: 'Lux',
    svgBg: '#0a0e1a',
    portrait: ['rgba(85,125,218,0.33)', 'rgba(60,110,210,0.3)'],
    groups: {
      core: 'rgba(255,215,80,0.62)',
      high: 'rgba(206,189,112,0.56)',
      medium: 'rgba(158,162,145,0.50)',
      low: 'rgba(109,136,178,0.46)',
      optional: 'rgba(60,110,210,0.40)'
    },
    titleColor: '#fff6dc',
    dividerColor: '#141c34'
  },
  umbra: {
    name: 'Umbra',
    aliases: ['void'],
    svgBg: '#030305',
    portrait: ['rgba(40,40,60,0.6)', 'rgba(30,30,50,0.55)'],
    groups: {
      core: 'rgba(195,120,255,0.55)',
      high: 'rgba(160,102,210,0.50)',
      medium: 'rgba(125,85,165,0.48)',
      low: 'rgba(90,68,120,0.46)',
      optional: 'rgba(55,50,75,0.40)'
    },
    titleColor: '#ffffff',
    dividerColor: '#0e0e18'
  },
  ash: {
    name: 'Ash',
    svgBg: '#1c1c1e',
    portrait: ['rgba(160,160,170,0.3)', 'rgba(130,130,140,0.25)'],
    groups: {
      core: 'rgba(220,220,255,0.50)',
      high: 'rgba(140,220,255,0.46)',
      medium: 'rgba(180,255,200,0.44)',
      low: 'rgba(255,240,180,0.44)',
      optional: 'rgba(200,200,210,0.38)'
    },
    titleColor: '#ffffff',
    dividerColor: '#2e2e32'
  },
  obsidian: {
    name: 'Obsidian',
    svgBg: '#0b0b0f',
    portrait: ['rgba(60,60,100,0.5)', 'rgba(50,50,80,0.45)'],
    groups: {
      core: 'rgba(175,100,255,0.60)',
      high: 'rgba(155,100,224,0.54)',
      medium: 'rgba(135,100,192,0.50)',
      low: 'rgba(115,100,161,0.46)',
      optional: 'rgba(95,100,130,0.40)'
    },
    titleColor: '#f4f0ff',
    dividerColor: '#1a1a28'
  },
  rose: {
    name: 'Rose gold',
    svgBg: '#1a1014',
    portrait: ['rgba(200,100,120,0.35)', 'rgba(180,80,100,0.3)'],
    groups: {
      core: 'rgba(255,140,180,0.58)',
      high: 'rgba(255,200,100,0.52)',
      medium: 'rgba(200,140,255,0.50)',
      low: 'rgba(100,220,200,0.48)',
      optional: 'rgba(220,170,180,0.40)'
    },
    titleColor: '#fff2f5',
    dividerColor: '#2e1820'
  },
  copper: {
    name: 'Copper',
    svgBg: '#120e08',
    portrait: ['rgba(180,100,40,0.45)', 'rgba(160,80,30,0.4)'],
    groups: {
      core: 'rgba(255,150,0,0.62)',
      high: 'rgba(255,210,60,0.55)',
      medium: 'rgba(255,80,40,0.52)',
      low: 'rgba(60,200,160,0.50)',
      optional: 'rgba(200,160,100,0.42)'
    },
    titleColor: '#fdf3e6',
    dividerColor: '#2a1e0c'
  },
  dusk: {
    name: 'Dusk',
    svgBg: '#100818',
    portrait: ['rgba(120,60,160,0.4)', 'rgba(100,40,140,0.35)'],
    groups: {
      core: 'rgba(255,140,90,0.58)',
      high: 'rgba(215,120,105,0.54)',
      medium: 'rgba(175,100,120,0.50)',
      low: 'rgba(135,80,135,0.48)',
      optional: 'rgba(95,60,150,0.40)'
    },
    titleColor: '#f8eeff',
    dividerColor: '#1e1030'
  },
  sundown: {
    name: 'Sundown',
    svgBg: '#0e0608',
    portrait: ['rgba(200,60,80,0.4)', 'rgba(180,40,60,0.35)'],
    groups: {
      core: 'rgba(255,90,40,0.65)',
      high: 'rgba(242,90,60,0.58)',
      medium: 'rgba(230,90,80,0.52)',
      low: 'rgba(218,90,100,0.50)',
      optional: 'rgba(205,90,120,0.42)'
    },
    titleColor: '#fff2e6',
    dividerColor: '#280a10'
  },
  phantom: {
    name: 'Phantom',
    svgBg: '#0c0c10',
    portrait: ['rgba(80,80,100,0.4)', 'rgba(60,60,80,0.35)'],
    groups: {
      core: 'rgba(225,225,255,0.50)',
      high: 'rgba(198,198,224,0.46)',
      medium: 'rgba(170,170,192,0.44)',
      low: 'rgba(142,142,161,0.44)',
      optional: 'rgba(115,115,130,0.38)'
    },
    titleColor: '#ffffff',
    dividerColor: '#1c1c22'
  },
  lagoon: {
    name: 'Lagoon',
    svgBg: '#011a18',
    portrait: ['rgba(0,140,120,0.45)', 'rgba(0,120,100,0.4)'],
    groups: {
      core: 'rgba(0,230,210,0.60)',
      high: 'rgba(40,255,160,0.54)',
      medium: 'rgba(0,200,255,0.52)',
      low: 'rgba(160,255,160,0.48)',
      optional: 'rgba(80,190,170,0.42)'
    },
    titleColor: '#eafffa',
    dividerColor: '#052824'
  },
  velvet: {
    name: 'Velvet',
    svgBg: '#0f0818',
    portrait: ['rgba(120,20,140,0.45)', 'rgba(100,10,120,0.4)'],
    groups: {
      core: 'rgba(210,40,200,0.62)',
      high: 'rgba(185,40,172,0.56)',
      medium: 'rgba(160,40,145,0.52)',
      low: 'rgba(135,40,118,0.50)',
      optional: 'rgba(110,40,90,0.42)'
    },
    titleColor: '#f8eeff',
    dividerColor: '#1e0c28'
  },
  sakura: {
    name: 'Sakura',
    svgBg: '#fff5f7',
    portrait: ['rgba(255,150,170,0.3)', 'rgba(220,120,150,0.25)'],
    groups: {
      core: 'rgba(230,60,120,0.48)',
      high: 'rgba(200,80,220,0.42)',
      medium: 'rgba(100,160,255,0.42)',
      low: 'rgba(80,200,180,0.40)',
      optional: 'rgba(180,140,180,0.35)'
    },
    titleColor: '#1a0810',
    dividerColor: '#f5c0cc'
  },
  jade: {
    name: 'Jade',
    svgBg: '#f0f7f2',
    portrait: ['rgba(30,130,80,0.22)', 'rgba(20,110,60,0.18)'],
    groups: {
      core: 'rgba(0,160,80,0.50)',
      high: 'rgba(60,200,120,0.44)',
      medium: 'rgba(0,180,180,0.44)',
      low: 'rgba(140,210,40,0.42)',
      optional: 'rgba(80,160,120,0.36)'
    },
    titleColor: '#071a10',
    dividerColor: '#c0ddc8'
  },
  lavender: {
    name: 'Lavender',
    svgBg: '#f5f3ff',
    portrait: ['rgba(140,100,220,0.22)', 'rgba(120,80,200,0.18)'],
    groups: {
      core: 'rgba(100,60,240,0.48)',
      high: 'rgba(180,60,220,0.44)',
      medium: 'rgba(60,160,240,0.44)',
      low: 'rgba(0,200,180,0.40)',
      optional: 'rgba(160,140,210,0.36)'
    },
    titleColor: '#120a26',
    dividerColor: '#ddd0f5'
  },
  glacier: {
    name: 'Glacier',
    svgBg: '#f0f6ff',
    portrait: ['rgba(80,160,220,0.22)', 'rgba(60,140,200,0.18)'],
    groups: {
      core: 'rgba(20,120,240,0.48)',
      high: 'rgba(0,200,220,0.44)',
      medium: 'rgba(60,140,255,0.44)',
      low: 'rgba(0,200,160,0.40)',
      optional: 'rgba(100,160,210,0.36)'
    },
    titleColor: '#000000',
    dividerColor: '#c0d8f0'
  },
  terracotta: {
    name: 'Terracotta',
    svgBg: '#fdf6f0',
    portrait: ['rgba(180,80,40,0.22)', 'rgba(160,60,30,0.18)'],
    groups: {
      core: 'rgba(210,70,30,0.50)',
      high: 'rgba(230,150,40,0.44)',
      medium: 'rgba(180,80,60,0.44)',
      low: 'rgba(40,180,140,0.42)',
      optional: 'rgba(180,140,120,0.36)'
    },
    titleColor: '#1c0e04',
    dividerColor: '#e8ccbc'
  },
  harvest: {
    name: 'Harvest',
    svgBg: '#fdf8f0',
    portrait: ['rgba(160,100,20,0.25)', 'rgba(140,80,10,0.2)'],
    groups: {
      core: 'rgba(220,130,0,0.52)',
      high: 'rgba(240,180,20,0.46)',
      medium: 'rgba(200,80,40,0.46)',
      low: 'rgba(40,180,120,0.42)',
      optional: 'rgba(180,160,100,0.36)'
    },
    titleColor: '#180f00',
    dividerColor: '#e8d8b0'
  }
};

function resolveThemeName(name) {
  if (themes[name]) return name;
  for (const key of Object.keys(themes)) {
    const aliases = themes[key].aliases;
    if (aliases && aliases.indexOf(name) !== -1) return key;
  }
  return null;
}

function getTheme(name) {
  return themes[resolveThemeName(name)] || themes.dark;
}
