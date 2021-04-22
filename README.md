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
- [ ] Fiber 的属性确认，保证基础的功能没有缺失，整体的属性使用符合 react 的特性
- [ ] hooks 机制确认，能够实现内部数据更新调度
- [ ] DOM 节点的 diff 更新机制
- [ ] lane 的进一步确认
- [ ] 调度器的实现
- [ ] 合理拆分并丰富 types 定义
