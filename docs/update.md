## 触发更新的流程

从 hook 的角度来看，更新的整体触发以及中止的流程

- dispatchAction 中，跟之前的机制差不多，先获取 lane，eventTime， 最后调用 scheduleUpdateOnFiber
- scheduleUpdateOnFiber 中，先给 fiber.lanes 合并 lane， 然后父级节点不断的回溯，同时将 lane 合并到 fiber.return.childLanes, 这样就能获得更新信息了
- 标记 root 节点的 pendingLanes 为需要更新
- performSyncWorkOnRoot 中，如果是同步更新，那么就直接调用 renderRootSync(root,lanes),最后执行 commitRoot(root)即可
- performUnitOfWork 中，先执行 beginWork,如果没有返回则执行 completeUnitOfWork
- beginWork 中，首先区分为 renderLanes 以及 updateLanes = workInProgress.lanes 两种，首先要判断的是有没有收到更新，其次就是判断 renderLanes 包不包含 updateLanes，都作为函数需不需要更新的判断，workInProgress.lanes = NoLanes，然后调用函数 updateFunctionComponent
- updateFunctionComponent 中，nextChildren = renderWithHooks(), 然后如果函数没有收到更新同时也不是初次渲染，那就直接调用 bailoutHooks/bailoutOnAlreadyFinishedWork
- bailoutHooks 中就会删除掉 current.lanes 中包含 renderLanes 的部分
- bailoutOnAlreadyFinishedWork 中，会先判断 includesSomeLane(renderLanes, workInProgress.childLanes), 如果包含则说明子节点需要更新，这个时候返回 cloneChildFibers, 没有则 return null 就行
- renderWithHooks 中，workInProgress.lanes = NoLanes，然后执行 Component
- completeUnitOfWork 中，FunctionComponent 就是 bubbleProperties(workInProgress)，然后 return null;
- bubbleProperties 中，let newChildLanes = NoLanes，然后遍历该节点的 child， newChildLanes = mergeLanes(newChildLanes,mergeLanes(child.lanes, child.childLanes))，最后将子节点的 childLanes = newChildLanes

### 总结

- beginWork 首先会沿着 child 一路往下更新，没有 child 的话就直接可以 bailoutOnAlreadyFinishedWork，然后走 completeUnitOfWork，这个时候就会先处理自身节点，将更新信息收集起来，如果有 sibling 就让 sibling 重新走一遍 beginWork，没有的话就直接走 return 节点，这个时候很明显子节点已经执行过了，所以父节点只需要执行 complteWork 就行，因此也就避免了需要判断父节点的情况，至于子节点触发的父节点更新，如果不触发状态的话，那么就没啥影响，触发状态的话去就需要重新走一遍流程

- 处理过程中的变动，除了新增是直接添加外，其他的都是会先标记然后在 commitWork 中一起更新，commitPlacement/commitDeletion 等
- commitRoot --> commitMutationEffects --> commitMutationEffects_begin --> commitMutationEffects_complete --> commitMutationEffectsOnFiber --> commitPlacement
- 所以这里面主要是用来 Flags 来判断的，所以也不存在 commitAdd，只有更新以及删除这两种，删除则批量删除,后面需要先考虑 commitWork 的部分


commitPassiveUnmountEffects