(function () {
    'use strict';
    var TAB_BRIDGE_RE =
        /tabs:outgoing\.message\.ready|no\s+listener:\s*tabs:outgoing\.message\.ready/i;

    function isTabBridgeNoise(value) {
        if (value == null) {
            return false;
        }
        if (typeof value === 'string') {
            return TAB_BRIDGE_RE.test(value);
        }
        var message = '';
        if (typeof value === 'object') {
            message = String(value.message || value.stack || value);
        } else {
            message = String(value);
        }
        return TAB_BRIDGE_RE.test(message);
    }

    function suppressRejection(event) {
        if (isTabBridgeNoise(event.reason)) {
            event.preventDefault();
            if (event.stopImmediatePropagation) {
                event.stopImmediatePropagation();
            }
        }
    }

    function suppressError(event) {
        if (isTabBridgeNoise(event.error) || isTabBridgeNoise(event.message)) {
            event.preventDefault();
            if (event.stopImmediatePropagation) {
                event.stopImmediatePropagation();
            }
            return true;
        }
        return false;
    }

    window.addEventListener('unhandledrejection', suppressRejection, true);
    window.addEventListener('error', suppressError, true);

    if (typeof console !== 'undefined' && typeof console.error === 'function') {
        var nativeConsoleError = console.error.bind(console);
        console.error = function () {
            var text = '';
            for (var i = 0; i < arguments.length; i++) {
                text += (i ? ' ' : '') + String(arguments[i]);
            }
            if (TAB_BRIDGE_RE.test(text)) {
                return;
            }
            for (i = 0; i < arguments.length; i++) {
                if (isTabBridgeNoise(arguments[i])) {
                    return;
                }
            }
            return nativeConsoleError.apply(console, arguments);
        };
    }
})();
