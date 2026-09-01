# last30days-reports

把 `last30days` 的最近 30 天研究结果整理成中文 Markdown 报告，并推送到 GitHub 私有仓库，供 ChatGPT 手机端读取。

## 一条命令运行

在 PowerShell 中：

```powershell
.\research.ps1 "AI 视频"
```

流程会自动完成：

1. 调用 Codex 与已安装的 `last30days` Skill 进行研究。
2. 读取历史报告，优先写“相比之前新增了什么”。
3. 生成带日期的归档报告。
4. 更新 `reports/latest.md`。
5. 校验报告结构并扫描待提交内容中的疑似秘密。
6. Git commit 并 push 到私有 GitHub 仓库。

常用示例：

```powershell
.\research.ps1 "AI Agent"
.\research.ps1 "手游广告自动化"
.\research.ps1 "AI 创业机会"
```

## 目录

```text
reports/latest.md       最近一次完整报告
reports/archive/        不覆盖的历史报告
scripts/                校验和秘密扫描脚本
REPORT_SPEC.md          统一中文报告格式
AGENTS.md               Codex 执行规则
```

## 手机 ChatGPT 建议提示词

> 使用 GitHub 读取我的 `last30days-reports` 私有仓库。先读 `reports/latest.md`，只分析最新日期的数据，告诉我出现了哪些新机会、为什么值得关注、目标用户、商业模式和未来 7 天的验证动作。

## 安全边界

- 仓库只存研究报告、规范和脚本。
- `.env`、Cookie、Token、Credential、日志、缓存和本地数据库均被忽略。
- 每次提交前会扫描暂存文件中的常见密钥模式。
- `research.ps1` 只暂存本次报告文件，不会执行 `git add .`。

