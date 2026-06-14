# Индекс возможностей BI в YDLOS

Полная матрица: [feature-registry.md](feature-registry.md).

## Official OSS (L0–L4) — включено

Воркбуки, дашборды, датасеты, чарты, подключения, селекторы, QL, коллекции, service-settings, US permissions, embed/share (official + align overlay).

## YDLOS CONFIG (L1) — `YDL_BI_FULL=1`

- Экспорт workbook / Excel  
- Лимиты таблиц и таймауты  
- Все коннекторы visible  
- OIDC ×4 (compose multi)  
- Метрики (`YDL_METRICS=1`)  
- Rate limit на edge nginx  

## Overlay (akrasnov parity + PRIVATE)

- Share view-only, связанные объекты  
- QL `__user_id` / `__embed`  
- PDF D3 (HC=0)  
- Flight Groups, profiles, branding  
- Legacy admin (`ENABLE_LEGACY_PD_RBAC=1`) — опционально  

## Требует upstream PR (не блокирует prod)

Глобальный поиск, корзина UX, MSSQL в upstream backend, API tokens, Helm overlay values — см. [oss-platform-backlog.md](oss-platform-backlog.md) и `overlay/platform/upstream-rfc/`.
