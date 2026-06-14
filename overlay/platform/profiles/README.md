# Профили инсталляции YDLOS

Настройка через env и branding, без правки исходников в git.

```bash
YDL_PROFILE=portal
bash integration/apply-ydl-profile.sh ${YDL_COMPOSE_DIR}/.env
```

| Профиль | Назначение |
|---------|------------|
| `default` | HC=0, export, official admin, metrics |
| `portal` | OIDC viewers, `ENABLE_LEGACY_PD_RBAC=0` |
| `private-ext` | + SERVICE_NAME, flight-groups (опционально) |
| `full-rbac-legacy` | **deprecated** — pd_* |

`org-private` — алиас для `private-ext` (обратная совместимость).
