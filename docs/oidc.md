# OIDC (вход через IdP)

Включение: `OIDC=true` в `.env`, см. [overlay/platform/.env.example](../overlay/platform/.env.example).

После включения — вход через OIDC-провайдер (Keycloak, Authentik и т.д.). Роль по умолчанию для новых пользователей — **`datalens.viewer`**.

## Портал (iframe)

Профиль `portal`: без формы входа DataLens — см. [dev/oidc-seamless-sso.md](dev/oidc-seamless-sso.md).

## Документация

- [dev/oidc-seamless-sso.md](dev/oidc-seamless-sso.md)
- [dev/scenariy-portal-oidc-us-rls.md](dev/scenariy-portal-oidc-us-rls.md)
