/**
 * Chrome периодически генерирует ResizeObserver warning как window.error.
 * В dev @rspack/plugin-react-refresh показывает из этого полноэкранный runtime overlay — без реальной поломки приложения.
 * @see https://issues.chromium.org/issues/40893134
 */
export function suppressResizeObserverLoopDevNoise(): void {
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
        return;
    }

    const re =
        /ResizeObserver loop limit exceeded|ResizeObserver loop completed with undelivered notifications/;

    window.addEventListener(
        'error',
        (event) => {
            if (typeof event.message === 'string' && re.test(event.message)) {
                event.stopImmediatePropagation();
            }
        },
        true,
    );
}

/**
 * Расширения Chrome (chrome.tabs / postMessage) иногда кидают `Uncaught (in promise) No Listener: tabs:…`
 * — это не код приложения; глушим только узнаваемый шаблон, чтобы не засорять консоль и overlay.
 */
export function suppressExtensionTabMessagingUnhandledRejection(): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        const msg =
            typeof reason === 'object' && reason !== null && 'message' in reason
                ? String((reason as {message?: unknown}).message ?? '')
                : String(reason ?? '');
        const low = msg.toLowerCase();
        if (
            low.includes('tabs:outgoing.message.ready') ||
            (low.includes('no listener') && low.includes('tabs:outgoing'))
        ) {
            event.preventDefault();
        }
    });
}
