const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index.html', 'utf8');

// Extract THEMES object
const match = html.match(/const THEMES = \{[\s\S]*?^\}/m);
if (!match) { console.error('THEMES not found'); process.exit(1); }

const themesCode = match[0];
console.log('Found THEMES object, length:', themesCode.length);

// Evaluate to get the object
const THEMES = eval('(' + themesCode.replace('const THEMES =', '').replace(/;\s*$/, '') + ')');

const themesDir = 'css/themes';
if (!fs.existsSync(themesDir)) fs.mkdirSync(themesDir, { recursive: true });

const map = {
  p: '--primary',
  a: '--accent',
  bg: '--bg',
  t: '--text',
  m: '--muted',
  s: '--sub',
  r: '--rule',
  fD: '--font-display',
  fB: '--font-body',
};

// Named theme descriptions
const THEME_NAMES = {
  "theme-01": "tech-terminal — 终端绿，行号编号",
  "theme-02": "classic-blue — 经典蓝金，信纸网格",
  "theme-03": "indigo-serif — 靛紫衬线，典雅",
  "theme-04": "navy-cyan — 藏青碧波，商务",
  "theme-05": "navy-gold — 藏青古金，庄重",
  "theme-06": "blue-clean — 纯净蓝，清亮",
  "theme-07": "dark-green — 墨绿自然，极简",
  "theme-08": "warm-orange — 暖橙，亲和",
  "theme-09": "bordeaux — 酒红，经典",
  "theme-10": "rose — 暗粉玫瑰，现代",
  "theme-11": "olive-gold — 橄榄古金，文艺",
  "theme-12": "teal — 青碧，清新",
  "theme-13": "warm-serif — 暖灰衬线，古典",
  "theme-14": "burgundy — 酒红衬线，浓郁",
  "theme-15": "minimal-black — 极简黑白，留白",
  "theme-16": "mono-orange — 等宽橙，极客",
  "theme-17": "dark-purple — 暗紫霓虹，深邃",
  "theme-18": "navy-serif — 深蓝衬线，传统",
  "theme-19": "bold-red — 粗体红，冲击",
  "theme-20": "emerald — 翡翠绿，自然",
  "theme-21": "rose-dark — 暗玫红，优雅",
  "theme-22": "forest — 森林绿，沉静",
  "theme-23": "slate-serif — 石板灰衬线，稳重",
  "theme-24": "blue-modern — 现代蓝，清爽",
  "theme-25": "red-serif — 红衬线，经典",
  "theme-26": "beige-serif — 米色衬线，复古",
  "theme-27": "blue-sky — 天蓝，明快",
  "theme-28": "orange-bold — 橙黑粗体，活力",
  "theme-29": "pink-accent — 粉红强调，时髦",
  "theme-30": "bold-condensed — 粗体紧凑，力量",
  "theme-31": "brown-soft — 棕灰柔和，质朴",
  "theme-32": "red-stripe — 红条，醒目",
  "theme-33": "red-serif-warm — 暖红衬线，温润",
  "theme-34": "warm-nunito — 暖棕圆体，亲切",
};

Object.entries(THEMES).forEach(([key, data]) => {
  const numMatch = key.match(/theme-(\d+)/);
  if (!numMatch) return;
  const num = numMatch[1];
  const filename = path.join(themesDir, num + '.css');
  const desc = THEME_NAMES[key] || '';

  let css = '/* ' + key + (desc ? ' — ' + desc : '') + ' */\n';
  css += '.' + key + ' {\n';

  for (const [short, cssVar] of Object.entries(map)) {
    const val = data[short];
    if (val != null) {
      css += '  ' + cssVar + ': ' + val + ';\n';
    }
  }

  if (data.ln != null) {
    css += '  --line: ' + data.ln + ';\n';
  }
  if (data.rad != null) {
    css += '  --radius: ' + data.rad + 'px;\n';
  }
  if (data.pad != null) {
    css += '  --pad: ' + data.pad + 'px;\n';
  }

  if (data.v && typeof data.v === 'object') {
    for (const [prop, val] of Object.entries(data.v)) {
      css += '  ' + prop + ': ' + val + ';\n';
    }
  }

  css += '}\n';

  // Add theme-specific element styles based on known patterns
  if (key === 'theme-01') {
    css += `.${key} .r-tag {\n  background: transparent;\n  color: var(--tag-text);\n}\n`;
    css += `.${key} .r-h2 {\n  color: var(--heading);\n  letter-spacing: 0.14em;\n}\n`;
    css += `.${key} .r-row .l {\n  color: var(--item);\n}\n`;
    css += `.${key} .r-row .r {\n  color: var(--muted);\n}\n`;
    css += `.${key} .r-header {\n  background: #0a0a0a;\n  border-bottom: 1px solid #1a1d22;\n}\n`;
    css += `.${key} .r-name::before {\n  content: \"\$ \";\n  color: var(--accent);\n  font-weight: 400;\n}\n`;
    css += `.${key} .r-sub::before {\n  content: \"# \";\n  color: var(--muted);\n}\n`;
    css += `.${key} .r-desc li::marker {\n  color: var(--accent);\n  content: \"\\203A \";\n}\n`;
  }

  fs.writeFileSync(filename, css, 'utf8');
  console.log('Created: ' + filename + ' (' + css.length + ' bytes)');
});

console.log('\nAll theme files generated successfully.');
