import {createStore, combineReducers} from 'redux';
import set from 'lodash/set';
import has from 'lodash/has';

let original_store = {};
let combine = combineReducers;

export function combineReducersRecurse(reducers) {
    // If this is a leaf or already combined.
    if (typeof reducers === 'function') {
        return reducers;
    }

    // If this is an object of functions, combine reducers.
    if (typeof reducers === 'object') {
        let combinedReducers = {};
        const keys = Object.keys(reducers);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            combinedReducers[key] = combineReducersRecurse(reducers[key]);
        }
        return combine(combinedReducers);
    }

    // If we get here we have an invalid item in the reducer path.
    throw new Error({
        message: 'Invalid item in reducer tree',
        item: reducers
    });
}

export function createInjectStore(initialReducers, ...args) {
    // If last item is an object, it is overrides.
    if (typeof args[args.length - 1] === 'object') {
        const overrides = args.pop();
        // Allow overriding the combineReducers function such as with redux-immutable.
        if (Object.prototype.hasOwnProperty.call(overrides, 'combineReducers') && typeof overrides.combineReducers === 'function') {
            combine = overrides.combineReducers;
        }
    }

    original_store = createStore(
        combineReducersRecurse(initialReducers),
        ...args
    );

    original_store.injectedReducers = initialReducers;

    return original_store;
}

export function reloadReducer(key, reducer, store = original_store) {
    store.replaceReducer(combineReducersRecurse({...store.injectedReducers, [key]: reducer}));
}

export function injectReducer(key, reducer, force = false, store = original_store) {

    // If already set, do nothing.
    if (!has(store.injectedReducers, key) || force) {
        set(store.injectedReducers, key, reducer);
        store.replaceReducer(combineReducersRecurse(store.injectedReducers));
    }
}

export function injectReducerBulk(reducers, force = false, store = original_store) {

    let update = false;
    reducers.forEach(x => {
        // If already set, do nothing.
        if (!has(store.injectedReducers, x.key) || force) {
            set(store.injectedReducers, x.key, x.reducer);
            update = true;
        }
    });

    if (update) {
        store.replaceReducer(combineReducersRecurse(store.injectedReducers));
    }

}
