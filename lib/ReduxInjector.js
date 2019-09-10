"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combineReducersRecurse = combineReducersRecurse;
exports.createInjectStore = createInjectStore;
exports.reloadReducer = reloadReducer;
exports.injectReducer = injectReducer;

var _redux = require("redux");

var _set = _interopRequireDefault(require("lodash/set"));

var _has = _interopRequireDefault(require("lodash/has"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var original_store = {};
var combine = _redux.combineReducers;

function combineReducersRecurse(reducers) {
  // If this is a leaf or already combined.
  if (typeof reducers === 'function') {
    return reducers;
  } // If this is an object of functions, combine reducers.


  if (_typeof(reducers) === 'object') {
    var combinedReducers = {};
    var keys = Object.keys(reducers);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      combinedReducers[key] = combineReducersRecurse(reducers[key]);
    }

    return combine(combinedReducers);
  } // If we get here we have an invalid item in the reducer path.


  throw new Error({
    message: 'Invalid item in reducer tree',
    item: reducers
  });
}

function createInjectStore(initialReducers) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  // If last item is an object, it is overrides.
  if (_typeof(args[args.length - 1]) === 'object') {
    var overrides = args.pop(); // Allow overriding the combineReducers function such as with redux-immutable.

    if (Object.prototype.hasOwnProperty.call(overrides, 'combineReducers') && typeof overrides.combineReducers === 'function') {
      combine = overrides.combineReducers;
    }
  }

  original_store = _redux.createStore.apply(void 0, [combineReducersRecurse(initialReducers)].concat(args));
  original_store.injectedReducers = initialReducers;
  return original_store;
}

function reloadReducer(key, reducer) {
  var store = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : original_store;
  store.replaceReducer(combineReducersRecurse(_objectSpread({}, store.injectedReducers, _defineProperty({}, key, reducer))));
}

function injectReducer(key, reducer) {
  var force = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var store = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : original_store;

  // If already set, do nothing.
  if (!(0, _has["default"])(store.injectedReducers, key) || force) {
    (0, _set["default"])(store.injectedReducers, key, reducer);
    store.replaceReducer(combineReducersRecurse(store.injectedReducers));
  }
}