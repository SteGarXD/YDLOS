# Rebase reword helper: replace specific commit messages (by pattern).
param([string]$path = $args[0])
$content = Get-Content -Raw -Path $path
if ($content -match 'remove all .* references from repo') {
    $msg = "chore: strip internal docs and IDE config from repo; add to .gitignore"
    Set-Content -Path $path -Value $msg -NoNewline
} elseif ($content -match 'rule git only at git\.aeronavigator') {
    $msg = "fix(demo): FK on revisions, insert only if entry exists; single remote at git.aeronavigator.ru"
    Set-Content -Path $path -Value $msg -NoNewline
}
