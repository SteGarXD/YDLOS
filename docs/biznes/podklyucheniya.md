# Подключения к данным

**Для кого:** аналитики и администраторы.

## Поддерживаемые источники (наша инсталляция)

ClickHouse, PostgreSQL, MySQL, YDB, CHYT, Greenplum, **MSSQL**, Oracle, Trino, AppMetrica, Yandex Metrika.

Создание: воркбук → **Создать подключение** → выбрать тип → указать хост и учётные данные (их задаёт администратор БД).

## Важно

- QL-чарты можно запретить на уровне подключения (`DASHSQL_NOT_ALLOWED`).
- Подзапросы могут быть ограничены (`SUBSELECT_NOT_ALLOWED`) — объединяйте данные в БД.

Официально: https://datalens.ru/opensource/docs/ru/
