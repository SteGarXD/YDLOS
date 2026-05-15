# YDL OS: запуск (prod, образы aeronavigatorbi)

Все контейнеры работают на образах **aeronavigatorbi** (prod). Имена контейнеров: `datalens-*-prod`.

1. Собрать/подготовить все образы (один раз или после изменений):
   ```powershell
   cd datalens
   .\build-all-images.ps1
   ```
   Собираются из исходников: postgres, temporal, control-api, data-api, UI. Образы us, auth, meta-manager подтягиваются с akrasnov87 и ретаргируются в aeronavigatorbi.

2. Запуск:
   ```powershell
   .\run-own-images.ps1
   ```
   Поднимается стек с `APP_ENV=prod`. Откройте http://localhost:8080.

---

## Что делает build-all-images.ps1

- **Своя сборка:** postgres, temporal, control-api, data-api, UI → образы `aeronavigatorbi/datalens-*`.
- **Pull + tag:** us, auth, meta-manager → те же версии под префиксом `aeronavigatorbi/`.

Итого все сервисы в контейнерах — под брендом aeronavigatorbi.
