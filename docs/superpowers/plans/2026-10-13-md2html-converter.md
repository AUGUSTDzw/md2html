# md2html Report Converter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the `reference/a4cv` resume generator into a minimal one-click Markdown report converter that renders `zalvtree-report.md` as a polished themed HTML document with mermaid diagrams, ABAP syntax highlighting, and standalone HTML export.

**Architecture:** A single `index.html` shell with a dark top bar (import / theme select / export) and a scrollable canvas. Markdown is parsed by `marked.js` v15, mermaid blocks are rendered to SVG by `mermaid.js` v11, and ABAP code is syntax-highlighted by `highlight.js` v11. CSS variables drive 5 switchable themes. Export captures the pre-rendered DOM + inlined CSS into a standalone `.html` file.

**Tech Stack:** marked.js v15, mermaid.js v11, highlight.js v11 (with ABAP language), vanilla CSS/JS, no build step.

## Global Constraints

- All vendor libraries must be local in `vendor/` — no CDN dependencies at runtime
- Font stack: `Inter`, `Noto Sans SC`, `JetBrains Mono` (Google Fonts link in `<head>`)
- The exported HTML must be a single file with no external JS dependencies (CSS inlined, SVGs pre-rendered)
- The tool must auto-load `zalvtree-report.md` on page open
- marked v15 renderer API uses object parameters: `code({ text, lang })`, not `code(code, lang)`
- Platform: Windows, PowerShell, no node/npm required for the tool itself

---

## File Structure

```
md2html/
├── index.html              ← Converter shell + rendering logic (~400 lines)
├── zalvtree-report.md      ← Input report (already exists)
├── css/
│   ├── app.css             ← Layout, top bar, report content styles (~200 lines)
│   └── themes.css          ← 5 report themes with CSS variables (~250 lines)
├── vendor/
│   ├── marked.min.js       ← Reuse from reference (v15.0.12, already exists)
│   ├── mermaid.min.js      ← NEW: mermaid v11 dist
│   ├── highlight.min.js    ← NEW: highlight.js v11 core
│   └── abap.min.js         ← NEW: highlight.js ABAP language definition
├── README.md               ← Brief usage instructions
└── .gitignore
```

**Files deleted from reference:**
- `css/themes/` (34 resume theme files), `css/variables.css`, `css/variants.css`, `css/resume.css`
- `vendor/Sortable.min.js`, `vendor/mammoth.browser.min.js`, `vendor/html2canvas.min.js`, `vendor/jspdf.umd.min.js`
- `assets/`, `_generate_themes.js`, `netlify.toml`, `LICENSE`, `NOTICE`
- `可视化简历生成器-1.0功能整理.md`, `苏明远-简历-20260615.html`, `苏明远-简历-20260615.md`

---

### Task 1: Project Setup — Cleanup and Vendor Library Acquisition

**Files:**
- Delete: all reference files listed above
- Copy: `vendor/marked.min.js` from reference (keep in place)
- Download: `vendor/mermaid.min.js`, `vendor/highlight.min.js`, `vendor/abap.min.js`
- Create: `.gitignore`, `README.md`
- Create: `css/` directory (files added in Task 2)

**Interfaces:**
- Produces: a clean project directory with only the needed vendor libraries and `zalvtree-report.md`

- [ ] **Step 1: Delete unnecessary reference files**

Run:
```powershell
Remove-Item -Recurse -Force "D:\Workspace\JS\md2html\reference\a4cv\css"
Remove-Item -Recurse -Force "D:\Workspace\JS\md2html\reference\a4cv\assets"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\vendor\Sortable.min.js"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\vendor\mammoth.browser.min.js"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\vendor\html2canvas.min.js"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\vendor\jspdf.umd.min.js"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\_generate_themes.js"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\netlify.toml"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\LICENSE"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\NOTICE"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\可视化简历生成器-1.0功能整理.md"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\苏明远-简历-20260615.html"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\苏明远-简历-20260615.md"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\README.md"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\index.html"
Remove-Item -Force "D:\Workspace\JS\md2html\reference\a4cv\.gitignore"
```

- [ ] **Step 2: Move vendor and zalvtree-report.md to project root**

The reference files are inside `reference/a4cv/`. We want the final structure at the project root `D:\Workspace\JS\md2html\`. Move the needed files up:

```powershell
# Move marked.min.js to project vendor (create dir first)
New-Item -ItemType Directory -Path "D:\Workspace\JS\md2html\vendor" -Force
Move-Item "D:\Workspace\JS\md2html\reference\a4cv\vendor\marked.min.js" "D:\Workspace\JS\md2html\vendor\marked.min.js"

# Clean up empty reference directory
Remove-Item -Recurse -Force "D:\Workspace\JS\md2html\reference"
```

- [ ] **Step 3: Download mermaid.min.js v11**

```powershell
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js" -OutFile "D:\Workspace\JS\md2html\vendor\mermaid.min.js"
```

Verify: `Test-Path "D:\Workspace\JS\md2html\vendor\mermaid.min.js"` should be `True`.

- [ ] **Step 4: Download highlight.js core and ABAP language**

```powershell
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js" -OutFile "D:\Workspace\JS\md2html\vendor\highlight.min.js"
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/languages/abap.min.js" -OutFile "D:\Workspace\JS\md2html\vendor\abap.min.js"
```

Verify: both files exist.

- [ ] **Step 5: Create css/ directory**

```powershell
New-Item -ItemType Directory -Path "D:\Workspace\JS\md2html\css" -Force
```

- [ ] **Step 6: Create .gitignore**

Create `D:\Workspace\JS\md2html\.gitignore`:
```
node_modules/
*.log
.DS_Store
Thumbs.db
```

- [ ] **Step 7: Create README.md**

Create `D:\Workspace\JS\md2html\README.md`:
```markdown
# md2html — Markdown 报告转换器

将 Markdown 报告转为精美 HTML，支持 Mermaid 图表渲染和 ABAP 语法高亮。

## 使用

1. 用浏览器打开 `index.html`
2. 默认加载 `zalvtree-report.md`
3. 顶栏切换主题、导入其他 .md 文件
4. 点击「导出 HTML」生成独立 .html 文件

## 依赖

所有第三方库在 `vendor/` 目录，无需联网安装。
```

- [ ] **Step 8: Verify project structure**

Run:
```powershell
Get-ChildItem -Recurse "D:\Workspace\JS\md2html" -File | Select-Object FullName
```

Expected files: `vendor/marked.min.js`, `vendor/mermaid.min.js`, `vendor/highlight.min.js`, `vendor/abap.min.js`, `zalvtree-report.md`, `.gitignore`, `README.md`, `docs/` (design + plan).

---

### Task 2: Create CSS Files — app.css and themes.css

**Files:**
- Create: `css/app.css`
- Create: `css/themes.css`

**Interfaces:**
- Produces: `css/app.css` with layout + report content styles; `css/themes.css` with 5 themes using CSS custom properties

- [ ] **Step 1: Create css/app.css**

Create `D:\Workspace\JS\md2html\css\app.css` with this complete content:

```css
/* ============ BASE ============ */
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  font-family: "Inter", "Noto Sans SC", system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  overflow: hidden;
}
button { font: inherit; cursor: pointer; border: none; background: none; color: inherit; }
button:focus-visible, select:focus-visible {
  outline: 2px solid rgba(99, 102, 241, 0.72);
  outline-offset: 2px;
}

/* ============ APP LAYOUT ============ */
.app {
  display: grid;
  grid-template-rows: 56px 1fr;
  height: 100vh;
}

/* ============ TOP BAR ============ */
.topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  background: linear-gradient(180deg, #161922, #0d0f14);
  color: #f5f7fb;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.65), 0 8px 24px rgba(8, 10, 16, 0.28);
  position: relative;
  z-index: 60;
}
.topbar .brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
  white-space: nowrap;
}
.topbar .brand b {
  font-size: 15px;
  font-weight: 700;
  color: #f3efe6;
  letter-spacing: 0.01em;
}
.topbar .brand span {
  font-size: 11px;
  font-weight: 500;
  color: rgba(243, 239, 230, 0.4);
  border-left: 1px solid rgba(255, 255, 255, 0.13);
  padding-left: 10px;
}
.spacer { flex: 1; }

/* ============ BUTTONS ============ */
.tbtn {
  min-height: 34px;
  padding: 7px 13px;
  border-radius: 8px;
  background: #191c24;
  color: #eef1f6;
  font-size: 12.5px;
  font-weight: 650;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s, transform 0.15s;
  white-space: nowrap;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}
.tbtn:hover { background: #242833; transform: translateY(-1px); }
.tbtn.primary {
  background: linear-gradient(180deg, #f7f2e6, #e6ddc6);
  color: #17181c;
  font-weight: 750;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 6px 16px rgba(0, 0, 0, 0.38);
}
.tbtn.primary:hover { filter: brightness(1.03); transform: translateY(-1px); }

/* ============ THEME SELECT ============ */
.theme-select {
  height: 34px;
  min-width: 120px;
  padding: 0 28px 0 10px;
  border-radius: 8px;
  background: #12151b;
  color: #eef1f6;
  border: 1px solid #2b303a;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  appearance: auto;
  cursor: pointer;
}
.theme-select:hover { background: #20242d; border-color: #3a4250; }

/* ============ CANVAS ============ */
.canvas {
  overflow: auto;
  padding: 32px 24px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg);
  background-image: radial-gradient(circle at 1px 1px, var(--bg-dot, rgba(15, 23, 42, 0.05)) 1px, transparent 0);
  background-size: 20px 20px, 100% 100%;
}
.canvas::-webkit-scrollbar { width: 7px; }
.canvas::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
.canvas:hover::-webkit-scrollbar-thumb { background: #c3cad6; }
.canvas::-webkit-scrollbar-corner { background: transparent; }

/* ============ REPORT PAGE ============ */
.report-page {
  width: 100%;
  max-width: 860px;
  background: var(--page-bg, var(--bg));
  border-radius: 8px;
  padding: 48px 56px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
}
@media (max-width: 920px) {
  .report-page { padding: 32px 24px; border-radius: 0; }
}

/* ============ REPORT CONTENT ============ */
#report-content {
  font-size: 15px;
  line-height: 1.75;
  color: var(--text);
}
#report-content h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--heading);
  margin: 0 0 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border);
  letter-spacing: -0.01em;
}
#report-content h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--heading);
  margin: 40px 0 16px;
  padding-left: 12px;
  border-left: 4px solid var(--accent);
}
#report-content h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--heading);
  margin: 32px 0 12px;
}
#report-content h4 {
  font-size: 15px;
  font-weight: 700;
  color: var(--heading);
  margin: 24px 0 8px;
}
#report-content p {
  margin: 0 0 16px;
}
#report-content ul, #report-content ol {
  margin: 0 0 16px;
  padding-left: 24px;
}
#report-content li {
  margin: 4px 0;
}
#report-content a {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.15s;
}
#report-content a:hover {
  border-bottom-color: var(--accent);
}
#report-content strong {
  font-weight: 700;
  color: var(--heading);
}

/* ============ TABLES ============ */
#report-content .table-wrap {
  overflow-x: auto;
  margin: 0 0 20px;
  border-radius: 8px;
  border: 1px solid var(--table-border);
}
#report-content table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
#report-content thead {
  background: var(--table-header-bg);
}
#report-content th {
  padding: 10px 14px;
  text-align: left;
  font-weight: 700;
  color: var(--table-header-text);
  border-bottom: 1px solid var(--table-border);
  white-space: nowrap;
}
#report-content td {
  padding: 9px 14px;
  border-bottom: 1px solid var(--table-border);
  color: var(--text);
  vertical-align: top;
}
#report-content tbody tr:nth-child(even) {
  background: var(--table-stripe-bg);
}
#report-content tbody tr:last-child td {
  border-bottom: none;
}

/* ============ CODE BLOCKS ============ */
#report-content .code-block {
  margin: 0 0 20px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--code-border);
  background: var(--code-bg);
}
#report-content .code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px;
  background: var(--code-header-bg);
  border-bottom: 1px solid var(--code-border);
  font-size: 11px;
  font-weight: 700;
  color: var(--code-header-text);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
#report-content .code-block pre {
  margin: 0;
  padding: 16px 18px;
  overflow-x: auto;
}
#report-content .code-block pre code {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--code-text);
  background: none;
  padding: 0;
}
#report-content code {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.9em;
  background: var(--inline-code-bg);
  color: var(--inline-code-text);
  padding: 2px 6px;
  border-radius: 4px;
}
#report-content .code-block code {
  background: none;
  padding: 0;
  color: var(--code-text);
}

/* ============ MERMAID ============ */
#report-content .mermaid {
  display: flex;
  justify-content: center;
  margin: 0 0 24px;
  padding: 20px;
  background: var(--mermaid-bg);
  border-radius: 8px;
  border: 1px solid var(--border);
  overflow-x: auto;
}
#report-content .mermaid svg {
  max-width: 100%;
  height: auto;
}
#report-content .mermaid-error {
  padding: 12px 16px;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
  margin: 0 0 20px;
}
#report-content .mermaid-error pre {
  margin-top: 8px;
  font-size: 12px;
  color: #991b1b;
}

/* ============ BLOCKQUOTE ============ */
#report-content blockquote {
  margin: 0 0 20px;
  padding: 12px 18px;
  background: var(--blockquote-bg);
  border-left: 4px solid var(--blockquote-border);
  border-radius: 0 8px 8px 0;
  color: var(--blockquote-text);
}
#report-content blockquote p {
  margin: 0;
}

/* ============ PRIORITY HEADINGS ============ */
#report-content h2.priority-p0 {
  border-left-color: #ef4444;
}
#report-content h2.priority-p1 {
  border-left-color: #f97316;
}
#report-content h2.priority-p2 {
  border-left-color: #eab308;
}
#report-content h2.priority-p3 {
  border-left-color: #22c55e;
}

/* ============ EMPTY STATE ============ */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--muted);
}
.empty-state .icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}
.empty-state p {
  font-size: 15px;
  margin-bottom: 8px;
}
.empty-state .hint {
  font-size: 13px;
  opacity: 0.6;
}

/* ============ LOADING STATE ============ */
.loading {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
  font-size: 14px;
}
.loading::after {
  content: "";
  display: block;
  width: 32px;
  height: 32px;
  margin: 16px auto 0;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ============ HIGHLIGHT.JS TOKEN COLORS ============ */
.hljs-keyword { color: var(--hl-keyword); }
.hljs-string { color: var(--hl-string); }
.hljs-comment { color: var(--hl-comment); font-style: italic; }
.hljs-number { color: var(--hl-number); }
.hljs-title { color: var(--hl-title); }
.hljs-attr { color: var(--hl-attr); }
.hljs-built_in { color: var(--hl-built-in); }
.hljs-type { color: var(--hl-type); }
.hljs-literal { color: var(--hl-literal); }
.hljs-meta { color: var(--hl-meta); }
.hljs-variable { color: var(--hl-variable); }
.hljs-symbol { color: var(--hl-symbol); }
.hljs-section { color: var(--hl-title); }
.hljs-name { color: var(--hl-keyword); }
.hljs-attribute { color: var(--hl-attr); }
.hljs-deletion { color: var(--hl-deletion); }
.hljs-addition { color: var(--hl-addition); }
```

- [ ] **Step 2: Create css/themes.css**

Create `D:\Workspace\JS\md2html\css\themes.css` with this complete content:

```css
/* ============ THEME SYSTEM ============ */

/* ---- Midnight (default) ---- */
:root, :root[data-theme="midnight"] {
  --bg: #0e1015;
  --page-bg: #14171e;
  --bg-dot: rgba(255, 255, 255, 0.03);
  --text: #c8cad3;
  --heading: #e8eaf0;
  --muted: #69707d;
  --accent: #818cf8;
  --border: #2a2d35;
  --code-bg: #0c0e13;
  --code-text: #c8cad3;
  --code-border: #1e2128;
  --code-header-bg: #14171e;
  --code-header-text: #6b7280;
  --inline-code-bg: #1e2128;
  --inline-code-text: #818cf8;
  --table-header-bg: #14171e;
  --table-header-text: #e8eaf0;
  --table-border: #2a2d35;
  --table-stripe-bg: #111318;
  --blockquote-bg: rgba(129, 140, 248, 0.06);
  --blockquote-border: #818cf8;
  --blockquote-text: #a8aab5;
  --mermaid-bg: #0c0e13;
  --hl-keyword: #c678dd;
  --hl-string: #98c379;
  --hl-comment: #6b7280;
  --hl-number: #d19a66;
  --hl-title: #61afef;
  --hl-attr: #d19a66;
  --hl-built-in: #56b6c2;
  --hl-type: #61afef;
  --hl-literal: #d19a66;
  --hl-meta: #6b7280;
  --hl-variable: #e06c75;
  --hl-symbol: #56b6c2;
  --hl-deletion: #e06c75;
  --hl-addition: #98c379;
}

/* ---- Parchment ---- */
:root[data-theme="parchment"] {
  --bg: #faf8f3;
  --page-bg: #fffdf8;
  --bg-dot: rgba(58, 50, 38, 0.06);
  --text: #3a3226;
  --heading: #2a2418;
  --muted: #8a8275;
  --accent: #8b5cf6;
  --border: #e8e0d0;
  --code-bg: #f5f0e6;
  --code-text: #3a3226;
  --code-border: #d8d0c0;
  --code-header-bg: #ede5d5;
  --code-header-text: #8a7a60;
  --inline-code-bg: #ede5d5;
  --inline-code-text: #7c3aed;
  --table-header-bg: #ede5d5;
  --table-header-text: #2a2418;
  --table-border: #d8d0c0;
  --table-stripe-bg: #f8f4eb;
  --blockquote-bg: rgba(139, 92, 246, 0.05);
  --blockquote-border: #8b5cf6;
  --blockquote-text: #5a5040;
  --mermaid-bg: #f5f0e6;
  --hl-keyword: #7c3aed;
  --hl-string: #059669;
  --hl-comment: #9a9285;
  --hl-number: #c2410c;
  --hl-title: #2563eb;
  --hl-attr: #c2410c;
  --hl-built-in: #0891b2;
  --hl-type: #2563eb;
  --hl-literal: #c2410c;
  --hl-meta: #9a9285;
  --hl-variable: #dc2626;
  --hl-symbol: #0891b2;
  --hl-deletion: #dc2626;
  --hl-addition: #059669;
}

/* ---- Academic ---- */
:root[data-theme="academic"] {
  --bg: #ffffff;
  --page-bg: #ffffff;
  --bg-dot: rgba(0, 0, 0, 0.03);
  --text: #1a1a1a;
  --heading: #111111;
  --muted: #666666;
  --accent: #1e40af;
  --border: #d1d5db;
  --code-bg: #f7f7f9;
  --code-text: #1a1a1a;
  --code-border: #d1d5db;
  --code-header-bg: #eeeef0;
  --code-header-text: #555555;
  --inline-code-bg: #eeeef0;
  --inline-code-text: #1e40af;
  --table-header-bg: #f3f4f6;
  --table-header-text: #111111;
  --table-border: #d1d5db;
  --table-stripe-bg: #f9fafb;
  --blockquote-bg: #f3f4f6;
  --blockquote-border: #1e40af;
  --blockquote-text: #374151;
  --mermaid-bg: #f7f7f9;
  --hl-keyword: #7c3aed;
  --hl-string: #059669;
  --hl-comment: #6b7280;
  --hl-number: #c2410c;
  --hl-title: #1e40af;
  --hl-attr: #c2410c;
  --hl-built-in: #0891b2;
  --hl-type: #1e40af;
  --hl-literal: #c2410c;
  --hl-meta: #6b7280;
  --hl-variable: #dc2626;
  --hl-symbol: #0891b2;
  --hl-deletion: #dc2626;
  --hl-addition: #059669;
}

/* ---- Terminal ---- */
:root[data-theme="terminal"] {
  --bg: #0a0e0a;
  --page-bg: #0d120d;
  --bg-dot: rgba(74, 222, 128, 0.03);
  --text: #4ade80;
  --heading: #86efac;
  --muted: #22c55e;
  --accent: #86efac;
  --border: #1a2a1a;
  --code-bg: #080a08;
  --code-text: #4ade80;
  --code-border: #1a2a1a;
  --code-header-bg: #0d120d;
  --code-header-text: #22c55e;
  --inline-code-bg: #1a2a1a;
  --inline-code-text: #86efac;
  --table-header-bg: #0d120d;
  --table-header-text: #86efac;
  --table-border: #1a2a1a;
  --table-stripe-bg: #0a0e0a;
  --blockquote-bg: rgba(74, 222, 128, 0.05);
  --blockquote-border: #4ade80;
  --blockquote-text: #22c55e;
  --mermaid-bg: #080a08;
  --hl-keyword: #86efac;
  --hl-string: #fde047;
  --hl-comment: #22c55e;
  --hl-number: #fde047;
  --hl-title: #4ade80;
  --hl-attr: #fde047;
  --hl-built-in: #67e8f9;
  --hl-type: #4ade80;
  --hl-literal: #fde047;
  --hl-meta: #22c55e;
  --hl-variable: #f87171;
  --hl-symbol: #67e8f9;
  --hl-deletion: #f87171;
  --hl-addition: #4ade80;
}

/* ---- Slate ---- */
:root[data-theme="slate"] {
  --bg: #1e293b;
  --page-bg: #283447;
  --bg-dot: rgba(148, 163, 184, 0.04);
  --text: #cbd5e1;
  --heading: #f1f5f9;
  --muted: #64748b;
  --accent: #38bdf8;
  --border: #334155;
  --code-bg: #1e293b;
  --code-text: #cbd5e1;
  --code-border: #334155;
  --code-header-bg: #283447;
  --code-header-text: #64748b;
  --inline-code-bg: #334155;
  --inline-code-text: #38bdf8;
  --table-header-bg: #283447;
  --table-header-text: #f1f5f9;
  --table-border: #334155;
  --table-stripe-bg: #243140;
  --blockquote-bg: rgba(56, 189, 248, 0.06);
  --blockquote-border: #38bdf8;
  --blockquote-text: #94a3b8;
  --mermaid-bg: #1e293b;
  --hl-keyword: #c084fc;
  --hl-string: #86efac;
  --hl-comment: #64748b;
  --hl-number: #fcd34d;
  --hl-title: #38bdf8;
  --hl-attr: #fcd34d;
  --hl-built-in: #67e8f9;
  --hl-type: #38bdf8;
  --hl-literal: #fcd34d;
  --hl-meta: #64748b;
  --hl-variable: #f87171;
  --hl-symbol: #67e8f9;
  --hl-deletion: #f87171;
  --hl-addition: #86efac;
}

/* ============ ACADEMIC SERIF FONT OVERRIDE ============ */
:root[data-theme="academic"] #report-content {
  font-family: Georgia, "Noto Serif SC", "Times New Roman", serif;
}
:root[data-theme="academic"] #report-content .code-block code,
:root[data-theme="academic"] #report-content code {
  font-family: "JetBrains Mono", "Fira Code", monospace;
}

/* ============ TERMINAL MONO FONT OVERRIDE ============ */
:root[data-theme="terminal"] #report-content {
  font-family: "JetBrains Mono", "Fira Code", monospace;
}
```

- [ ] **Step 3: Verify CSS files load correctly**

Create a temporary test HTML file `D:\Workspace\JS\md2html\test-css.html`:
```html
<!doctype html>
<html data-theme="midnight">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="css/app.css">
<link rel="stylesheet" href="css/themes.css">
</head>
<body>
<div class="app">
  <div class="topbar">
    <div class="brand"><b>md2html</b><span>Report Converter</span></div>
    <div class="spacer"></div>
  </div>
  <div class="canvas">
    <div class="report-page">
      <div id="report-content">
        <h1>Test Heading</h1>
        <p>Hello world</p>
      </div>
    </div>
  </div>
</div>
</body>
</html>
```

Open in browser, verify dark theme renders. Then delete the test file:
```powershell
Remove-Item "D:\Workspace\JS\md2html\test-css.html"
```

---

### Task 3: Create index.html — HTML Shell and Rendering Pipeline

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: `css/app.css`, `css/themes.css`, `vendor/marked.min.js`, `vendor/mermaid.min.js`, `vendor/highlight.min.js`, `vendor/abap.min.js`, `zalvtree-report.md`
- Produces: a working converter that loads, renders, and displays the report with mermaid diagrams and ABAP syntax highlighting

- [ ] **Step 1: Create index.html with HTML structure and CSS/script loading**

Create `D:\Workspace\JS\md2html\index.html`:

```html
<!doctype html>
<html lang="zh-CN" data-theme="midnight">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>md2html — Markdown 报告转换器</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;600;700;800;900&family=Noto+Serif+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/app.css">
  <link rel="stylesheet" href="css/themes.css">
</head>
<body>
  <div class="app">
    <!-- TOP BAR -->
    <div class="topbar">
      <div class="brand">
        <b>md2html</b>
        <span>Report Converter</span>
      </div>
      <div class="spacer"></div>
      <input type="file" id="file-input" accept=".md,.markdown,.txt" style="display:none">
      <button class="tbtn" id="import-btn">导入 .md</button>
      <select class="theme-select" id="theme-select">
        <option value="midnight">Midnight</option>
        <option value="parchment">Parchment</option>
        <option value="academic">Academic</option>
        <option value="terminal">Terminal</option>
        <option value="slate">Slate</option>
      </select>
      <button class="tbtn primary" id="export-btn">导出 HTML</button>
    </div>
    <!-- CANVAS -->
    <div class="canvas">
      <div class="report-page">
        <div id="report-content">
          <div class="loading">正在加载报告…</div>
        </div>
      </div>
    </div>
  </div>

  <!-- VENDOR SCRIPTS -->
  <script src="vendor/marked.min.js"></script>
  <script>
    // Preserve marked.js, load highlight.js with CJS shim
    window.__hlCjs = { module: window.module, exports: window.exports, define: window.define };
    window.module = undefined; window.exports = undefined; window.define = undefined;
  </script>
  <script src="vendor/highlight.min.js"></script>
  <script>
    window.module = window.__hlCjs.module;
    window.exports = window.__hlCjs.exports;
    window.define = window.__hlCjs.define;
    delete window.__hlCjs;
  </script>
  <script src="vendor/abap.min.js"></script>
  <script src="vendor/mermaid.min.js"></script>

  <!-- MAIN SCRIPT -->
  <script>
    "use strict";
    (function () {
      let currentMdText = "";

      // ============ MERMAID INIT ============
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
        },
        securityLevel: "loose",
        flowchart: { useMaxWidth: true, htmlLabels: true },
        sequence: { useMaxWidth: true },
      });

      // ============ UTIL ============
      function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
      }

      // ============ MARKED CONFIG ============
      const renderer = {
        code({ text, lang }) {
          const escaped = escapeHtml(text);
          if (lang === "mermaid") {
            return `<div class="mermaid">${escaped}</div>`;
          }
          const langLabel = lang || "text";
          const langClass = lang ? `language-${lang}` : "language-text";
          return `<div class="code-block">
            <div class="code-header"><span>${langLabel.toUpperCase()}</span></div>
            <pre><code class="${langClass}">${escaped}</code></pre>
          </div>`;
        },
        heading({ text, depth }) {
          const slug = text.replace(/<[^>]+>/g, "").trim()
            .toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "");
          let cls = "";
          if (depth === 2) {
            if (/🔴|P0/i.test(text)) cls = " priority-p0";
            else if (/🟠|P1/i.test(text)) cls = " priority-p1";
            else if (/🟡|P2/i.test(text)) cls = " priority-p2";
            else if (/🟢|P3/i.test(text)) cls = " priority-p3";
          }
          return `<h${depth} id="${slug}" class="${cls.trim()}">${text}</h${depth}>`;
        },
      };
      marked.use({ renderer, gfm: true, breaks: false });

      // ============ RENDER PIPELINE ============
      async function renderMarkdown(mdText) {
        currentMdText = mdText;
        const container = document.getElementById("report-content");
        container.innerHTML = '<div class="loading">正在渲染…</div>';

        // Step 1: Parse markdown to HTML
        let html = marked.parse(mdText);

        // Step 2: Inject HTML
        container.innerHTML = html;

        // Step 3: Wrap tables in scrollable containers
        container.querySelectorAll("table").forEach((table) => {
          if (table.parentElement.classList.contains("table-wrap")) return;
          const wrap = document.createElement("div");
          wrap.className = "table-wrap";
          table.parentNode.insertBefore(wrap, table);
          wrap.appendChild(table);
        });

        // Step 4: Highlight code blocks
        container.querySelectorAll("pre code").forEach((block) => {
          if (block.classList.contains("language-mermaid")) return;
          try {
            hljs.highlightElement(block);
          } catch (e) {
            // If highlighting fails, leave as plain code
          }
        });

        // Step 5: Render mermaid diagrams
        const mermaidDivs = container.querySelectorAll(".mermaid");
        for (let i = 0; i < mermaidDivs.length; i++) {
          const div = mermaidDivs[i];
          const code = div.textContent;
          try {
            const id = "mermaid-" + Date.now() + "-" + i;
            const { svg } = await mermaid.render(id, code);
            div.innerHTML = svg;
          } catch (e) {
            // Fallback: show error + original code
            div.className = "mermaid-error";
            div.innerHTML = `<strong>Mermaid 渲染失败:</strong><pre>${escapeHtml(e.message || e)}</pre>`;
          }
        }
      }

      // ============ FILE LOADING ============
      async function loadFile(url) {
        try {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error("HTTP " + resp.status);
          return await resp.text();
        } catch (e) {
          showEmpty(e.message);
          return null;
        }
      }

      function showEmpty(msg) {
        document.getElementById("report-content").innerHTML =
          `<div class="empty-state">
            <div class="icon">📄</div>
            <p>未加载报告</p>
            <div class="hint">${msg || "点击「导入 .md」加载文件"}</div>
          </div>`;
      }

      // ============ THEME SWITCHING ============
      const themeSelect = document.getElementById("theme-select");
      themeSelect.addEventListener("change", (e) => {
        document.documentElement.dataset.theme = e.target.value;
      });

      // ============ FILE IMPORT ============
      const fileInput = document.getElementById("file-input");
      document.getElementById("import-btn").addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        await renderMarkdown(text);
        fileInput.value = "";
      });

      // ============ DRAG & DROP ============
      const canvas = document.querySelector(".canvas");
      canvas.addEventListener("dragover", (e) => { e.preventDefault(); });
      canvas.addEventListener("drop", async (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file || !/\.(md|markdown|txt)$/i.test(file.name)) return;
        const text = await file.text();
        await renderMarkdown(text);
      });

      // ============ EXPORT ============
      document.getElementById("export-btn").addEventListener("click", exportHtml);

      async function exportHtml() {
        const theme = document.documentElement.dataset.theme;
        const reportHtml = document.getElementById("report-content").innerHTML;

        // Fetch CSS files
        let appCss = "", themesCss = "";
        try {
          const [r1, r2] = await Promise.all([
            fetch("css/app.css"),
            fetch("css/themes.css"),
          ]);
          appCss = await r1.text();
          themesCss = await r2.text();
        } catch (e) {
          alert("导出失败: 无法读取 CSS 文件 — " + e.message);
          return;
        }

        const html = `<!doctype html>
<html lang="zh-CN" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ZALVTREE 源码分析报告</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;600;700;800;900&family=Noto+Serif+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${appCss}

${themesCss}

body { overflow: auto; }
.app { display: block; height: auto; }
.canvas { overflow: visible; padding: 24px; }
.report-page { max-width: 860px; margin: 0 auto; }
</style>
</head>
<body>
<div class="app">
<div class="canvas">
<div class="report-page">
<div id="report-content">
${reportHtml}
</div>
</div>
</div>
</div>
</body>
</html>`;

        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "zalvtree-report.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }

      // ============ DEFAULT LOAD ============
      (async function init() {
        const md = await loadFile("zalvtree-report.md");
        if (md) await renderMarkdown(md);
      })();
    })();
  </script>
</body>
</html>
```

- [ ] **Step 2: Open index.html in browser and verify default load**

Open `D:\Workspace\JS\md2html\index.html` in a browser. Expected:
- Top bar with "md2html" brand, import button, theme dropdown (Midnight selected), export button
- Report content auto-loads `zalvtree-report.md`
- Mermaid diagrams render as SVG (flowchart and sequence diagram)
- ABAP code blocks have syntax highlighting
- Tables are styled with borders and stripes
- Priority headings (🔴 P0, etc.) have colored left borders

If mermaid diagrams don't render, check browser console for errors.

- [ ] **Step 3: Test theme switching**

Click the theme dropdown and switch to each theme. Verify:
- Page background, text color, code block colors, table colors all change
- Mermaid SVG stays the same (already rendered)
- Code highlighting colors change per theme

- [ ] **Step 4: Test file import**

Click "导入 .md", select a different .md file. Verify it renders. Also try dragging a .md file onto the canvas.

- [ ] **Step 5: Test export**

Click "导出 HTML". A file `zalvtree-report.html` downloads. Open it in a browser. Verify:
- Content displays correctly with the current theme
- Mermaid SVGs are visible (static, pre-rendered)
- Code highlighting is visible
- No external JS dependencies (fonts via Google Fonts are acceptable)

---

### Task 4: Polish — Mermaid Theme Sync, Empty State, and Edge Cases

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: the rendering pipeline from Task 3
- Produces: a polished converter with theme-aware mermaid rendering, graceful error handling, and title-based export filenames

- [ ] **Step 1: Add mermaid theme sync**

When the theme changes, mermaid diagrams should re-render with theme-appropriate colors. Modify the theme switch handler in `index.html`:

Find:
```javascript
      themeSelect.addEventListener("change", (e) => {
        document.documentElement.dataset.theme = e.target.value;
      });
```

Replace with:
```javascript
      themeSelect.addEventListener("change", async (e) => {
        document.documentElement.dataset.theme = e.target.value;
        // Re-render mermaid with updated CSS variables (mermaid reads from DOM)
        if (currentMdText) {
          await renderMarkdown(currentMdText);
        }
      });
```

Note: `currentMdText` is already declared at the top of the IIFE and assigned in `renderMarkdown` from Task 3.

- [ ] **Step 2: Verify theme re-render works**

Open `index.html`, switch themes, and verify mermaid diagrams re-render with the new theme's colors. The `currentMdText` variable and its assignment in `renderMarkdown` are already in place from Task 3.

- [ ] **Step 3: Make export filename dynamic based on H1 title**

In the `exportHtml` function, find:
```javascript
        a.download = "zalvtree-report.html";
```

Replace with:
```javascript
        const h1 = reportHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
        const title = h1 ? h1[1].replace(/<[^>]+>/g, "").trim() : "report";
        a.download = title + ".html";
```

- [ ] **Step 4: Handle missing zalvtree-report.md gracefully**

The `loadFile` function already calls `showEmpty` on error. Verify the empty state shows correctly by temporarily renaming `zalvtree-report.md` and reloading, then rename back.

- [ ] **Step 5: Verify all edge cases**

1. **Mermaid failure:** Temporarily add an invalid mermaid block to the markdown and verify the error fallback displays
2. **Large tables:** Narrow the browser window and verify tables scroll horizontally
3. **Theme re-render:** Switch themes and verify mermaid diagrams re-render

- [ ] **Step 6: Final verification**

Open `index.html` in browser. Verify:
- Default load works
- All 5 themes look good
- Mermaid diagrams render in all themes
- ABAP syntax highlighting works in all themes
- Export produces a working standalone HTML
- Import and drag-drop work

---

## Self-Review Checklist

After implementing all tasks, verify:

- [ ] All vendor files in `vendor/`: `marked.min.js`, `mermaid.min.js`, `highlight.min.js`, `abap.min.js`
- [ ] CSS files in `css/`: `app.css`, `themes.css`
- [ ] `index.html` at project root
- [ ] `zalvtree-report.md` at project root
- [ ] No leftover reference files
- [ ] Default load renders the report with mermaid + ABAP highlighting
- [ ] All 5 themes work
- [ ] Export produces a standalone HTML file
- [ ] Import and drag-drop work
