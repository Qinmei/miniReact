/**
 * 说明：由于react自身的设计极其复杂，这也导致了hook上面挂载了一大堆东西，从useState的角度来考虑，就删除了大部分的复杂逻辑，从而不影响自身的使用，后续如果遇到复杂场景这个时候再考虑调整
 * 现阶段只考虑同步进程，不考虑合并更新等情况
 */

import { Fiber } from "./fiber";
import { Flags, HookFlags } from "./flags";
import { Lane, Lanes, NoLanes, SyncLane } from "./lane";
import { scheduleUpdateOnFiber } from "./workLoop";

type Update = {
  lane: Lane;
  action: any;
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

// 把创建的effect连接到fiber的updateQueue上去
// 每次运行的时候都要先销毁之前的updateQueue, 感觉有点奇怪，就跟memoizedState一样
const pushEffect = (tag: any, create: any, destroy: any, deps: any) => {
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    next: null,
  };

  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;

  if (!componentUpdateQueue) {
    componentUpdateQueue = { lastEffect: null };
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (!lastEffect) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
};

const mountEffect = (
  create: () => (() => void) | void,
  deps: Array<any> | void | null
) => {
  return mountEffectImpl(
    Flags.Passive | Flags.PassiveStatic,
    HookFlags.Passive,
    create,
    deps
  );
};

const mountEffectImpl = (
  fiberFlags: any,
  hookFlags: any,
  create: any,
  deps: any
) => {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(
    HookFlags.HasEffect | hookFlags,
    create,
    undefined,
    nextDeps
  );
};

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

  queue.pending = null;

  const dispatch = queue.dispatch;
  return [hook.memoizedState, dispatch];
};
const updateState = <S>(initialState: (() => S) | S) => {
  return updateReducer(basicStateReducer, initialState);
};
const updateEffect = (
  create: () => (() => void) | void,
  deps: Array<any> | void | null
) => {
  return updateEffectImpl(Flags.Passive, HookFlags.Passive, create, deps);
};

const updateEffectImpl = (
  fiberFlags: any,
  hookFlags: any,
  create: any,
  deps: any
) => {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;

  if (currentHook) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (nextDeps) {
      const prevDeps = prevEffect.deps;

      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }

  currentlyRenderingFiber.flags |= fiberFlags;

  hook.memoizedState = pushEffect(
    HookFlags.HasEffect | hookFlags,
    create,
    destroy,
    nextDeps
  );
};

const areHookInputsEqual = (
  nextDeps: Array<any>,
  prevDeps: Array<any> | null
) => {
  if (prevDeps === null) return false;

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (nextDeps[i] === prevDeps[i]) {
      continue;
    }
    return false;
  }
  return true;
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
  workInProgress.updateQueue = null;

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
