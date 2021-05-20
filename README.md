## 说明

仿照 react 的框架, 主要是基于 hooks, 完全放弃 class, 但是整体的分层参考原始的 react, 分成 DOM, React, Reconclier,Scheduler

- DOM, 主要是对 DOM 进行操作, 增删改查等, 独立出来进行处理
- React,关键的 API
- Reconclier, Diff 比对等, 是很核心的东西
- Scheduler，调度器

### 规划

主要是做 react 的 mini 版，因此整体的流程会跟 react 一模一样，函数的名称也会保持一致，主要是删除多余的部分，只包含最小化的流程

等到后面梳理完毕之后，再拉个分支做特别定制

### TODO

- [x] jsx 解析 OK，能够 render 显示 DOM 内容
- [x] hooks 机制确认，能够实现内部数据更新调度（简单实现）
- [x] DOM 节点的 diff 更新机制
- [x] 确少 commitRoot 的细节
- [x] 在关键节点对比 react 以及现有版本的区别，节点更新部分没太大问题
- [ ] completeWork 的工作机制，收集 DOM 的变化，但是不做更新
- [ ] 调度器的实现
- [ ] lane 的机制的补全，搞懂 react 的 lane 机制
- [ ] hooks 的完整机制的补全，目前的机制比较简陋
- [ ] 合理拆分并丰富 types 定义

### 备注

- 通过 childLanes 以及 lanes 组合可以判断是否需要更新节点，但是函数组件的问题在于，hooks 是绑定在定义组件内部，更新的时候内部的 HostComponent 的没有依赖 hooks，那么就判断不出来要更新

HostComponent 的更新机制跟 FunctionComponent 的机制不一样，不用担心内部有状态，所以无需对其进行判断，每次重新执行就是了

- reconcileChildren 的机制比较复杂

reconcileChildren 主要是区分单节点比对以及数组比对，数组比对则利用了 index + key 的组合，内部会先通过 index 来初步判断，如果 index 一致的话则判断 key 是否一致

需要注意的是，根据 jsx 的解析规则，中间空洞以及三元等判断的其实已经填充了 index, 所以一般除了 map 数组外，很难改变内部的顺序以及组件的类型

children 的更新则是比较简单，首先按顺序比对 index， 如果 index 一致，key 一致，那么就直接更新该节点，在更新的时候判断前后类型是否一致，是否需要重新创建节点，还是直接从当前节点去复用

如果 index 不一致， 那么就跳出比对流程，走乱序更新的判断逻辑，利用 index 以及 key 来做索引，然后匹配之前的节点，如果匹配不到就当作删除来处理

- DOM 的更新机制

目前的话创建 DOM 这个比较简单，直接 append 即可，HostComponent 的更新则麻烦一点，首先要在 completeWork 中 diffProperties 更新的 updatePayload，然后将其挂载到 workInProgress.updateQueue 上，根据有没有更新内容来标记需要是否更新，updatePayload 是个数组，更新的值成对的推入，第一个参数则是类型，第二个值则是变动的内容，需要注意的是，如果是 style, 删除属性的话就需要将删除的项挨个列出来，而不是直接清空

然后在 commitWork 中调用 updateProperties 来更新 updatePayload,减少 commit 时的比对工作

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

- alternate 的机制

首次挂载的时候其实没有 alternate 属性，下次更新然后从根节点开始复制节点，会依次创建 workInProgress 节点，这样可以节省初次 render 的时间
