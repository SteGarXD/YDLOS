# Карта возможностей: Cloud / OSS official / On-prem / YDLOS (факт 2026-05)

**Источники:** скрин «Карта возможностей» Yandex, письмо менеджера (форк vs on-prem), состояние репозитория YDLOS @ datalens-tech **2.9.0**.

Легенда **YDLOS:** ✅ есть | 🔶 частично / overlay / legacy | ❌ нет | 🔜 в roadmap YDLOS | ☁️ только Cloud | 🏢 on-prem vendor

| Возможность | Cloud | OSS official 2.9 | On-prem (vendor) | YDLOS (ваша платформа) | Комментарий |
|-------------|:-----:|:----------------:|:----------------:|:----------------------|-------------|
| Интерактивные дашборды | ✅ | ✅ | ✅ | ✅ | vendor |
| Конструктор чартов | ✅ | ✅ | ✅ | ✅ | ~37 типов @ HC=0 |
| Рассылки по расписанию | 🔜2026 | ❌ | 🔜2026 | ❌ | нужен отдельный сервис |
| Отчёты PDF / презентации | ✅ | ❌ | ✅ | 🔶 | PDF D3-чартов (HC=0); не полный «конструктор отчётов» |
| Стилизация интерфейса | ✅ | ❌ | ✅ | 🔶 | branding: logo, SERVICE_NAME, rebranding-theme; не полный UI theme editor |
| Editor (JS) + API-коннектор | ✅ | ❌ | ✅ | ❌ | большой объём; не в overlay |
| Встраивание непубличных чартов | ✅ | ❌ | 🔜2026 | 🔶 | Share/embed overlay; secure embed — сверить staging |
| Яндекс.Карты | ✅ | ❌ | ✅* | 🔶 | `YANDEX_MAP_*` env; нужен токен |
| Публичные чарты/дашборды | ✅ | ❌ | ❌ | 🔶 | shared links; не 1:1 с Cloud |
| Авторизация (ролевая модель) | ✅ | ❌* | ✅ | ✅ | *OSS: official auth + `datalens.*`; legacy `pd_*` опционально |
| Аутентификация (учётки) | Yandex ID | Local | SSO/Local | ✅ | official auth + OIDC×4 |
| **Свои роли (кастом)** | ✅ | ❌ | ✅ | 🔶 | official: 3 роли; **кастомные роли** — legacy `/admin/roles` при `ENABLE_LEGACY_PD_RBAC=1` |
| **Свои пользователи** | ✅ | 🔶 | ✅ | ✅ | `/settings` или legacy admin users |
| **Проекты (изоляция)** | ✅ | ❌ | ✅ | 🔶 | official: коллекции/воркбуки; **pd_projects** — legacy admin |
| Группы пользователей | ✅ | ❌ | ✅ | ❌ | нет в OSS; RFC |
| Usage Analytics | ✅ | ❌ | ✅ | ❌ | из письма менеджера |
| Фоновый экспорт CSV | ✅ | 🔶 | ✅ | 🔶 | export chart; не полный async jobs |
| Работа с файлами (upload) | ✅ | ❌ | ✅ | ❌ | upstream |
| API объектов (US) | ✅ | ✅ | ✅ | ✅ | official US 1.39 |
| Контроль публикации | ✅ | 🔶 | ✅ | 🔶 | US permissions |
| Excel экспорт дашборда | ✅ | 🔶 | ✅ | ✅ | `EXPORT_DASH_EXCEL` |
| Export workbook | ✅ | ✅ | ✅ | ✅ | `EXPORT_WORKBOOK_ENABLED` |
| QL `__user_id` / `__embed` | ☁️ | ❌ | ☁️ | ✅ | overlay |
| Связанные объекты (права) | 🔶 | ❌ | 🔶 | ✅ | overlay |
| Share view-only | ✅ | 🔶 | ✅ | ✅ | overlay |
| AI нейроаналитик | ✅ | ❌ | 🔜2026 | ❌ | |
| SLA / поддержка | ✅ | ❌ | 🏢 | ❌ | партнёры on-prem |
| Flight Groups (PRIVATE) | ❌ | ❌ | ❌ | ✅ | Organization |
| Обновление с official | — | — | vendor | ✅ | `behind=0`, publish-dist |

## Письмо менеджера Yandex (форк) — статус в YDLOS

| Пункт из письма | YDLOS |
|-----------------|-------|
| Usage Analytics | ❌ roadmap |
| Конструктор отчётов PDF/презентации | 🔶 PDF чартов, не презентации |
| Фоновый экспорт CSV | 🔶 |
| Работа с файлами | ❌ |
| API объектов | ✅ US |
| Editor JS / API connector | ❌ |
| Настройки UI / стилизация | 🔶 profiles + theme scss |
| Контроль публикации | 🔶 |
| Публичное / безопасное встраивание | 🔶 |
| Рассылки Q1 2026 | ❌ |
| Экстракты (H1) | ❌ |

## Роли / пользователи / проекты — как получить «как в форке»

| Нужно | Решение в YDLOS |
|-------|-----------------|
| Создавать пользователей | Official: `/settings` → Пользователи |
| Роли admin/editor/viewer | Official: `datalens.*` |
| **Свои имена ролей, множественные роли** | Legacy: `ENABLE_LEGACY_PD_RBAC=1`, `/admin/roles` |
| **Проекты** | Legacy: `/admin/projects` **или** official: коллекции + воркбуки |

См. [model-polzovateli-roli-proekty-official.md](model-polzovateli-roli-proekty-official.md).

## Excel

Актуальная таблица: [DataLens-editions-YDLOS.xlsx](DataLens-editions-YDLOS.xlsx) (генерация: `python3 scripts/generate-editions-matrix-xlsx.py`).
