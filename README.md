## 说明

仿照 react 的框架, 主要是基于 hooks, 完全放弃 class, 但是整体的分层参考原始的 react, 分成 DOM, React, Reconclier,Scheduler

- DOM, 主要是对 DOM 进行操作, 增删改查等, 独立出来进行处理
- React,关键的 API
- Reconclier, Diff 比对等, 是很核心的东西
- Scheduler，调度器

### 规划

短期内就上面几块即可，先完善基础的功能，保证能够运行起来，然后再添加像 ref, context 这些，只做函数式的部分，减少负担，此外预计做的是 react 的简化版，大体的流程会跟 react 一样

从开发上来说，先理解 buildReact 的内容，最起码知道如何去构建以及整体的流程要怎么触发，等流程上没有问题之后，就开始仿照 react 的流程去开发

### 难点

- lane 的机制需要弄清楚，否则无法判断节点是否被更新过，这样就会导致重复渲染，需要标记已经被更新过则直接跳过
