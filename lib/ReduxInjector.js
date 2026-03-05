"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combineReducersRecurse = combineReducersRecurse;
exports.createInjectStore = createInjectStore;
exports.injectReducer = injectReducer;
exports.injectReducerBulk = injectReducerBulk;
exports.reloadReducer = reloadReducer;
var _redux = require("redux");
var _set = _interopRequireDefault(require("lodash/set"));
var _has = _interopRequireDefault(require("lodash/has"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var original_store = {};
var combine = _redux.combineReducers;
function combineReducersRecurse(reducers) {
  // If this is a leaf or already combined.
  if (typeof reducers === 'function') {
    return reducers;
  }

  // If this is an object of functions, combine reducers.
  if (_typeof(reducers) === 'object') {
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
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  // If last item is an object, it is overrides.
  if (_typeof(args[args.length - 1]) === 'object') {
    var overrides = args.pop();
    // Allow overriding the combineReducers function such as with redux-immutable.
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
  store.replaceReducer(combineReducersRecurse(_objectSpread(_objectSpread({}, store.injectedReducers), {}, _defineProperty({}, key, reducer))));
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
function injectReducerBulk(reducers) {
  var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var store = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : original_store;
  var update = false;
  reducers.forEach(function (x) {
    // If already set, do nothing.
    if (!(0, _has["default"])(store.injectedReducers, x.key) || force) {
      (0, _set["default"])(store.injectedReducers, x.key, x.reducer);
      update = true;
    }
  });
  if (update) {
    store.replaceReducer(combineReducersRecurse(store.injectedReducers));
  }
}