# GitHub Pages 项目机会目录

本目录把每日 GitHub 热门项目从“长日报”变成适合手机浏览的项目卡片。

## 文件
- `docs/index.html`：GitHub Pages 首页
- `docs/projects.json`：项目目录数据，每日自动维护
- 每个项目只在首页展示“项目名 + 一句话说明”，可搜索、按分类筛选、点详情
- “关注”状态只保存在浏览器 LocalStorage，不上传仓库

## 完整分析规则

- 每个进入任意日榜的项目，都必须在 `docs/projects.json` 中拥有一份 canonical 完整分析。
- 项目重复上榜时共用并按新证据更新这份分析，不再生成“历史日报恢复”占位内容。
- `docs/daily/YYYY-MM-DD.json` 保存当天排名和 Star 快照，同时同步 canonical 分析，保证直接打开任意日期也有完整内容。
- 发布前运行 `node scripts/sync-canonical-analysis.mjs --date YYYY-MM-DD` 和 `node scripts/validate-catalog-analysis.mjs`。

## GitHub Pages
推荐设置：Repository Settings → Pages → Build and deployment → Deploy from a branch → `main` / `docs`。

日报原始 Markdown 仍保存在 `github-trending/archive/`，Pages 只负责阅读体验。
