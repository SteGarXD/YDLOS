# Versions MUST match docker-compose image tags so components reflect what runs in containers.
# Source: datalens/docker-compose.yaml (and override) image: akrasnov87/name:TAG
$script:ComponentVersions = @{
    'datalens-ui'            = '0.3498.0'
    'datalens-backend'       = '0.2396.0'   # control-api + data-api same image version
    'datalens-us'            = '0.413.0'
    'datalens-auth'          = '0.2.6'
    'datalens-meta-manager'  = '0.50.0'
}
function Get-ComponentVersion { param([string]$Name) return $script:ComponentVersions[$Name] }
