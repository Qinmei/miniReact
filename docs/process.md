## 全流程说明

- render 记录 App 以及 container， APP 则是个组件
- render 时会先根据 container 调用 createFiberRoot， 也就是 react 的几个模式，FiberRoot.current = HostRootFiber, HostRootFiber.stateNode = FiberRoot;
- 根据 APP 的类型先调用解析 jsx 的函数来创建 ReactElement，这个时候将其标记为 HostRoot 节点，然后调用 scheduleUpdateOnFiber 来执行整体的流程
- scheduleUpdateOnFiber 会先从当前 fiber 上获取 lane,然后调用 markUpdateLaneFromFiberToRoot，先将当前 fiber.lanes 合并 lane, 然后一直向上遍历，将每个父级节点的 fiber.childLanes 合并 lane
- 向上遍历到了 HostRoot 节点，就会直接返回该节点，HostRoot 应该不是 fiber 类型，需要再验证下
- 如果是 SyncLane， 就会直接开启 performSyncWorkOnRoot(root), 否则就走调度器
- 任务执行的时候就是调用 workLoopConcurrent 这类的开启循环任务，循环执行 performUnitOfWork
- performUnitOfWork 会先执行 beginWork，如果 beginWork 没有返回值则直接执行 completeUnitOfWork，否则循环执行 beginWork 的返回值
- beginWork 其实就是一直执行并返回 child，如果 child 执行完了就意味着这条深度走完了，需要从 completeUnitOfWork 走 sibling 继续执行，如果 sibling 都没有了就直接返回父节点
- beginWork 中会进行判断，如果!includesSomeLane(renderLanes, workInProgress.lanes)，就会执行 bailoutOnAlreadyFinishedWork，但是感觉放在 performUnitOfWork 里面可能会更合适，不过多执行一个函数的开销应该也不大，倒也无所谓了
- 如果有更新内容的话，就会执行 updateFunctionComponent，主要是将子节点这些全都转换成 Fiber，当然有复用的就直接复用，基本上都是 createFiberFromXXX
- 没有子节点的话就会执行 completeUnitOfWork，其实也就是在当前节点上执行 completeWork，FunctionComponent 主要是执行 bubbleProperties， 就是将 childLanes 合并进去等操作，HostComponent 则会去更新 DOM 节点，prepareUpdate 这个就是 DOM 的更新接口，里面主要会 diffProperties
- 全都执行完之后就会保证没有任务继续停留了，最后就会执行 commitRoot， 里面比较复杂，大头还是 flushPassiveEffects，暂时还没有涉及到这些

- prepareFreshStack 里面会 createWorkInProgress(root.current, null)，也就是创建 workInProgress，然后从根节点开始更新

## fiber 属性说明

- pendingProps: nextProps
- memoizedProps: 当前的 props
- updateQueue: 更新链路， hooks 的 effect 其实就是在上面， 但是 classComponent 的格式则有点不一样，不同的组件可能存储的都不太一样，有点麻烦
- memoizedState: 当前的 state
- nextEffect: 有副作用的 fiber 节点
- firstEffect: 起点
- lastEffect: 终点
- lanes: 自身的 Lanes，用来判断自身的更新
- childLanes: 子节点的 Lanes，用来判断子节点需不需要更新

更新基本上都是在 updateQueue 里面，然后执行里面得到最终的结果，主要是需要存储新旧的 props，以及 state 状态

## hooks 的属性

fiber.memoizedState = workInProgressHook = hook

useState/useReducer 主要是依赖 memoizedState，而 useEffect 则是依赖 memoizedState

```js
type Hook = {|
  memoizedState: any, // 更新后的state，可能还没提交
  baseState: any, // 更新前的值
  baseQueue: Update<any, any> | null,
  queue: UpdateQueue<any, any> | null,
  next: Hook | null,
|};

type Update = {
  lane: Lane,
  action: any, // 状态变更的规则
  eagerReducer: any, // 缓存上一个 reducer
  eagerState: any, // 缓存上一个状态，以便复用
  next: Update,
  priority?: number,
};

type UpdateQueue = {
  pending: Update | null, // 存储排队中的状态变更规则
  interleaved: Update | null,
  lanes: Lanes,
  dispatch: any,
  lastRenderedReducer: any, // basicStateReducer其实就是判断如果是函数就直接执行，相当于简化版的useReducer，主要是useState中需要使用的，useReducer中就是从外部获取的
  lastRenderedState: any, // 存储上一个 state
};

type Effect = {
  tag: HookFlags,
  create: () => (() => void) | void,
  destroy: (() => void) | void,
  deps: Array<mixed> | null,
  next: Effect,
};
```

首先 hooks 是以链表的形式串联在 fiber.memoizedState 上，实际上是因为 FunctionComponent 没有 state 属性，所以将就着用了

`除了 mount 挂载、update 更新外，ReactCurrentDispatcher 另有两种实现态：为了避免 hook 在渲染函数外部执行，fiber reconciler 提供了 ContextOnlyDispatcher 实现；为了实现渲染函数内部当即更新 state，fiber reconciler 提供了 HooksDispatcherOnRerender 实现。逻辑上，渲染函数内部更新 state 使用 do-while 循环更新状态，这时 useState 调用将走 rerenderState 流程，且不会调用 scheduleWork（因为本身就在一个渲染流程中）；fiber reconciler 也限制了这种 state 更新方式的最大次数。`

之所以部分 hooks 有三种机制，其实主要还是由于内部的重复调用导致的状态频繁变化，这个时候需要直接在内部更新而不是再走一遍调度，所以 rerender 还是比较重要的, 目前也就 useState 以及 useReducer 有用到， 后续还有 useDeferredValue/useTransition 等需要用到

### workInProgressHook

#### mount

创建 hooks 并形成一个闭环

```js
function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,

    baseState: null,
    baseQueue: null,
    queue: null,

    next: null,
  };

  if (workInProgressHook === null) {
    // This is the first hook in the list
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // Append to the end of the list
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
```

#### update

有 currentHook 以及 workInProgressHook， 感觉过于重复

```js
function updateWorkInProgressHook(): Hook {
  // This function is used both for updates and for re-renders triggered by a
  // render phase update. It assumes there is either a current hook we can
  // clone, or a work-in-progress hook from a previous render pass that we can
  // use as a base. When we reach the end of the base list, we must switch to
  // the dispatcher used for mounts.

  let nextCurrentHook: null | Hook;
  // 主要是获取下一个hook，当然如果都没有了那就直接获取第一个
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    nextCurrentHook = currentHook.next;
  }

  // 获取nextWorkInProgressHook
  let nextWorkInProgressHook: null | Hook;
  if (workInProgressHook === null) {
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  // 直接向后延一位
  if (nextWorkInProgressHook !== null) {
    // There's already a work-in-progress. Reuse it.
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;

    currentHook = nextCurrentHook;
  } else {
    // Clone from the current hook.

    currentHook = nextCurrentHook;

    // 重新创建一个hook，往后加上去就行
    const newHook: Hook = {
      memoizedState: currentHook.memoizedState,

      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,

      next: null,
    };

    if (workInProgressHook === null) {
      // This is the first hook in the list.
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      // Append to the end of the list.
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook;
}
```

### useReducer 更新机制

#### mount

- 先 mountWorkInProgressHook， 然后初始化 memoizedState/baseState，创建 queue，最后返回即可, 跟 useState 一样，唯一的区别在于参数会多一点

```js
function mountReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: (I) => S
): [S, Dispatch<A>] {
  // 创建WorkInProgressHook
  const hook = mountWorkInProgressHook();
  // 获取初始值
  let initialState;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = ((initialArg: any): S);
  }
  // 保存初始值
  hook.memoizedState = hook.baseState = initialState;
  // 创建queue
  const queue = (hook.queue = {
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: (initialState: any),
  });
  // 绑定currentlyRenderingFiber以及queue，这样执行的时候就能带上一些参数
  const dispatch: Dispatch<A> = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ): any));
  // 返回状态以及dispatch
  return [hook.memoizedState, dispatch];
}
```

### update

```js
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: (I) => S
): [S, Dispatch<A>] {
  // 获取WorkInProgressHook
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  // 理论上不可能存在其他的reducer啊
  queue.lastRenderedReducer = reducer;

  const current: Hook = currentHook;
  let baseQueue = current.baseQueue;

  // The last pending update that hasn't been processed yet.
  // 将pendingQueue上的串联到baseQueue中去，因为pending中的有些update优先级可能不会很高
  const pendingQueue = queue.pending;
  if (pendingQueue !== null) {
    // We have new updates that haven't been processed yet.
    // We'll add them to the base queue.
    if (baseQueue !== null) {
      // Merge the pending queue and the base queue.
      // 将pendingQueue连接到baseQueue上去，同时将pendingQueue连接到baseQueue, 这是要形成一个环啊
      // pending --> pendingFirst --|
      //                 ^          |
      //                 |          |
      // base    --> baseFirst <----|
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }

    // 将pending作为头部，然后请空pendingQueue
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  if (baseQueue !== null) {
    // We have a queue to process.
    // 获取pending的第一个节点， 也就是Update对象
    const first = baseQueue.next;
    let newState = current.baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    // 遍历baseQueue
    do {
      const updateLane = update.lane;
      // updateLane是renderLanes的子集， 取反意思则不是
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        // Priority is insufficient. Skip this update. If this is the first
        // skipped update, the previous update/state is the new base
        // update/state.
        // 创建新的Update对象
        const clone: Update<S, A> = {
          lane: updateLane,
          action: update.action,
          eagerReducer: update.eagerReducer,
          eagerState: update.eagerState,
          next: null,
        };
        // 如果不存在头节点，那么首尾都指向这个节点
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          // 否则直接在尾节点上添加上去
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        // Update the remaining priority in the queue.
        // TODO: Don't need to accumulate this. Instead, we can remove
        // renderLanes from the original lanes.
        // 将lane合并进来
        currentlyRenderingFiber.lanes = mergeLanes(
          currentlyRenderingFiber.lanes,
          updateLane
        );
        markSkippedUpdateLanes(updateLane);
      } else {
        // This update does have sufficient priority.
        // 当前的Update需要更新，如果尾部节点存在则直接挂在链表尾部
        if (newBaseQueueLast !== null) {
          const clone: Update<S, A> = {
            // This update is going to be committed so we never want uncommit
            // it. Using NoLane works because 0 is a subset of all bitmasks, so
            // this will never be skipped by the check above.
            lane: NoLane,
            action: update.action,
            eagerReducer: update.eagerReducer,
            eagerState: update.eagerState,
            next: null,
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        // 将reducer执行一遍，如果已经赋值就意味着已经执行过了，那么直接用新的状态就行
        if (update.eagerReducer === reducer) {
          // If this update was processed eagerly, and its reducer matches the
          // current reducer, we can use the eagerly computed state.
          newState = update.eagerState;
        } else {
          // 否则就执行一遍
          const action = update.action;
          newState = reducer(newState, action);
        }
      }
      update = update.next;
    } while (update !== null && update !== first);

    // 如果不存在尾节点，那就直接赋新的值，否则就将首位相连
    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = newBaseQueueFirst;
    }

    // 如果新旧值不一样则标记受到更新，否则就不用处理
    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }

    // hook上需要将新的值保留下来，然后将没有更新的Update继续串联回来，下一次继续更新
    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;

    // queue将最后一次的结果保留下来
    queue.lastRenderedState = newState;
  }

  // Interleaved updates are stored on a separate queue. We aren't going to
  // process them during this render, but we do need to track which lanes
  // are remaining.
  const lastInterleaved = queue.interleaved;
  if (lastInterleaved !== null) {
    let interleaved = lastInterleaved;
    do {
      const interleavedLane = interleaved.lane;
      currentlyRenderingFiber.lanes = mergeLanes(
        currentlyRenderingFiber.lanes,
        interleavedLane
      );
      markSkippedUpdateLanes(interleavedLane);
      interleaved = (interleaved.next: Update<S, A>);
    } while (interleaved !== lastInterleaved);
  } else if (baseQueue === null) {
    // `queue.lanes` is used for entangling transitions. We can set it back to
    // zero once the queue is empty.
    queue.lanes = NoLanes;
  }

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}
```

#### rerender

在 rerender 的时候一次性全部执行完毕 pending，与 update 的区别在于，update 的时候会将 pendingQueue 与 baseQueue 结合起来，然后挑出需要更新的部分去更新
didScheduleRenderPhaseUpdateDuringThisPass 则是决定到底用的是 HooksDispatcherOnRerender 还是 HooksDispatcherOnUpdate
dispatchAction 的时候会将 didScheduleRenderPhaseUpdateDuringThisPass = true

```js
function rerenderReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: (I) => S
): [S, Dispatch<A>] {
  // 获取hook
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  // 重新赋值lastRenderedReducer
  queue.lastRenderedReducer = reducer;

  // This is a re-render. Apply the new render phase updates to the previous
  // work-in-progress hook.
  const dispatch: Dispatch<A> = (queue.dispatch: any);
  const lastRenderPhaseUpdate = queue.pending;
  let newState = hook.memoizedState;

  // 如果有pending的Update
  if (lastRenderPhaseUpdate !== null) {
    // The queue doesn't persist past this render pass.
    // 全都清空
    queue.pending = null;

    const firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
    let update = firstRenderPhaseUpdate;

    // 从第一个节点开始执行，并在之前的数据上不断的累加，最终得到结果
    do {
      // Process this render phase update. We don't have to check the
      // priority because it will always be the same as the current
      // render's.
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== firstRenderPhaseUpdate);

    // Mark that the fiber performed work, but only if the new state is
    // different from the current state.
    // 前后的state不一样
    if (!is(newState, hook.memoizedState)) {
      // didReceiveUpdate = true
      markWorkInProgressReceivedUpdate();
    }
    // 将最后的结果赋值上去
    hook.memoizedState = newState;
    // Don't persist the state accumulated from the render phase updates to
    // the base state unless the queue is empty.
    // TODO: Not sure if this is the desired semantics, but it's what we
    // do for gDSFP. I can't remember why.
    // baseQueue 的状态保留
    if (hook.baseQueue === null) {
      hook.baseState = newState;
    }
    // 标记上次的保留状态
    queue.lastRenderedState = newState;
  }
  return [newState, dispatch];
}
```

### useState 更新机制

- mountState:先 mountWorkInProgressHook， 然后初始化 memoizedState/baseState，创建 queue，最后返回即可
- updateState, 返回 updateReducer

### useEffect 的机制

useEffect 这类走的就是 effect 机制了

#### mount

```js
function mountEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  return mountEffectImpl(
    PassiveEffect | PassiveStaticEffect,
    HookPassive,
    create,
    deps
  );
}

function mountEffectImpl(fiberFlags, hookFlags, create, deps): void {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber.flags |= fiberFlags;
  // 因此hooks的memoizedState记录的就是创建的这个effect
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps
  );
}

function pushEffect(tag, create, destroy, deps) {
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    // Circular
    next: null,
  };
  let componentUpdateQueue: null | FunctionComponentUpdateQueue =
    currentlyRenderingFiber.updateQueue;
  // 初始化的时候，如果没有则直接创建然后挂载上去
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue(); // return { lastEffect: null }
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect; // 形成一个环
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      // lastEffect --> effect --> lastEffect.next， 但是从上面知道，lastEffect.next指向的是自身，所以继续形成了一个环
      // 当有多个节点继续的时候，其实就是将第一个节点直接插进来，然后继续形成一个环,同时将这个节点作为最后的标记项
      // lastEffect ---> lastEffect.next ---> lastEffect.next2            lastEffect  --|       lastEffect.next ---> lastEffect.next2
      //     ^                                           |                     |        ⬇️             ⬆️                    ｜
      //     |                                           |                     |       effect   -------|                     |
      //     |                                           |          --->       |                                             |
      //     |-------------------------------------------|                     |---------------------------------------------|
      //
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}
```

#### update

```js
function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function updateEffectImpl(fiberFlags, hookFlags, create, deps): void {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;

  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      // 新旧值一致，不需要推进HookHasEffect
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }

  currentlyRenderingFiber.flags |= fiberFlags;

  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destroy,
    nextDeps
  );
}
```
