# Стратегия: сначала платформа, PR — в конце

**Приоритет 1:** рабочий, проверенный «монстр» на базе official OSS + overlay.  
**Приоритет 2:** безболезненные обновления (`vendor` + `publish-ui-overlay-dist` + profiles).  
**Приоритет 3:** PR в datalens-tech — **после** staging, пакетами, для уменьшения overlay.

PR не блокирует вашу инсталляцию: всё нужное может жить в YDLOS до merge upstream.

См. [gap-closure-tracker.md](gap-closure-tracker.md), [DataLens-editions-matrix.md](DataLens-editions-matrix.md).
