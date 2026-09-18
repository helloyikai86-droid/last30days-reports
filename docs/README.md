# GitHub Pages 项目机会目录

本目录把每日 GitHub 热门项目从“长日报”变成适合手机浏览的项目卡片。

## 文件
- `docs/index.html`：GitHub Pages 首页
- `docs/projects.json`：项目目录数据，每日自动维护
- 每个项目只在首页展示“项目名 + 一句话说明”，可搜索、按分类筛选、点详情
- “关注”状态只保存在浏览器 LocalStorage，不上传仓库

## GitHub Pages
推荐设置：Repository Settings → Pages → Build and deployment → Deploy from a branch → `main` / `docs`。

日报原始 Markdown 仍保存在 `github-trending/archive/`，Pages 只负责阅读体验。
