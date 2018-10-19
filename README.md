# redux-reducers-injector
Allows dynamically injecting reducers into a redux store at runtime.
Compatible with HMR and SSR.

Based on the work of randallknutson/redux-injector.

Typically when creating a redux data store all reducers are combined and then passed to the ```createStore``` function. However, this doesn't allow adding additional reducers later which can be lazy loaded or added by plugin modules. This module changes the creation of the redux store to pass in an object of reducer functions (recursively!) that are then dynamically combined. Adding a new reducer is then done with ```injectReducer``` at any time.

## Installation
Install ```redux-reducers-injector``` via npm.

```javascript
npm install --save redux-reducers-injector
```

Then with a module bundler like webpack that supports either CommonJS or ES2015 modules, use as you would anything else:
 
 ```javascript
 // using an ES6 transpiler, like babel
 import { createInjectStore } from 'redux-reducers-injector';
 
 // not using an ES6 transpiler
 var createInjectStore = require('redux-reducers-injector').createInjectStore;
 ```


## Create Inject Store
There are two parts to using redux injector.

### 1. DO NOT COMBINE reducers!
Typically reducers are combined using ```combineReducers`` up a tree to a single reducer function that is then passed to the createStore function. DO NOT DO THIS! Instead, create the exact same object tree but without combine reducers. For example:
 
 ```javascript
 let reducersObject = {
   router: routerReducerFunction,
   data: {
     user: userReducerFunction,
     auth: {
       loggedIn: loggedInReducerFunction,
       loggedOut: loggedOutReducerFunction
     },
     info: infoReducerFunction
   }
 };
 ```
 
If you do have combined reducers it is still possible to pass them to createInjectReducers but you cannot then inject into any previously combined reducers.

### 2. Use ```createInjectStore``` instead of ```createStore```
Pass the uncombined reducer tree to ```createInjectStore``` along with any other arguments you would usually pass to ```createStore```. This wraps and passes the arguments and results to ```createStore```. 

```javascript
import { createInjectStore } from 'redux-reducers-injector';

let store = createInjectStore(
  reducersObject,
  initialState
); 
```

## Injecting a new reducer.
For any store created using redux-injector, simply use ```injectReducer``` to add a new reducer.

```javascript
import { injectReducer } from 'redux-reducers-injector';

injectReducer('date.form', formReducerFunction);
```

The injector uses lodash.set so any paths that are supported by it can be used and any missing objects will be created.
You can pass an extra paramater `force` to true for forcing the reinjection of the reducer

## Reloading a reducer
For HMR purpose, it is possible to reload a reducer with ```reloadReducer```:
```javascript
import { reloadReducer } from 'redux-reducers-injector';

if (module.hot) {
        module.hot.accept('./reducer', () => {
            const formReducerFunction = require('./reducer').default;
            reloadReducer('date.form', formReducerFunction)
            // same as:
            // injectReducer('date.form', formReducerFunction, true);
        });
    }
```

## :warning: 

If you use Server Side Rendering for your project, you will have a node server.
The implementation of this project use a reference to the store in its scope.

When you receive multiple calls simultaneously and you render your react application, this reference to the store can be overwritten leading to javsacript errors. 
Typically, the injected reducers won't be found.

Fortunately, you can pass your context store to the `reloadReducer` and `injectReducer` methods for solving this issue.

Example, if you are using the excellent [react-universal-component](https://github.com/faceyspacey/react-universal-component) library, you just have to write:

```javascript
import universal from 'react-universal-component';
import {injectReducer} from 'redux-reducers-injector';

const MyComponent = universal(import(`./my_component`), {
        onLoad: (module, info, props, context) => {
            injectReducer(model, module.reducer, false, context.store);
        },
    });
```

You now have a bulletproof store injection :rocket:

## Immutable.js
Redux Injector by default uses ```combineReducers``` from redux. However, if you are using immutable.js for your states, you need to use  ```combineReducers``` from ```redux-immutable```. To do this, pass in an override at the end of the arguments with the ```combineReducers``` function.

```javascript
import { createInjectStore } from 'redux-reducers-injector';
import { combineReducers } from 'redux-immutable';

let store = createInjectStore(
  reducersObject,
  initialState,
  { combineReducers }
); 
```