# Replace pick with reword for commits we want to reword (by message pattern).
param([string]$path = $args[0])
(Get-Content $path) -replace '^pick ([a-f0-9]+) (.*remove all .*references from repo.*)', 'reword $1 $2' -replace '^pick ([a-f0-9]+) (.*rule git only at git\.aeronavigator.*)', 'reword $1 $2' | Set-Content $path
