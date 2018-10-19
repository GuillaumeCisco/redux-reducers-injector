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

var _set = require('lodash/set');

var _set2 = _interopRequireDefault(_set);

var _has = require('lodash/has');

var _has2 = _interopRequireDefault(_has);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
        var keys = Object.keys(reducers);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
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
    var store = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : store;

    store.replaceReducer(combineReducersRecurse(_extends({}, store.injectedReducers, _defineProperty({}, key, reducer))));
}

function injectReducer(key, reducer) {
    var force = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var store = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : store;


    // If already set, do nothing.
    if (!(0, _has2.default)(store.injectedReducers, key) || force) {
        (0, _set2.default)(store.injectedReducers, key, reducer);
        store.replaceReducer(combineReducersRecurse(store.injectedReducers));
    }
}