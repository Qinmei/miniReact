import { scheduleUpdateOnFiber } from "./workLoop";
import { Fiber } from "./fiber";
import { HookFlags } from "./flags";
import { Lane, Lanes } from "./lane";

type Update = {
  lane: Lane;
  action: any;
  eagerReducer: any;
  eagerState: any;
  next: Update;
  priority?: number;
};

export type UpdateQueue = {
  pending: Update | null;
  interleaved: Update | null;
  lanes: Lanes;
  dispatch: any;
  lastRenderedReducer: any;
  lastRenderedState: any;
};

export interface Hook {
  memoizedState: any;
  baseState: any;
  baseQueue: Update | null;
  queue: UpdateQueue | null;
  next: Hook | null;
}

export interface Effect {
  tag: HookFlags;
  create: () => (() => void) | void;
  destroy: (() => void) | void;
  deps: Array<any> | null;
  next: Effect;
}

let workInProgressHook: Hook | null;
let workInProgress: Fiber | null;

export const renderWithHooks = (fiber: Fiber) => {
  workInProgress = fiber;
  workInProgressHook = workInProgress.hooks;

  const component = workInProgress.type as Function;
  const children = component(workInProgress.pendingProps);

  workInProgressHook = null;

  return children;
};

export const createWorkInProgressHook = () => {
  return {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
};

export const getWorkInProgressHook = () => {
  if (!workInProgressHook) {
    workInProgressHook = createWorkInProgressHook();
    workInProgress.hooks = workInProgressHook;
  } else {
    const nextWorkInProgressHook = workInProgressHook.next;
    if (nextWorkInProgressHook) {
      workInProgressHook = nextWorkInProgressHook;
    } else {
      workInProgressHook = workInProgressHook.next = createWorkInProgressHook();
    }
  }

  return workInProgressHook;
};

export const useReducer = <S, A>(
  reducer: (arg0: S, arg1: A) => S,
  initialState: S
) => {
  const hook = getWorkInProgressHook();
  hook.memoizedState = hook.memoizedState || initialState;

  const dispatch = dispatchAction.bind(null, workInProgress, hook, reducer);
  return [hook.memoizedState, dispatch];
};

export const dispatchAction = (
  workInProgress: Fiber | null,
  hook: Hook,
  reducer: any,
  action: any
) => {
  const memoizedState = hook.memoizedState;
  const newState = reducer(memoizedState, action);
  hook.memoizedState = newState;
  workInProgress && scheduleUpdateOnFiber(workInProgress);
};

const basicStateReducer = (state: any, action: any) => {
  return typeof action === "function" ? action(state) : action;
};

export const useState = (initialState: any) => {
  return useReducer(basicStateReducer, initialState);
};
