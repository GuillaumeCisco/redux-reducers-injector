# redux-reducers-injector
Allows dynamically injecting reducers into a redux store at runtime.
Compatible with HMR (Hot Module Replacement/Hot Reload) and SSR (Server Side Rendering).

Based on the work of randallknutson/redux-injector.

Typically when creating a redux data store, all reducers are combined and then passed to the ```createStore``` function. However, this doesn't allow adding additional reducers later which can be lazy loaded or added by plugin modules. This module changes the creation of the redux store to pass in an object of reducer functions (recursively!) that are then dynamically combined. Adding a new reducer is then done with ```injectReducer``` at any time.

## Installation
Install ```redux-reducers-injector``` via npm or yarn.

```bash
npm install --save redux-reducers-injector
```
or
```bash
yarn add redux-reducers-injector
```

Then with a module bundler like webpack that supports either CommonJS or ES2015 modules, use as you would anything else:
 
 ```javascript
 // using an ES6 transpiler, like babel
 import { createInjectStore } from 'redux-reducers-injector';
 
 // not using an ES6 transpiler
 var createInjectStore = require('redux-reducers-injector').createInjectStore;
 ```


## Create Inject Store
There are two parts for using reducer injection.

### 1. DO NOT COMBINE reducers!
Typically reducers are combined using `combineReducers` up a tree to a single reducer function that is then passed to the createStore function. DO NOT DO THIS! Instead, create the exact same object tree but without combine reducers. For example:
 
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

### 2. Use `createInjectStore` instead of `createStore`
Pass the uncombined reducer tree to ```createInjectStore``` along with any other arguments you would usually pass to ```createStore```. This wraps and passes the arguments and results to ```createStore```. 

```javascript
import { createInjectStore } from 'redux-reducers-injector';

let store = createInjectStore(
  reducersObject,
  initialState
); 
```

## Injecting a new reducer
For any store created using react-reducers-injector, simply use ```injectReducer``` to add a new reducer.

```javascript
import { injectReducer } from 'redux-reducers-injector';

injectReducer('date.form', formReducerFunction);
```

The injector uses lodash.set so any paths that are supported by it can be used and any missing object will be created.  
You can pass an extra parameter `force` to true for forcing the reinjection of the reducer.  
And a one last parameter `store` for defining a context store, useful in SSR environment for supporting concurrent call.

## Injecting reducers in bulk

You can add multiple reducers at once:
```javascript
import {injectReducerBulk} from 'redux-reducers-injector';

const reducers = [
    {key: 'date.form', reducer: formReducerFunction},
    {key: 'foo.bar', reducer: BarReducerFunction},
];
injectReducerBulk(reducers);
```

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

When you receive multiple calls simultaneously (concurrent calls) and you render your react application, this reference to the store can be overwritten leading to javascript errors. 
Typically, the injected reducers won't be found.

Fortunately, you can pass your context store to the `reloadReducer`, `injectReducer` and `injectReducerBulk` methods for solving this issue.

Example, if you are using the excellent [react-universal-component](https://github.com/faceyspacey/react-universal-component) library, you just have to write:

```javascript
import universal from 'react-universal-component';
import {injectReducer} from 'redux-reducers-injector';

const MyComponent = universal(import(`./my_component`), {
        onLoad: (module, info, props, context) => {
            injectReducer('my-reducer-key', module.reducer, false, context.store);
        },
    });
```

You now have a bulletproof store injection :rocket:

## React Redux >= 6.0.0

From `react-redux@6.0.0`, there is a huge breaking change regarding the context store.
After injecting the reducer, it will not be reflected in the `mapStateToProps` method of the `connect` method from redux.
You need to decorate your connected component for explicitly updating the context store with the new injected reducer.   
For this, you can use this HOC:
``` javascript
import React, {Component} from 'react';
import {ReactReduxContext} from 'react-redux';

export default function withInjectedReducers(WrappedComponent) {
    class WithInjectedReducers extends Component {
        constructor(...args) {
            super(...args);
            this.firstRender = true;
        }

        render() {
            if (this.firstRender) {
                this.firstRender = false;
                return (
                    <ReactReduxContext.Consumer>
                        {reduxContext => (
                            <ReactReduxContext.Provider
                                value={{
                                    ...reduxContext,
                                    storeState: reduxContext.store.getState(),
                                }}
                            >
                                <WrappedComponent {...this.props} />
                            </ReactReduxContext.Provider>
                        )}
                    </ReactReduxContext.Consumer>
                );
            }
            return <WrappedComponent {...this.props} />;
        }
    }

    return WithInjectedReducers;
}

```
Use it like:
```javascript
import React from 'react';
import {connect} from 'redux';
import withInjectedReducers from './withInjectedReducers';

export reducer from './myReducerToInjectDynamically';

const MyComponent = () => {
    const {title} = this.props;
    
    return <h1>{title}</h1>;
}

const mapStateToProps = state => {
    return {
        title: state.injectedReducer.title
    };
};

export default withInjectedReducers(connect(mapStateToProps)(MyComponent));
```

This piece of code is not included in this project as it uses `react` and `react-redux` dependencies. 
Feel free to use it.


If you are using `redux-reducers-injector` with `react-universal-component`, the `onLoad` method will no more populate the context as the fourth parameter.  
As explained above the context store is needed for avoiding issues in an SSR environment with concurrent calls.  
You need to pass the context yourself:


```javascript
import React, {Component} from 'react';
import universal from 'react-universal-component';
import {injectReducer} from 'redux-reducers-injector';
import {ReactReduxContext} from 'react-redux';

class Universal extends Component {

    render() {
        const U = universal(import('./myComponent'), {
            onLoad: (module, info, {reduxcontext}) => {
                if (reduxcontext && reduxcontext.store) {
                    injectReducer('injectedReducer', module.reducer, false, reduxcontext.store);
                }
            },
        });

        return (
            <ReactReduxContext.Consumer>
                {reduxContext => <U reduxcontext={reduxContext} />}
            </ReactReduxContext.Consumer>);
    }
}

export default Universal;
```

And if you have `react-hot-loader` installed or another HMR library, you need to add a little more abstraction:
```javascript
import React, {Component} from 'react';
import universal from 'react-universal-component';
import {injectReducer} from 'redux-reducers-injector';
import {ReactReduxContext} from 'react-redux';

class Universal extends Component {
    constructor(props) {
        super(props);
        this.firstRender = true;
    }

    render() {
        const U = universal(import(`./myComponent`), {
            onLoad: (module, info, {reduxcontext}) => {
                if (reduxcontext && reduxcontext.store) {
                    injectReducer('injectedReducer', module.reducer, false, reduxcontext.store);
                }
            },
        });

        if (this.firstRender) {
            this.firstRender = false;
            return (
                <ReactReduxContext.Consumer>
                    {reduxContext => <U reduxcontext={reduxContext} />}
                </ReactReduxContext.Consumer>);
        }

        return <U />;
    }
}

export default Universal;
```

You are now ready to support `react-redux@6.0.0` with the new Context API.


## Immutable.js
React Reducer Injector by default uses ```combineReducers``` from redux. However, if you are using immutable.js for your states, you need to use  ```combineReducers``` from ```redux-immutable```. To do this, pass in an override at the end of the arguments with the ```combineReducers``` function.

```javascript
import { createInjectStore } from 'redux-reducers-injector';
import { combineReducers } from 'redux-immutable';

let store = createInjectStore(
  reducersObject,
  initialState,
  { combineReducers }
); 
```

## TypeScript
React Reducer Injector provides TypeScript definitions.
Some of the types require `typescript@^4.1` in order to work properly.

```typescript
const rootReducerObject = { foo: { bar: (state: number, _action) => state } }
const store = createInjectStore(rootReducerObject /* ... */)
type AppState = StateFromDeepReducersMapObject<typeof rootReducerObject>

// ... dynamically loaded module
const moduleReducer = (state: string, _action) => state
injectReducer('baz.quz', moduleReducer)
type ModuleState = StateShapeFromReducerPath<'baz.quz', typeof moduleReducer>

// ... with its selectors that are capable of accessing available state
type AvailableState = AppState & ModuleState
const getBarQuz = (state: AvailableState) => `${state.foo.bar} ${state.baz.quz}`
```