import { Fiber } from "./fiber";
import { HookFlags } from "./flags";
import { Lane, Lanes, NoLanes, SyncLane } from "./lane";
import { scheduleUpdateOnFiber } from "./workLoop";

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
  lanes: Lanes;
  dispatch: any;
};

export interface Hook {
  memoizedState: any;
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
let currentlyRenderingFiber: Fiber;
let currentHook: Hook | null = null;

let ReactCurrentDispatcher: any = {
  current: null,
};

// 挂载hook
const mountWorkInProgressHook = (): Hook => {
  const hook: Hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
  if (!workInProgressHook) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
};

// 更新hook
// 整体上来说就是先获取nextCurrentHook+nextWorkInProgressHook，然后赋值给当前的hook
// 简化版
function updateWorkInProgressHook(): Hook {
  const current = currentlyRenderingFiber.alternate;

  currentHook = currentHook ? currentHook.next : current?.memoizedState;
  workInProgressHook = workInProgressHook
    ? workInProgressHook.next
    : currentlyRenderingFiber.memoizedState;

  return workInProgressHook;
}

// 比较核心的功能，主要是让hooks触发fiber的更新
// 简化版
function dispatchAction<S, A>(fiber: Fiber, queue: any, action: A) {
  const update = {
    lane: SyncLane,
    action,
    next: null,
  };

  queue.pending = update;

  scheduleUpdateOnFiber(fiber);
}

const mountEffect = () => {};

// 挂载reducer
const mountReducer = <S, I, A>(
  reducer: (state: S, action: A) => S,
  initialArg: I,
  init?: (value: I) => S
) => {
  const hook = mountWorkInProgressHook();
  const initialState = init ? init(initialArg) : initialArg;
  hook.memoizedState = initialState;

  const queue = (hook.queue = {
    pending: null,
    lanes: NoLanes,
    dispatch: null,
  });

  const dispatch = (queue.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [hook.memoizedState, dispatch];
};

function basicStateReducer<S>(state: S, action: any): S {
  return typeof action === "function" ? action(state) : action;
}

const mountState = <S>(initialState: (() => S) | S) => {
  const hook = mountWorkInProgressHook();

  if (typeof initialState === "function") {
    initialState = initialState();
  }

  hook.memoizedState = initialState;
  const queue = (hook.queue = {
    pending: null,
    lanes: NoLanes,
    dispatch: null,
  });
  const dispatch = (queue.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [hook.memoizedState, dispatch];
};

const updateEffect = () => {};
const updateReducer = <S, I, A>(
  reducer: (state: S, action: A) => S,
  initialArg: I,
  init?: (value: I) => S
) => {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  const update = queue.pending;

  let newState = currentHook?.memoizedState;

  if (update) {
    const action = update.action;
    newState = reducer(newState, action);

    hook.memoizedState = newState;
  }

  const dispatch = queue.dispatch;
  return [hook.memoizedState, dispatch];
};
const updateState = <S>(initialState: (() => S) | S) => {
  return updateReducer(basicStateReducer, initialState);
};

const HooksDispatcherOnMount = {
  useEffect: mountEffect,
  useReducer: mountReducer,
  useState: mountState,
};

const HooksDispatcherOnUpdate = {
  useEffect: updateEffect,

  useReducer: updateReducer,
  useState: updateState,
};

ReactCurrentDispatcher.current = HooksDispatcherOnMount;

export const renderWithHooks = (fiber: Fiber) => {
  workInProgress = fiber;
  const { alternate: current } = fiber;
  currentlyRenderingFiber = workInProgress;

  workInProgress.lanes = NoLanes;

  ReactCurrentDispatcher.current =
    !current || !current?.memoizedState
      ? HooksDispatcherOnMount
      : HooksDispatcherOnUpdate;

  const component = workInProgress.type as Function;
  let children = component(workInProgress.pendingProps);

  currentlyRenderingFiber = null;
  currentHook = null;
  workInProgressHook = null;

  return children;
};

const resolveDispatcher = () => {
  return ReactCurrentDispatcher.current;
};

export const useState = <S>(initialState: (() => S) | S) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
};

export const useReducer = <S, I, A>(
  reducer: (value: S, value2: A) => S,
  initialArg: I,
  init?: (value: I) => S
): [S, any] => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
};

export const useEffect = (create: any, deps: any) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
};
