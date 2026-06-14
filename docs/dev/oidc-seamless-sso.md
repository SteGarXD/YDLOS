# Вход через Keycloak без страницы «Войти»

## Задача

Пользователь уже залогинен на корпоративном портале. В iframe открывается DataLens — **без** формы логина и без кнопки «Войти через Keycloak».

## URL для iframe

Страница **воркбука со списком дашбордов**, не отдельный дашборд:

```text
https://<ваш-bi>/workbooks/<workbookId>
```

Пример: воркбук «Портал» — берёте `workbookId` из URL в UI после открытия воркбука.

## Что должно быть в .env

```bash
OIDC=true
OIDC_ISSUER=...
OIDC_CLIENT_ID=...
OIDC_SECRET=...
OIDC_BASE_URL=https://<ваш-bi>   # базовый URL инсталляции для редиректа OIDC
AUTH_SIGNUP_DISABLED=true
YDL_USE_OFFICIAL_ADMIN=1
ENABLE_LEGACY_PD_RBAC=0
```

## Как это устроено в YDLOS

- **datalens-auth** + OIDC (official), не legacy `pd_*`.
- В UI при `USE_OFFICIAL_AUTH` и включённом OIDC без сессии — **сразу редирект на OIDC** (`OidcAutoRedirect`), а не `CustomSignin`.
- Брендинг (название, лого): `SERVICE_NAME` и layout-слой, без отдельной кастомной страницы входа.

CustomSignin остаётся в дереве исходников только как наследие; в prod-пути official auth он не используется.

## Keycloak

- Тот же realm, что и портал — иначе SSO не сработает.
- Redirect URI — как в доке DataLens OSS для вашего `OIDC_BASE_URL`.
- Для iframe: CSP / `X-Frame-Options` на стороне BI и портала.

## Если что-то пошло не так

| Симптом | Что проверить |
|---------|----------------|
| Висит страница входа DataLens | `OIDC=true`, cookie `auth`, `USE_OFFICIAL_AUTH` в compose |
| Снова просит логин Keycloak | нет SSO-сессии на портале |
| Пустой iframe | CSP, cookies third-party |
| После входа не тот экран | в iframe должен быть `/workbooks/<id>`, не `/auth` |

См. [dostup-kontenta.md](dostup-kontenta.md), [../oidc.md](../oidc.md).
