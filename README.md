## 说明

仿照 react 的框架, 主要是基于 hooks, 完全放弃 class, 但是整体的分层参考原始的 react, 分成 DOM, React, Reconclier,Scheduler

- DOM, 主要是对 DOM 进行操作, 增删改查等, 独立出来进行处理
- React,关键的 API
- Reconclier, Diff 比对等, 是很核心的东西
- Scheduler，调度器

### 规划

短期内就上面几块即可，先完善基础的功能，保证能够运行起来，然后再添加像 ref, context 这些，只做函数式的部分，减少负担，此外预计做的是 react 的简化版，大体的流程会跟 react 一样

### 进度

- [x] jsx 解析 OK，能够 render 显示 DOM 内容
- [x] hooks 机制确认，能够实现内部数据更新调度（简单实现）
- [x] DOM 节点的 diff 更新机制
- [x] 确少 commitRoot 的细节
- [ ] lane 的进一步确认
- [ ] 调度器的实现
- [ ] 合理拆分并丰富 types 定义

### TODO

- jsx 的解析测试，主要包括 fiber 节点中 key 的补充，以及数组的测试等，确认整体更新没啥问题
- hooks 的完整机制的补全，目前的机制比较简陋

### 问题点

- 通过 childLanes 以及 lanes 组合可以判断是否需要更新节点，但是函数组件的问题在于，hooks 是绑定在定义组件内部，更新的时候内部的 HostComponent 的没有依赖 hooks，那么就判断不出来要更新

HostComponent 的更新机制跟 FunctionComponent 的机制不一样，不用担心内部有状态，所以无需对其进行判断，每次重新执行就是了

- reconcileChildren 的机制比较复杂

reconcileChildren 主要是区分单节点比对以及数组比对，数组这个不仅仅是 map 出来的需要 key,一般的节点如 div 内部的都是数组，所以为了能够将将这几种都区分出来，所以利用了 index + key 的组合，内部会先通过 index 来初步判断，然后判断 key 的变化，如果没有指定 key,那应该都是 null, 数组内部这样就可能会导致节点的判断出错，但是一般局限于自定义组件，div 这种组件每次都会重新执行一遍，内部也不会有状态，倒是不用担心

- DOM 的更新机制

目前的话创建 DOM 这个比较简单，肯定会直接 append 即可，但是主要是中间的更新，这个判断就比较麻烦，应该要结合 flags 进行操作，后面再详细看

- flags 的更新

目前包括这几种，placeChild 中会判断设置成 Placement，其次就是删除的时候会收集起来然后设置成 Deletion

markUpdate 则是标记为 Update

commitPlacement: 处理完之后直接将 Placement 清空, 但是这里面不包括更新节点，里面主要包括 insertBefore/appendChild 两种操作, appendChild 主要是将节点移动到末尾，而 insertBefore 则是将节点移动到参考节点的前面，所以只适合不需要更新节点的情况

commitWork：主要是处理 Update 的情况，如果是函数组件则执行 commitHookEffectListUnmount，而 HostComponent/HostText 则直接提交 commitUpdate/commitTextUpdate

- 更新机制

首先，beginWork 主要是更新 FunctionComponent 以及 HostComponent 的子节点，也就是说不涉及 fiber 内部的更新，只是通过 key 这种来复用，也就是说主要针对的是 fiber 自身的变化，包括 fiber 的移动以及删除，不包括内部的 HostComponent/HostText 的更新

然后就是 completeWork，主要是标记更新，通过新旧的 Props 来判断是否需要更新等，同时计算出更新的部分，然后标记下来，HostComponent 就需要将更改部分收集起来，然后挂载到 updateQueue 上

最后就是 commitWork，主要是通过之前标记的来更新以及修改删除 DOM, 实际上里面有 commitBeforeMutationEffects/commitMutationEffects， 这两个都会遍历整个 fiber 树，整体算下来的话，一个周期最起码是三次遍历了，再加上其他的遍历，可能比较费时间

只考虑 FunctionComponent 的话，effect 其实主要是 useEffect 以及 useLayoutEffect 这类，不会在当时就直接更新，而是等到最后 commit 的时候再一次性更新
