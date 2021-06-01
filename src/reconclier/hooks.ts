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
let currentlyRenderingFiber: Fiber;
let currentHook: Hook | null = null;

let ReactCurrentDispatcher: any = {
  current: null,
};

let didScheduleRenderPhaseUpdate: boolean = false;
let didScheduleRenderPhaseUpdateDuringThisPass: boolean = false;

// 挂载hook
const mountWorkInProgressHook = (): Hook => {
  // 先创建一个hook
  const hook: Hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
  // workInProgressHook不存在则直接设置为头
  if (!workInProgressHook) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 有的话就直接挂在workInProgressHook的后面
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
  // 创建更新对象
  const update = {
    lane: SyncLane,
    action,
    eagerReducer: null,
    eagerState: null,
    next: null,
  };

  // 获取下一个更新，同时将待更新的部分挂载到pending上面
  const pending = queue.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;

  // 开启更新
  scheduleUpdateOnFiber(fiber);
}

const mountEffect = () => {};

const mountReducer = <S, I, A>(
  reducer: (state: S, action: A) => S,
  initialArg: I,
  init?: (value: I) => S
) => {
  const hook = mountWorkInProgressHook();
  const initialState = init ? init(initialArg) : initialArg;
  hook.memoizedState = hook.baseState = initialState;

  const queue = (hook.queue = {
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: initialState,
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

  hook.memoizedState = hook.baseState = initialState;
  const queue = (hook.queue = {
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
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

  queue.lastRenderedReducer = reducer;

  const current: Hook = currentHook;

  let baseQueue = current.baseQueue;

  const pendingQueue = queue.pending;
  if (pendingQueue !== null) {
    if (baseQueue !== null) {
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }

    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  if (baseQueue !== null) {
    const first = baseQueue.next;
    let newState = current.baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    do {
      const updateLane = update.lane;

      if (newBaseQueueLast) {
        const clone = {
          lane: NoLanes,
          action: update.action,
          eagerReducer: update.eagerReducer,
          eagerState: update.eagerState,
          next: null,
        };
        newBaseQueueLast = newBaseQueueLast.next = clone;
      }

      if (update.eagerReducer === reducer) {
        newState = update.eagerState;
      } else {
        const action = update.action;
        newState = reducer(newState, action);
      }

      update = update.next;
    } while (update !== null && update !== first);

    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = newBaseQueueFirst;
    }

    if (newState !== hook.memoizedState) {
      // markWorkInProgressReceivedUpdate();
    }

    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;

    queue.lastRenderedState = newState;
  }

  const dispatch = queue.dispatch;
  return [hook.memoizedState, dispatch];
};
const updateState = <S>(initialState: (() => S) | S) => {
  return updateReducer(basicStateReducer, initialState);
};

const rerenderReducer = <S, I, A>(
  reducer: (state: S, action: A) => S,
  initialArg: I,
  init?: (value: I) => S
) => {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  queue.lastRenderedReducer = reducer;

  const dispatch = queue.dispatch;
  const lastRenderPhaseUpdate = queue.pending;
  let newState = hook.memoizedState;
  if (lastRenderPhaseUpdate !== null) {
    queue.pending = null;

    const firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
    let update = firstRenderPhaseUpdate;
    do {
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== firstRenderPhaseUpdate);

    hook.memoizedState = newState;

    if (hook.baseQueue === null) {
      hook.baseState = newState;
    }

    queue.lastRenderedState = newState;
  }
  return [newState, dispatch];
};
const rerenderState = <S>(initialState: (() => S) | S) => {
  return rerenderReducer(basicStateReducer, initialState);
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

const HooksDispatcherOnRerender = {
  useEffect: updateEffect,
  useReducer: rerenderReducer,
  useState: rerenderState,
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

  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    let numberOfReRenders: number = 0;
    do {
      didScheduleRenderPhaseUpdateDuringThisPass = false;
      numberOfReRenders += 1;

      if (numberOfReRenders >= 50) throw Error("too many render times");

      currentHook = null;
      workInProgressHook = null;

      workInProgress.updateQueue = null;

      ReactCurrentDispatcher.current = HooksDispatcherOnRerender;

      children = component(workInProgress.pendingProps);
    } while (didScheduleRenderPhaseUpdateDuringThisPass);
  }

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
