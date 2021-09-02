import type {
	AnyAction,
	Reducer,
	StoreEnhancer,
	PreloadedState,
	Store as ReduxStore,
} from 'redux'

export type ReducerDeepMapObject<S, A extends AnyAction> = {
	[key: string]: ReducerDeepMapObject<S, A> | Reducer<S, A>
}

/**
 * Get State type computed from the reducer object that is used in e.g. in `createInjectStore`
 */
export type StateFromDeepReducersMapObject<M extends ReducerDeepMapObject<any, any>> = {
	[P in keyof M]: M[P] extends Reducer<infer S, any>
		? S
		: M[P] extends ReducerDeepMapObject<any, any> ? StateFromDeepReducersMapObject<M[P]> : never
}

type Store<S, A extends AnyAction> = ReduxStore<S, A> & {
	injectedReducers: ReducerDeepMapObject<S, A>
}

/**
 * Compute State Shape based on string path
 * 
 * @example 
 * StateShapeFromPath<'foo.bar', number>
 * // returns type {foo: {bar: number}}
 */
export type StateShapeFromPath<
	PATH extends string,
	T
> = PATH extends `${infer PATH_LEFT_PART}.${infer PATH_RIGHT_PART}`
	? StateShapeFromPath<PATH_LEFT_PART, StateShapeFromPath<PATH_RIGHT_PART, T>>
	: { [key in PATH]: T }

/**
 * Compute State Shape based on string path and 
 * the Reducer that is injected on that path
 */
export type StateShapeFromReducerPath<
	PATH extends string,
	T extends Reducer
> = StateShapeFromPath<PATH, ReturnType<T>>

/**
 * A store creator is a function that creates a Redux store. Like with
 * dispatching function, we must distinguish the base store creator,
 * `createStore(reducer, preloadedState)` exported from the Redux package, from
 * store creators that are returned from the store enhancers.
 *
 * @template S The type of state to be held by the store.
 * @template A The type of actions which may be dispatched.
 * @template Ext Store extension that is mixed in to the Store type.
 * @template StateExt State extension that is mixed into the state type.
 */
export interface StoreCreator {
	<S, A extends AnyAction, Ext, StateExt>(
		reducer: ReducerDeepMapObject<S, A>,
		enhancer?: StoreEnhancer<Ext, StateExt>
	): Store<S & StateExt, A> & Ext
	<S, A  extends AnyAction, Ext, StateExt>(
		reducer: ReducerDeepMapObject<S, A>,
		preloadedState?: PreloadedState<S>,
		enhancer?: StoreEnhancer<Ext, StateExt>
	): Store<S & StateExt, A> & Ext
}

export const createInjectStore: StoreCreator
export const injectReducer: (
	key: string,
	reducer: Reducer<any, any> | ReducerDeepMapObject<any, any>,
	force?: boolean,
	store?: Store<any, any>
) => void

export const combineReducersRecurse: <S = any, A  extends AnyAction = any>(
	reducers: Reducer<S, A> | ReducerDeepMapObject<S, A>
) => Reducer<S, A>

export const reloadReducer: (
	key: string,
	reducer: Reducer<any, any> | ReducerDeepMapObject<any, any>,
	store?: Store<any, any>
) => void

export const injectReducerBulk: (
	reducer: {
		key: string
		reducer: Reducer<any, any> | ReducerDeepMapObject<any, any>
	}[],
	force?: boolean,
	store?: Store<any, any>
) => void
