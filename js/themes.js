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
  midnight: {
    name: 'Midnight',
    svgBg: '#0d1117',
    portrait: ['rgba(48,79,255,0.35)', 'rgba(30,60,200,0.3)'],
    groups: {
      core: 'rgba(0,220,255,0.55)',
      high: 'rgba(80,255,180,0.50)',
      medium: 'rgba(255,230,0,0.48)',
      low: 'rgba(255,100,80,0.48)',
      optional: 'rgba(180,180,200,0.40)'
    },
    titleColor: '#e0eaff',
    dividerColor: '#1e2a40'
  },
  forest: {
    name: 'Forest',
    svgBg: '#0f1a0f',
    portrait: ['rgba(40,120,60,0.4)', 'rgba(30,100,50,0.35)'],
    groups: {
      core: 'rgba(80,255,120,0.55)',
      high: 'rgba(180,255,60,0.50)',
      medium: 'rgba(0,220,180,0.50)',
      low: 'rgba(255,220,50,0.48)',
      optional: 'rgba(140,200,120,0.42)'
    },
    titleColor: '#c8ffcc',
    dividerColor: '#1a3a1a'
  },
  desert: {
    name: 'Desert',
    svgBg: '#1e1610',
    portrait: ['rgba(180,120,60,0.4)', 'rgba(160,100,50,0.35)'],
    groups: {
      core: 'rgba(255,180,0,0.60)',
      high: 'rgba(255,100,40,0.55)',
      medium: 'rgba(220,230,80,0.50)',
      low: 'rgba(80,200,160,0.50)',
      optional: 'rgba(200,170,130,0.42)'
    },
    titleColor: '#fff0d0',
    dividerColor: '#3a2a14'
  },
  ocean: {
    name: 'Ocean',
    svgBg: '#050e1a',
    portrait: ['rgba(0,120,200,0.4)', 'rgba(0,80,180,0.35)'],
    groups: {
      core: 'rgba(0,200,255,0.60)',
      high: 'rgba(0,255,200,0.52)',
      medium: 'rgba(80,160,255,0.52)',
      low: 'rgba(120,220,255,0.48)',
      optional: 'rgba(80,160,200,0.42)'
    },
    titleColor: '#d0f4ff',
    dividerColor: '#0a2040'
  },
  neon: {
    name: 'Neon',
    svgBg: '#0a0010',
    portrait: ['rgba(180,0,255,0.35)', 'rgba(140,0,220,0.3)'],
    groups: {
      core: 'rgba(255,0,200,0.65)',
      high: 'rgba(0,255,180,0.58)',
      medium: 'rgba(255,220,0,0.55)',
      low: 'rgba(0,200,255,0.52)',
      optional: 'rgba(180,100,255,0.45)'
    },
    titleColor: '#ffffff',
    dividerColor: '#2a0040'
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
    titleColor: '#efefef',
    dividerColor: '#2e2e32'
  },
  aurora: {
    name: 'Aurora',
    svgBg: '#060c18',
    portrait: ['rgba(20,180,160,0.4)', 'rgba(10,150,130,0.35)'],
    groups: {
      core: 'rgba(100,80,255,0.62)',
      high: 'rgba(0,240,200,0.55)',
      medium: 'rgba(60,210,255,0.52)',
      low: 'rgba(180,255,100,0.48)',
      optional: 'rgba(80,160,200,0.42)'
    },
    titleColor: '#d0fff0',
    dividerColor: '#0c1e30'
  },
  crimson: {
    name: 'Crimson',
    svgBg: '#1a0808',
    portrait: ['rgba(180,30,40,0.4)', 'rgba(150,20,30,0.35)'],
    groups: {
      core: 'rgba(255,60,60,0.62)',
      high: 'rgba(255,160,0,0.56)',
      medium: 'rgba(255,240,60,0.50)',
      low: 'rgba(0,220,160,0.50)',
      optional: 'rgba(200,120,120,0.42)'
    },
    titleColor: '#ffe0e0',
    dividerColor: '#3a1010'
  },
  obsidian: {
    name: 'Obsidian',
    svgBg: '#0b0b0f',
    portrait: ['rgba(60,60,100,0.5)', 'rgba(50,50,80,0.45)'],
    groups: {
      core: 'rgba(140,100,255,0.60)',
      high: 'rgba(80,200,255,0.54)',
      medium: 'rgba(0,240,200,0.50)',
      low: 'rgba(255,200,80,0.48)',
      optional: 'rgba(160,160,200,0.40)'
    },
    titleColor: '#e8e0ff',
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
    titleColor: '#ffe8ec',
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
    titleColor: '#ffe8c0',
    dividerColor: '#2a1e0c'
  },
  ember: {
    name: 'Ember',
    svgBg: '#160a02',
    portrait: ['rgba(220,80,20,0.4)', 'rgba(200,60,10,0.35)'],
    groups: {
      core: 'rgba(255,80,20,0.65)',
      high: 'rgba(255,180,0,0.58)',
      medium: 'rgba(255,40,80,0.54)',
      low: 'rgba(80,220,120,0.50)',
      optional: 'rgba(220,140,100,0.42)'
    },
    titleColor: '#ffdfcc',
    dividerColor: '#2c1206'
  },
  void: {
    name: 'Void',
    svgBg: '#030305',
    portrait: ['rgba(40,40,60,0.6)', 'rgba(30,30,50,0.55)'],
    groups: {
      core: 'rgba(180,160,255,0.55)',
      high: 'rgba(100,220,255,0.50)',
      medium: 'rgba(255,160,220,0.48)',
      low: 'rgba(120,255,200,0.46)',
      optional: 'rgba(160,160,210,0.40)'
    },
    titleColor: '#f0f0ff',
    dividerColor: '#0e0e18'
  },
  dusk: {
    name: 'Dusk',
    svgBg: '#100818',
    portrait: ['rgba(120,60,160,0.4)', 'rgba(100,40,140,0.35)'],
    groups: {
      core: 'rgba(220,80,255,0.58)',
      high: 'rgba(120,80,255,0.54)',
      medium: 'rgba(255,160,60,0.50)',
      low: 'rgba(0,220,220,0.48)',
      optional: 'rgba(180,120,200,0.40)'
    },
    titleColor: '#f0d0ff',
    dividerColor: '#1e1030'
  },
  sundown: {
    name: 'Sundown',
    svgBg: '#0e0608',
    portrait: ['rgba(200,60,80,0.4)', 'rgba(180,40,60,0.35)'],
    groups: {
      core: 'rgba(255,80,40,0.65)',
      high: 'rgba(255,190,0,0.58)',
      medium: 'rgba(255,60,160,0.52)',
      low: 'rgba(80,220,120,0.50)',
      optional: 'rgba(220,130,120,0.42)'
    },
    titleColor: '#fff0d0',
    dividerColor: '#280a10'
  },
  phantom: {
    name: 'Phantom',
    svgBg: '#0c0c10',
    portrait: ['rgba(80,80,100,0.4)', 'rgba(60,60,80,0.35)'],
    groups: {
      core: 'rgba(220,220,255,0.50)',
      high: 'rgba(140,200,255,0.46)',
      medium: 'rgba(200,160,255,0.44)',
      low: 'rgba(120,255,220,0.44)',
      optional: 'rgba(180,180,210,0.38)'
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
    titleColor: '#c0fff8',
    dividerColor: '#052824'
  },
  prussian: {
    name: 'Prussian',
    svgBg: '#04111e',
    portrait: ['rgba(10,80,140,0.45)', 'rgba(8,60,120,0.4)'],
    groups: {
      core: 'rgba(0,160,255,0.60)',
      high: 'rgba(0,240,220,0.54)',
      medium: 'rgba(80,180,255,0.52)',
      low: 'rgba(200,240,80,0.48)',
      optional: 'rgba(80,160,200,0.42)'
    },
    titleColor: '#c0e8ff',
    dividerColor: '#0a2030'
  },
  midnight2: {
    name: 'Deep navy',
    svgBg: '#08082a',
    portrait: ['rgba(40,40,160,0.45)', 'rgba(30,30,140,0.4)'],
    groups: {
      core: 'rgba(80,140,255,0.62)',
      high: 'rgba(80,220,255,0.55)',
      medium: 'rgba(160,80,255,0.52)',
      low: 'rgba(0,255,200,0.50)',
      optional: 'rgba(140,150,230,0.42)'
    },
    titleColor: '#d0d8ff',
    dividerColor: '#10103a'
  },
  moss: {
    name: 'Moss',
    svgBg: '#161a10',
    portrait: ['rgba(80,100,40,0.45)', 'rgba(60,80,30,0.4)'],
    groups: {
      core: 'rgba(160,240,60,0.58)',
      high: 'rgba(80,210,80,0.54)',
      medium: 'rgba(40,200,160,0.50)',
      low: 'rgba(220,220,60,0.48)',
      optional: 'rgba(140,180,100,0.42)'
    },
    titleColor: '#e0f0c0',
    dividerColor: '#242a18'
  },
  steel: {
    name: 'Steel',
    svgBg: '#11161c',
    portrait: ['rgba(80,110,140,0.4)', 'rgba(60,90,120,0.35)'],
    groups: {
      core: 'rgba(100,200,255,0.56)',
      high: 'rgba(60,240,220,0.52)',
      medium: 'rgba(140,220,140,0.50)',
      low: 'rgba(240,230,120,0.48)',
      optional: 'rgba(140,180,210,0.42)'
    },
    titleColor: '#d0e8ff',
    dividerColor: '#1e2830'
  },
  velvet: {
    name: 'Velvet',
    svgBg: '#0f0818',
    portrait: ['rgba(120,20,140,0.45)', 'rgba(100,10,120,0.4)'],
    groups: {
      core: 'rgba(200,40,255,0.62)',
      high: 'rgba(100,60,255,0.56)',
      medium: 'rgba(255,80,180,0.52)',
      low: 'rgba(0,220,255,0.50)',
      optional: 'rgba(180,80,220,0.42)'
    },
    titleColor: '#f0d0ff',
    dividerColor: '#1e0c28'
  },
  infrared: {
    name: 'Infrared',
    svgBg: '#0e0808',
    portrait: ['rgba(160,20,20,0.45)', 'rgba(140,10,10,0.4)'],
    groups: {
      core: 'rgba(255,40,40,0.65)',
      high: 'rgba(255,160,0,0.58)',
      medium: 'rgba(255,240,40,0.52)',
      low: 'rgba(255,0,180,0.50)',
      optional: 'rgba(200,100,100,0.42)'
    },
    titleColor: '#ffe0d0',
    dividerColor: '#220c0c'
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
    titleColor: '#5c1a2e',
    dividerColor: '#f5c0cc'
  },
  parchment: {
    name: 'Parchment',
    svgBg: '#f5f0e0',
    portrait: ['rgba(140,100,60,0.25)', 'rgba(120,80,40,0.2)'],
    groups: {
      core: 'rgba(180,80,20,0.50)',
      high: 'rgba(80,160,60,0.44)',
      medium: 'rgba(200,160,20,0.44)',
      low: 'rgba(60,140,180,0.42)',
      optional: 'rgba(160,140,120,0.36)'
    },
    titleColor: '#2a1a08',
    dividerColor: '#d4c9a0'
  },
  slate: {
    name: 'Slate',
    svgBg: '#f8f9fa',
    portrait: ['rgba(80,100,140,0.2)', 'rgba(60,80,120,0.18)'],
    groups: {
      core: 'rgba(60,100,220,0.46)',
      high: 'rgba(0,180,220,0.42)',
      medium: 'rgba(120,60,220,0.42)',
      low: 'rgba(0,180,140,0.40)',
      optional: 'rgba(120,140,180,0.34)'
    },
    titleColor: '#1a2040',
    dividerColor: '#dde2f0'
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
    titleColor: '#0a3020',
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
    titleColor: '#2a1060',
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
    titleColor: '#081840',
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
    titleColor: '#3a1408',
    dividerColor: '#e8ccbc'
  },
  mint: {
    name: 'Mint',
    svgBg: '#f0fbf7',
    portrait: ['rgba(40,180,140,0.22)', 'rgba(20,160,120,0.18)'],
    groups: {
      core: 'rgba(0,180,140,0.50)',
      high: 'rgba(40,210,160,0.44)',
      medium: 'rgba(0,180,220,0.44)',
      low: 'rgba(120,220,80,0.42)',
      optional: 'rgba(80,180,160,0.36)'
    },
    titleColor: '#083028',
    dividerColor: '#b8e8d8'
  },
  chalk: {
    name: 'Chalk',
    svgBg: '#fafaf8',
    portrait: ['rgba(60,60,70,0.15)', 'rgba(40,40,50,0.12)'],
    groups: {
      core: 'rgba(60,60,80,0.46)',
      high: 'rgba(40,140,200,0.42)',
      medium: 'rgba(80,180,60,0.42)',
      low: 'rgba(200,140,40,0.40)',
      optional: 'rgba(140,140,150,0.34)'
    },
    titleColor: '#1a1a1e',
    dividerColor: '#e0e0dc'
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
    titleColor: '#2a1800',
    dividerColor: '#e8d8b0'
  },
  blush: {
    name: 'Blush',
    svgBg: '#fff8f8',
    portrait: ['rgba(220,120,140,0.2)', 'rgba(200,100,120,0.16)'],
    groups: {
      core: 'rgba(220,60,110,0.48)',
      high: 'rgba(240,120,200,0.44)',
      medium: 'rgba(180,100,240,0.44)',
      low: 'rgba(60,200,200,0.40)',
      optional: 'rgba(210,160,180,0.36)'
    },
    titleColor: '#4a1428',
    dividerColor: '#f0d0d8'
  },
  peach: {
    name: 'Peach',
    svgBg: '#fff9f5',
    portrait: ['rgba(220,130,80,0.22)', 'rgba(200,110,60,0.18)'],
    groups: {
      core: 'rgba(240,120,40,0.50)',
      high: 'rgba(255,180,40,0.46)',
      medium: 'rgba(220,80,160,0.44)',
      low: 'rgba(60,200,180,0.42)',
      optional: 'rgba(210,170,140,0.36)'
    },
    titleColor: '#3a1808',
    dividerColor: '#f0d0b8'
  },
  nordic: {
    name: 'Nordic',
    svgBg: '#f2f5f8',
    portrait: ['rgba(60,100,140,0.2)', 'rgba(40,80,120,0.16)'],
    groups: {
      core: 'rgba(20,100,200,0.48)',
      high: 'rgba(0,180,220,0.44)',
      medium: 'rgba(0,160,140,0.44)',
      low: 'rgba(140,180,220,0.44)',
      optional: 'rgba(100,140,180,0.36)'
    },
    titleColor: '#0a1e30',
    dividerColor: '#ccd8e4'
  },
  limestone: {
    name: 'Limestone',
    svgBg: '#f7f5f0',
    portrait: ['rgba(120,110,90,0.22)', 'rgba(100,90,70,0.18)'],
    groups: {
      core: 'rgba(100,90,60,0.48)',
      high: 'rgba(120,180,60,0.44)',
      medium: 'rgba(180,120,60,0.44)',
      low: 'rgba(60,160,200,0.42)',
      optional: 'rgba(160,155,135,0.36)'
    },
    titleColor: '#1c1808',
    dividerColor: '#dcd8cc'
  },
  sand: {
    name: 'Sand',
    svgBg: '#f8f4ec',
    portrait: ['rgba(160,130,80,0.22)', 'rgba(140,110,60,0.18)'],
    groups: {
      core: 'rgba(180,140,40,0.50)',
      high: 'rgba(160,100,60,0.46)',
      medium: 'rgba(140,60,180,0.44)',
      low: 'rgba(40,180,160,0.42)',
      optional: 'rgba(170,155,120,0.36)'
    },
    titleColor: '#2c2008',
    dividerColor: '#e0d4b8'
  }
};

function getTheme(name) {
  return themes[name] || themes.dark;
}
