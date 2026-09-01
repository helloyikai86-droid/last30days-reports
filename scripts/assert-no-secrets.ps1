param(
    [Parameter(Mandatory = $true)]
    [string[]]$Paths
)

$ErrorActionPreference = 'Stop'

$forbiddenNamePattern = '(?i)(^|[\\/])(\.env($|\.)|credentials?|cookies?|tokens?|secrets?)([\\/\.]|$)'
$secretPatterns = @(
    '(?i)-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----',
    '(?i)(api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|session[_-]?cookie)\s*[:=]\s*["''][A-Za-z0-9_\-\.]{16,}["'']',
    'gh[pousr]_[A-Za-z0-9]{30,}',
    'github_pat_[A-Za-z0-9_]{30,}',
    'sk-[A-Za-z0-9]{20,}',
    'AKIA[0-9A-Z]{16}'
)

foreach ($path in $Paths) {
    if ($path -match $forbiddenNamePattern) {
        throw "拒绝提交疑似秘密文件：$path"
    }

    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        continue
    }

    $content = Get-Content -Raw -LiteralPath $path -Encoding UTF8
    foreach ($pattern in $secretPatterns) {
        if ($content -match $pattern) {
            throw "在 $path 中发现疑似秘密内容，已阻止提交。匹配规则：$pattern"
        }
    }
}

Write-Host "秘密扫描通过：$($Paths.Count) 个文件"

