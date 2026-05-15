# Графики и лицензии (YDL OS / Aeronavigator BI)

## Highcharts и платформа

**Внешние скрипты Highcharts (CDN)** для opensource-конфига **отключены**: в `components/datalens-ui/src/server/configs/opensource/common.ts` задано `chartkitSettings.highcharts.enabled: false`. В разметке SSR это даёт только инлайн `window.Highcharts = {enabled: false};` и **не** добавляет теги `<script src="https://code.highcharts.com/...">` (см. `src/server/components/layout/utils.ts`, `getChartkitLayoutSettings`).

При сборке Docker-образа UI **нет** шага загрузки статики HC в `dist/public` (скрипт `highcharts-load.sh` удалён из пайплайна).

Переменная окружения **`HC`** в compose больше **не** включает CDN для этого форка: флаг в конфиге зафиксирован как `false` под политику коммерческого доступа без отдельной лицензии Highcharts.

## Что остаётся в коде и в `package.json`

В монорепозитории по-прежнему есть **npm-зависимость** `highcharts` и модули **ChartKit / DataLens**, которые импортируют Highcharts для части типов и путей отрисовки. Это **не** то же самое, что подключение сети к официальному CDN, но для **перепродажи доступа** к продукту юридически важно:

- убедиться, что условия [лицензии Highcharts](https://www.highcharts.com/license/) (и OEM при необходимости) **не** конфликтуют с вашей моделью, **или**
- запланировать техническое **вырезание** HC из бандла (замена/отключение плагинов `@gravity-ui/chartkit`, миграция сохранённых дашбордов только на D3 / Gravity Charts и т.д.).

В мастере визуализаций и в QL для этого форка задано **`HIGHCHARTS_DISABLED = true`** (`wizard/utils/visualization.ts`, `ql/utils/visualization/getAvailableQlVisualizations.ts`): типы графиков на Highcharts **не предлагаются**, остаются D3 / Gravity Charts и прочие не-HC варианты.

## Доступ по HTTP без HTTPS (до смены порта / внешнего nginx)

Для проверки с рабочей станции открывайте UI по **реальному хосту и порту**, куда проброшен контейнер (например `http://127.0.0.1:8080` или `http://<IP-сервера>:8080`, см. `UI_PORT` в `datalens/.env`). OIDC/redirect URL (`OIDC_BASE_URL` и связанные) в Keycloak должны совпадать с тем же происхождением (**http** и тот же хост:порт), иначе редирект после входа уйдёт на неверный адрес.

## Зависимости: «все ли свежие»

Нет автоматического «всё по последнему semver»: версии зафиксированы **`package-lock.json`** и осознанно меняются при обновлениях с регрессионным тестом. Регулярно имеет смысл смотреть `npm outdated`, `npm audit` и планировать обновления пакетов отдельными задачами — крупные мажорные апгрейды часто ломают сборку без правок кода.
