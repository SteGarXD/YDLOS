# Mark be01bff as edit in rebase todo.
param([string]$path = $args[0])
(Get-Content $path) -replace '^pick be01bff ', 'edit be01bff ' | Set-Content $path
