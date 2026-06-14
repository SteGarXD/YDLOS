# Справочник ошибок (краткий)

**Для кого:** все.

Полный каталог: https://datalens.ru/opensource/docs/ru/troubleshooting/errors/all.html

## Частые на YDLOS

| Код / симптом | Что делать |
|---------------|------------|
| `ERR.DS_API.US.ACCESS_DENIED` | Нет прав на объект; проверить роль |
| `DASHSQL_NOT_ALLOWED` | QL запрещён на подключении |
| `SUBSELECT_NOT_ALLOWED` | Упростить датасет / join в БД |
| Таймаут загрузки чарта | Увеличить таймаут в env или оптимизировать запрос |
| 401 при входе | Проверить auth, cookie, nginx `Host` |
| Unauthorized в админке | Legacy bridge / sync пользователей |

Технический runbook: [ops/ustranenie-neispravnostey.md](ops/ustranenie-neispravnostey.md).
