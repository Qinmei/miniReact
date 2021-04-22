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

- prepareFreshStack 里面会 createWorkInProgress(root.current, null)，也就是创建 workInProgress，然后从根节点开始更新，
