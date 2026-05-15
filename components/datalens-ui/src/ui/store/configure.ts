import type {Store, AnyAction} from 'redux';
import {createStore, applyMiddleware, combineReducers, compose} from 'redux';
import thunk from 'redux-thunk';
import {createLogger} from 'redux-logger';
import {reducerRegistry} from './reducer-registry';
import type {DatalensGlobalState} from '../';
import {editHistoryDsMiddleware} from '../units/datasets/store/edit-history-middleware';

let store: Store<DatalensGlobalState, AnyAction>;

function sanitizeDeferredDomNodes(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
    if (depth > 4 || value === null || value === undefined) {
        return value;
    }

    if (typeof Node !== 'undefined' && value instanceof Node) {
        return `[DOMNode:${value.nodeName}]`;
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeDeferredDomNodes(item, depth + 1, seen));
    }

    if (typeof value === 'object') {
        if (seen.has(value as object)) {
            return '[Circular]';
        }
        seen.add(value as object);

        const record = value as Record<string, unknown>;
        return Object.keys(record).reduce<Record<string, unknown>>((acc, key) => {
            acc[key] = sanitizeDeferredDomNodes(record[key], depth + 1, seen);
            return acc;
        }, {});
    }

    return value;
}

function configureStore(services: unknown = {}) {
    const middlewares = [thunk.withExtraArgument(services), editHistoryDsMiddleware];

    let composeEnhancers = compose;

    if (process.env.NODE_ENV !== 'production') {
        const enableReduxLogger = process.env.ENABLE_REDUX_LOGGER === 'true';
        if (enableReduxLogger) {
            const logger = createLogger({
                collapsed: true,
                actionTransformer: (action) => sanitizeDeferredDomNodes(action) as AnyAction,
                stateTransformer: (state) => sanitizeDeferredDomNodes(state) as DatalensGlobalState,
            });

            middlewares.push(logger);
        }

        if (typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
            composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
        }
    }

    middlewares.forEach((mw) => reducerRegistry.registerMiddleware(mw));

    const newStore = createStore(
        combineReducers(reducerRegistry.getReducers()),
        composeEnhancers(applyMiddleware(reducerRegistry.getMiddlewares())),
    );

    reducerRegistry.setChangeListener(() => {
        newStore.replaceReducer(combineReducers(reducerRegistry.getReducers()));
    });

    return newStore;
}

export const getStore = (services: unknown = {}) => {
    if (!store) {
        store = configureStore(services) as Store<DatalensGlobalState, AnyAction>;
    }

    return store;
};
