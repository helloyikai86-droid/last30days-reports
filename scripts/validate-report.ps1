param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Path)) {
    throw "报告不存在：$Path"
}

$content = Get-Content -Raw -LiteralPath $Path -Encoding UTF8
if ($content.Length -lt 2000) {
    throw "报告内容过短，可能生成不完整：$Path"
}

$requiredPatterns = @(
    '^---',
    '研究主题:',
    '报告日期:',
    'Top_3_机会:',
    'Top_1_最值得研究项目:',
    '一句话核心趋势:',
    '研究概览',
    '最值得进一步研究的 3 个机会',
    '今天可以直接执行的行动',
    '历史去重与变化记录',
    '方法与来源说明'
)

$missing = @()
foreach ($pattern in $requiredPatterns) {
    if ($content -notmatch $pattern) {
        $missing += $pattern
    }
}

if ($missing.Count -gt 0) {
    throw "报告缺少必要结构：$($missing -join ', ')"
}

$urlCount = ([regex]::Matches($content, 'https?://')).Count
if ($urlCount -lt 3) {
    throw "报告中的原始链接不足 3 个，无法证明研究来源：$Path"
}

Write-Host "报告结构校验通过：$Path（$urlCount 个链接）"

