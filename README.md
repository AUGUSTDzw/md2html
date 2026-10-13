# md2html — Markdown 报告转换器

将 Markdown 报告转为精美 HTML，支持 Mermaid 图表渲染、ABAP 语法高亮和多主题切换。

## 使用

1. 用浏览器打开 `index.html`
2. 默认加载 `zalvtree-report.md`
3. 顶栏切换主题、导入其他 .md 文件
4. 点击「导出 HTML」生成独立 .html 文件

## 功能

- **Mermaid 图表**：将 `flowchart`、`sequenceDiagram` 等代码块渲染为 SVG
- **语法高亮**：ABAP 代码块自动着色（关键字、字符串、注释等）
- **5 套主题**：Midnight（暗色）、Parchment（暖色）、Academic（学术）、Terminal（终端）、Slate（石板）
- **主题感知**：Mermaid 图表颜色随主题自动适配
- **优先级标记**：🔴 P0、🟠 P1、🟡 P2、🟢 P3 标题带对应色条
- **导出独立 HTML**：CSS 内联、SVG 预渲染，导出文件双击即可查看，无需 JS 运行时

## 项目结构

```
md2html/
├── index.html          转换器主页面
├── zalvtree-report.md  默认加载的报告
├── css/
│   ├── app.css         布局与报告内容样式
│   └── themes.css      5 套主题定义
├── vendor/
│   ├── marked.min.js   Markdown 解析 (v15)
│   ├── mermaid.min.js  图表渲染 (v11)
│   ├── highlight.min.js 语法高亮引擎 (v11)
│   └── abap.min.js     ABAP 语言定义
└── README.md
```

## 依赖

所有第三方库在 `vendor/` 目录，无需联网安装。字体通过 Google Fonts 加载。

## 技术栈

marked.js v15 · mermaid.js v11 · highlight.js v11 · 纯 HTML/CSS/JS，无构建步骤
