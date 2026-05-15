# Продакшен-URL: **https://bi.aeronavigator.ru** (YDL / Yandex DataLens)

Платформа для пользователей в интернете открывается по адресу **`https://bi.aeronavigator.ru`**. Это **YDL** — развёртывание на базе **open-source Yandex DataLens** ([datalens-tech/datalens](https://github.com/datalens-tech/datalens)), а не прежний AW (Analytic Workspace).

Ниже — как согласовать домен, TLS и внутренний HTTP до Docker-стека.

## Разделение ролей

| Где | Что настраивается |
|-----|---------------------|
| **Интернет / DNS** | Имя **`bi.aeronavigator.ru`** должно указывать на хост, где слушает **внешний** nginx сисадмина (или на балансировщик перед ним). |
| **Внешний nginx (сисадмин)** | Сертификаты для **`https://bi.aeronavigator.ru`**, `listen 443`, `server_name bi.aeronavigator.ru`, `proxy_pass` на внутренний HTTP-адрес сервера с YDL. |
| **Сервер YDL (Docker, этот репозиторий)** | Только **`http://<IP>:80/`** — контейнер **`ydl-os-nginx`** и **`nginx/nginx-edge-proxy.conf`**. Сертификаты на этот хост **не кладём** и пути к `.pem` **не задаём**. |

## Порты (не путать с AW)

- **YDL в проде:** на хост публикуется **TCP 80** (см. `docker-compose.production.yaml`). Это не порт **8088** (исторический AW) и не обязательный **443** на самом BI-хосте.
- Внутри сети Docker контейнер **UI** слушает **8080**; до него извне идёт только **`ydl-os-nginx`**.

## Проверка доступности

- С сервера YDL: **`curl -I http://127.0.0.1:80`** и **`curl -I http://127.0.0.1:80/auth/signin`** → **200** означает, что стек и edge-nginx в порядке.
- **`https://bi.aeronavigator.ru`** зависит от **внешнего** nginx: при **502** с его версией в подписи — см. раздел ниже; до исправления `proxy_pass` на **`http://<IP-YDL>:80`** с внешней машины сайт не заработает, даже если локально всё **200**.

## Цепочка запроса

1. Пользователь в браузере → **`https://bi.aeronavigator.ru`** (TLS на стороне сисадмина).
2. Внешний nginx → **`http://<IP-сервера-YDL>:80/`** (пример: `192.168.201.40`).
3. **`ydl-os-nginx`** → **`http://ui:8080`** (контейнер UI внутри Docker).

Обязательно: внешний nginx передаёт **`X-Forwarded-Proto: https`**, чтобы YDL корректно строил редиректы и OIDC.

## 502 Bad Gateway при рабочем замке в браузере

Если в адресной строке **`https://bi.aeronavigator.ru`**, TLS есть, а страница показывает **502** и подпись **`nginx/1.xx`** — отвечает **внешний** nginx. Он принял HTTPS, но **не смог получить ответ от upstream** (до YDL не достучался).

На сервере YDL при этом часто всё здорово. Проверка с BI-хоста:

```bash
curl -I http://127.0.0.1:80
```

Ожидается **HTTP/1.1 200 OK** (через `ydl-os-nginx` → UI).

Что проверить сисадмину **на машине, где крутится внешний nginx**:

1. **Адрес и порт upstream** — для текущего стека YDL нужно **`http://<IP-YDL>:80/`**, а не старый порт **8088** (AW) и не **443** на BI-сервере, если там нет TLS.
2. **Сеть и firewall** — с хоста внешнего nginx: `curl -I http://192.168.201.40:80` (подставьте актуальный IP). Должен быть **200**. Если таймаут или отказ — правила firewall/VLAN между nginx и BI.
3. **Один и тот же IP** — DNS `bi.aeronavigator.ru` должен указывать на хост **внешнего** nginx; до BI-сервера тот ходит **по внутренней сети** на `192.168.201.40:80` (или как у вас заведено).

Итог: **502 почти никогда не чинится на сервере Docker YDL**, если `curl http://127.0.0.1:80` там уже даёт 200 — правят **proxy_pass / сеть** на стороне внешнего nginx.

## Шаблон для сисадмина (TLS только здесь)

Пути к сертификатам — на **его** сервере, не на хосте YDL:

```nginx
server {
    listen 443 ssl http2;
    server_name bi.aeronavigator.ru;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://192.168.201.40:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_connect_timeout 360s;
        proxy_send_timeout 360s;
        proxy_read_timeout 360s;
    }
}
```

Замените `192.168.201.40` на актуальный IP или внутреннее имя сервера с Docker-стеком YDL.

## Проверки

1. На сервере YDL: `curl -I http://127.0.0.1:80` → **200**.
2. С хоста внешнего nginx: `curl -I http://<IP-YDL>:80` → **200**.
3. Из интернета: `curl -I https://bi.aeronavigator.ru` → **200**.

Если **`https://bi.aeronavigator.ru`** не открывается — смотреть DNS, firewall и конфиг **внешнего** nginx, а не наличие ключей на сервере YDL.

## OIDC (Keycloak и т.п.)

В `.env` указываются issuer, client, secret и публичный URL, который видит браузер (часто с **`https://bi.aeronavigator.ru`** — см. README форка). TLS для этого имени обеспечивает внешний nginx.
