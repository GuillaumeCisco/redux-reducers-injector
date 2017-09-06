'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.combineReducersRecurse = combineReducersRecurse;
exports.createInjectStore = createInjectStore;
exports.reloadReducer = reloadReducer;
exports.injectReducer = injectReducer;

var _redux = require('redux');

var _lodash = require('lodash');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var store = {};
var combine = _redux.combineReducers;

function combineReducersRecurse(reducers) {
    // If this is a leaf or already combined.
    if (typeof reducers === 'function') {
        return reducers;
    }

    // If this is an object of functions, combine reducers.
    if ((typeof reducers === 'undefined' ? 'undefined' : _typeof(reducers)) === 'object') {
        var combinedReducers = {};
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = Object.keys(reducers)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var key = _step.value;

                combinedReducers[key] = combineReducersRecurse(reducers[key]);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return combine(combinedReducers);
    }

    // If we get here we have an invalid item in the reducer path.
    throw new Error({
        message: 'Invalid item in reducer tree',
        item: reducers
    });
}

function createInjectStore(initialReducers) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
    }

    // If last item is an object, it is overrides.
    if (_typeof(args[args.length - 1]) === 'object') {
        var overrides = args.pop();
        // Allow overriding the combineReducers function such as with redux-immutable.
        if (overrides.hasOwnProperty('combineReducers') && typeof overrides.combineReducers === 'function') {
            combine = overrides.combineReducers;
        }
    }

    store = _redux.createStore.apply(undefined, [combineReducersRecurse(initialReducers)].concat(args));

    store.injectedReducers = initialReducers;

    return store;
}

function reloadReducer(key, reducer) {
    store.replaceReducer(combineReducersRecurse(_extends({}, store.injectedReducers, _defineProperty({}, key, reducer))));
}

function injectReducer(key, reducer) {
    var force = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    // If already set, do nothing.
    if (!(0, _lodash.has)(store.injectedReducers, key) || force) {
        (0, _lodash.set)(store.injectedReducers, key, reducer);
        store.replaceReducer(combineReducersRecurse(store.injectedReducers));
    }
}