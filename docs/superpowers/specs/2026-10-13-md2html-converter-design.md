# md2html Report Converter — Design Spec

## Overview

Transform the `reference/a4cv` A4 resume generator into a minimal one-click Markdown report converter, specifically tailored for converting `zalvtree-report.md` (an ABAP source code analysis report) into a polished standalone HTML file.

## Requirements

1. **Usage pattern:** Minimal converter UI — import `.md` → pick theme → export standalone HTML
2. **Mermaid diagrams:** Render `flowchart TD` and `sequenceDiagram` as real SVG charts
3. **ABAP syntax highlighting:** Color-code ABAP code blocks (keywords, strings, comments)
4. **Multiple themes:** 5 built-in report themes, switchable before export
5. **Standalone export:** Output is a single `.html` file with pre-rendered SVG + inlined CSS, no JS runtime needed

## Architecture

### UI Layout

Two-row layout, stripped from the reference's 3-panel grid:

- **Row 1 — Top bar (~56px):** Brand text left, spacer, then: file import button, theme `<select>` dropdown, export HTML button. Dark chrome aesthetic (`#0e1015` background, light text).
- **Row 2 — Canvas (fill):** Scrollable area with a centered "page" container (`max-width: 860px`, padded). The rendered report lives here. Background depends on active theme.

No left panel, no right panel, no preset cards, no layout strip.

### Default Behavior

On page load, automatically fetch `zalvtree-report.md` from the project root and render it. The import button allows loading any `.md` file as an alternative.

## Markdown Rendering Pipeline

### Libraries

| Library | Purpose | Source |
|---|---|---|
| `marked.min.js` | General markdown → HTML (tables, headings, lists, blockquotes, code blocks) | Already in `vendor/` |
| `mermaid.min.js` | Render mermaid code blocks as SVG diagrams | Download to `vendor/` |
| `highlight.min.js` | Syntax highlighting engine | Download to `vendor/` |
| `abap.min.js` | ABAP language definition for highlight.js | Download to `vendor/` |

### Pipeline Steps

1. **Read** `.md` file text
2. **Pre-process:** Detect ` ```mermaid ` code blocks, mark them with a placeholder so `marked.js` doesn't escape their content
3. **Parse:** Run `marked.parse()` → produces HTML with `<pre><code class="language-abap">`, `<table>`, `<h1>`–`<h4>`, `<blockquote>`, etc.
4. **Mermaid render:** Run `mermaid.run()` on mermaid placeholders → replaces them with inline SVG diagrams
5. **Syntax highlight:** Run `hljs.highlightElement()` on all `<code>` blocks with `language-abap` class → applies highlighting classes
6. **Inject** into `#report-content` with themed CSS

### Custom Renderer Extensions

- **Tables:** Add CSS classes for responsive, bordered, striped table layout
- **Heading anchors:** Add `id` attributes to all headings (slugified) for potential in-page navigation
- **Priority headings:** Headings containing 🔴/🟠/🟡/🟢 emojis get accent-colored left borders matching the priority level
- **Code blocks:** Add a header bar with the language label (e.g., "ABAP") as a pure CSS/HTML element (no JS needed, works in exported HTML)

## Theme System

### Approach

CSS custom properties on `:root[data-theme="..."]`. ~15 variables per theme covering: page background, text, headings, links, code background, code text, inline code, table header, table border, blockquote, mermaid background, etc.

### Built-in Themes (5)

| Theme | Vibe | Key colors |
|---|---|---|
| **Midnight** (default) | Dark, technical, matches reference chrome | bg `#0e1015`, text `#e8eaf0`, accent `#818cf8` |
| **Parchment** | Warm light, document-like | bg `#faf8f3`, text `#3a3226`, accent `#8b5cf6` |
| **Academic** | Serif, formal, paper-style | bg `#ffffff`, text `#1a1a1a`, accent `#1e40af` |
| **Terminal** | Green-on-black, monospace | bg `#0a0e0a`, text `#4ade80`, accent `#86efac` |
| **Slate** | Modern neutral gray | bg `#1e293b`, text `#e2e8f0`, accent `#38bdf8` |

### Theme Switcher

A `<select>` dropdown in the top bar. Switching updates `document.documentElement.dataset.theme`. The rendered content stays the same; only CSS variables change, so no re-render needed.

## Export Mechanism

### Goal

Export a standalone `.html` file that works offline when double-clicked. No CDN dependencies, no external file references.

### Approach

The exported HTML captures the **pre-rendered final state**:
- Mermaid SVGs are already in the DOM → captured as static SVG markup
- Highlight.js has already applied CSS classes → captured with inline styles
- CSS is inlined as a `<style>` block

### Export Flow

1. Clone the current `#report-content` innerHTML (already rendered SVG + highlighted code)
2. Extract the current theme's CSS (the active `:root[data-theme]` block + all report styles)
3. Build a complete HTML document: `<!doctype html>` + `<head>` with inline `<style>` + `<body>` with the captured DOM
4. Trigger download as `zalvtree-report.html` (or based on the input filename)

### File Size

~50–100KB for a report of this size. No JS runtime needed in the exported file.

## File Structure

```
md2html/
├── index.html              ← New, ~500 lines. Stripped-down converter shell
├── zalvtree-report.md      ← Input report (already exists)
├── css/
│   ├── app.css             ← Top bar + canvas layout styles
│   └── themes.css          ← 5 report themes
├── vendor/
│   ├── marked.min.js       ← Already exists (reuse from reference)
│   ├── mermaid.min.js      ← NEW: mermaid@11 dist
│   ├── highlight.min.js    ← NEW: highlight.js core
│   └── abap.min.js         ← NEW: highlight.js ABAP language
├── README.md               ← Brief usage instructions
└── .gitignore
```

### Deletions from Reference

- `css/themes/` (34 resume theme files) → replaced by 5 report themes in one file
- `css/variables.css`, `css/variants.css`, `css/resume.css` → replaced by `css/app.css` + `css/themes.css`
- `vendor/Sortable.min.js`, `vendor/mammoth.browser.min.js`, `vendor/html2canvas.min.js`, `vendor/jspdf.umd.min.js` → not needed
- `assets/` (avatar, qrcode, screenshot) → not needed
- `_generate_themes.js`, `netlify.toml`, `LICENSE`, `NOTICE` → not needed
- `可视化简历生成器-1.0功能整理.md`, `苏明远-简历-20260615.*` → not needed

## Visual Design Language (from Reference)

Carry over from the reference project:
- Font stack: Inter + Noto Sans SC + JetBrains Mono (for code)
- Dark top bar with gradient (`linear-gradient(180deg, #161922, #0d0f14)`)
- Button styles: `.tbtn` pattern (rounded, chrome background, hover lift)
- Canvas: subtle dotted background pattern
- Scrollbar: thin, transparent by default, appears on hover

## Edge Cases

- **Mermaid rendering failure:** If mermaid fails to parse a diagram, fall back to displaying the original code block with an error message
- **Large tables:** Horizontal scroll on narrow viewports (`overflow-x: auto` on table containers)
- **Missing zalvtree-report.md on load:** Show a friendly empty state with an import prompt
- **ABAP code with no language tag:** Default to `language-abap` for any unlabeled code block in this report context
