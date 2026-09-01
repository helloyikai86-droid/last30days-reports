param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateNotNullOrEmpty()]
    [string]$Topic
)

$ErrorActionPreference = 'Stop'
$repoRoot = $PSScriptRoot
$archiveDir = Join-Path $repoRoot 'reports\archive'
$latestPath = Join-Path $repoRoot 'reports\latest.md'
$today = Get-Date -Format 'yyyy-MM-dd'

function Get-TopicSlug {
    param([string]$Value)

    $normalized = $Value.ToLowerInvariant()
    $map = [ordered]@{
        '手游广告自动化' = 'mobile-game-ad-automation'
        '手游营销' = 'mobile-game-marketing'
        '短视频自动化' = 'short-video-automation'
        'ai 视频生成' = 'ai-video-generation'
        'ai 视频' = 'ai-video'
        'ai agent' = 'ai-agent'
        'agent skill' = 'agent-skill'
        'ai 创业机会' = 'ai-startup-opportunities'
        '移动端 agent' = 'mobile-agent'
    }

    foreach ($entry in $map.GetEnumerator()) {
        $normalized = $normalized.Replace($entry.Key, $entry.Value)
    }

    $slug = $normalized -replace '[^a-z0-9]+', '-'
    $slug = $slug.Trim('-')
    if ([string]::IsNullOrWhiteSpace($slug)) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
        $hash = [System.Security.Cryptography.SHA256]::HashData($bytes)
        $shortHash = ([System.Convert]::ToHexString($hash)).Substring(0, 10).ToLowerInvariant()
        $slug = "yanjiu-$shortHash"
    }
    return $slug
}

function Get-FreeArchivePath {
    param([string]$BaseName)

    $candidate = Join-Path $archiveDir "$BaseName.md"
    if (-not (Test-Path -LiteralPath $candidate)) {
        return $candidate
    }

    $counter = 2
    while ($true) {
        $candidate = Join-Path $archiveDir "$BaseName-$counter.md"
        if (-not (Test-Path -LiteralPath $candidate)) {
            return $candidate
        }
        $counter++
    }
}

foreach ($commandName in @('git', 'gh', 'codex', 'node', 'python')) {
    if (-not (Get-Command $commandName -ErrorAction SilentlyContinue)) {
        throw "缺少命令：$commandName。请重新打开 PowerShell，让新安装的 PATH 生效。"
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $repoRoot '.git'))) {
    throw "当前目录还不是 Git 仓库：$repoRoot"
}

$dirty = & git -C $repoRoot status --porcelain
if ($LASTEXITCODE -ne 0) {
    throw '无法读取 Git 状态。'
}
if ($dirty) {
    throw "仓库存在未提交修改。请先处理后再运行，避免把无关内容混入报告提交。`n$dirty"
}

$slug = Get-TopicSlug -Value $Topic
$archivePath = Get-FreeArchivePath -BaseName "$today-$slug"
$archiveRelative = [System.IO.Path]::GetRelativePath($repoRoot, $archivePath).Replace('\', '/')
$latestRelative = 'reports/latest.md'

$prompt = @"
请使用已安装的 last30days Skill 对下面主题进行真实的最近 30 天研究，并把结果写成中文 Markdown 报告。不要用普通 WebSearch 摘要冒充 last30days。

研究主题：$Topic

执行要求：
1. 完整读取本仓库的 REPORT_SPEC.md 和 AGENTS.md。
2. 先搜索并阅读 reports/archive/ 中与主题相关的历史报告，执行去重，重点回答“相比之前新出现了什么”。
3. 按 last30days Skill 的当前运行契约执行研究；只陈述实际返回的来源和证据，不得伪造缺失来源。
4. 生成完整中文报告并写入：$archiveRelative
5. 同时把同一份完整内容写入：$latestRelative
6. 每个重点项目保留原始链接和热度证据。
7. 不要读取、写入或回显任何秘密、Cookie、Token、Session 或环境变量值。
8. 不要执行 git add、commit 或 push；外层脚本会在校验和秘密扫描通过后处理。
9. 完成前自行检查 REPORT_SPEC.md 的全部必需章节。

这是自动化执行，请直接完成文件，不要只回复方案。
"@

Write-Host "开始研究：$Topic"
Write-Host "目标归档：$archiveRelative"

$prompt | & codex exec --approve-for-me --sandbox workspace-write --cd $repoRoot --ephemeral -
if ($LASTEXITCODE -ne 0) {
    throw "Codex 研究执行失败，退出码：$LASTEXITCODE"
}

if (-not (Test-Path -LiteralPath $archivePath)) {
    throw "Codex 未生成预期归档文件：$archivePath"
}

Copy-Item -LiteralPath $archivePath -Destination $latestPath -Force

& (Join-Path $repoRoot 'scripts\validate-report.ps1') -Path $archivePath
& (Join-Path $repoRoot 'scripts\validate-report.ps1') -Path $latestPath

& git -C $repoRoot add -- $archiveRelative $latestRelative
if ($LASTEXITCODE -ne 0) {
    throw 'git add 失败。'
}

$staged = & git -C $repoRoot diff --cached --name-only
if ($LASTEXITCODE -ne 0 -or -not $staged) {
    throw '没有可提交的报告文件。'
}
$stagedAbsolute = @($staged | ForEach-Object { Join-Path $repoRoot $_ })
& (Join-Path $repoRoot 'scripts\assert-no-secrets.ps1') -Paths $stagedAbsolute

$commitMessage = "report: $today $Topic"
& git -C $repoRoot commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    throw 'git commit 失败。'
}

& git -C $repoRoot push origin HEAD
if ($LASTEXITCODE -ne 0) {
    throw 'git push 失败。报告已在本地提交，可在网络或登录恢复后再次 push。'
}

Write-Host "完成：$archiveRelative"
Write-Host "已更新：$latestRelative"
Write-Host "已提交并推送：$commitMessage"

