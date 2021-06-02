## 使用

yarn start 即可，源码在 src 文件夹，跑起来的实例在 examples 里面，修改 index.tsx 就行

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
- [x] completeWork 的工作机制，收集 DOM 的变化，但是不做更新, commit 阶段进行更新
- [x] hooks useReducer 的补全
- [ ] hooks useEffect 的补全
- [ ] lane 的机制的补全，搞懂 react 的 lane 机制
- [ ] 调度器的实现
- [ ] 合理拆分并丰富 types 定义
- [ ] 没做合成事件的处理，因此在 DOM 上面做了一些额外的处理工作，事件的绑定主要是需要将旧的事件移除掉，因此就不能简单的直接将更新内容直接传进来，需要将旧的事件也一起传回来

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

- 与 react 的区别

由于 react 分为 mount 以及 update 两个阶段，但是本项目为了省事只做了 update 的，所有的挂载都尽量让它走 update 流程，因此会有一些不太一样的地方，但是整体的更新流程还是差不多的

- 在 completeWork 中创建 DOM

判断条件是：current !== null && workInProgress.stateNode != null

从目前来看，会在 completeWork 里面有个 appendAllChildren 方法，会将子节点插入进来，如果是 mount 阶段，那么这个时候所有的 ODM 节点都没创建完，相当于构建一个没有挂载的 DOM，后续递归到 root 的时候会一次性挂载上去，这个没啥问题

但是一个比较关键的点在于，一旦重新构建了某个节点，那么这就意味着里面所有的节点都会被删除重建, 因此不存在父节点被删除但是子节点还保留的情况，所以这里面构建的必然会是新节点，然后等到后面 commitPlacement 挂载上去

- hook 的机制

实际上 useState 有三种，mountState, updateState, rerenderState, 这三种都有自己的应用场景

- mountState：挂载阶段的 hooks,主要是需要创建一些东西
- updateState：更新阶段的 hook
- rerenderState：这个比较有意思，就是当前 hook 产生了副作用需要再次 render，当然异步请求肯定不包含在内，主要是执行的时候发现 dispatchAction 的时候，记录的 fiber 就是当前节点，也就是说连续的触发，这样其实可以减少一些更新次数，主要的应用场景应该就是防止自定义 hooks 中嵌套过深导致的性能开销，也就是说尽管函数会反复执行，但是并不会等到一次 workLoop 之后

但是从实际的体验来看，触发的规则似乎有点严格，暂时没找到这类的情况, 因为 useEffect 的更新是在 commit 阶段的，这个时候必然会错过更新的流程，但是如果就是在内部触发的，那基本上一个函数周期也能完成，所以不太清楚具体的场景在哪
