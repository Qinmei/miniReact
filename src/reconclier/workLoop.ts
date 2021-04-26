import {
  appendChild,
  createInstance,
  createTextInstance,
  createTextNode,
  diffProperties,
} from "../dom";
import { Fiber } from "./fiber";
import { includesSomeLane, Lane, mergeLanes, NoLanes, SyncLane } from "./lane";
import {
  createElement,
  createHostComponent,
  createHostText,
  createReactElement,
  getHostRoot,
} from "../react";
import { WorkTag } from "../types";
import { renderWithHooks } from "./hooks";

export const scheduleUpdateOnFiber = (fiber: Fiber) => {
  const lane = requestUpdateLane(fiber);
  const root = markUpdateLaneFromFiberToRoot(fiber, lane);
  performConcurrentWorkOnRoot(root);
};

export const markUpdateLaneFromFiberToRoot = (
  sourceFiber: Fiber,
  lane: Lane
): Fiber => {
  sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
  let alternate = sourceFiber.alternate;
  if (alternate) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }

  let node = sourceFiber;
  let parent = sourceFiber.return;
  while (parent) {
    parent.childLanes = mergeLanes(parent.childLanes, lane);
    alternate = parent.alternate;
    if (alternate) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane);
    }
    node = parent;
    parent = parent.return;
  }

  if (node.tag === WorkTag.HostRoot) {
    return node;
  }
};

export const performConcurrentWorkOnRoot = (root: Fiber) => {
  renderRootConcurrent(root);
};

export const renderRootConcurrent = (root: Fiber) => {
  // do {
  //   try {
  //     workLoopConcurrent(root);
  //     break;
  //   } catch (thrownValue) {
  //     console.log("error", thrownValue);
  //   }
  // } while (true);
  workLoopConcurrent(root);
};

export const workLoopConcurrent = (workInProgress: Fiber) => {
  while (workInProgress) {
    console.log("workLoopConcurrent", workInProgress);
    workInProgress = performUnitOfWork(workInProgress);
  }
};

export const performUnitOfWork = (fiber: Fiber): Fiber => {
  const next = beginWork(fiber);
  console.log("performUnitOfWork", fiber, next);
  if (next) return next;
  return completeUnitOfWork(fiber);
};

export const beginWork = (workInProgress: Fiber) => {
  const updateLanes = workInProgress.lanes;

  const didReceiveUpdate = includesSomeLane(updateLanes, SyncLane);

  workInProgress.lanes = NoLanes;

  const newFiber = { ...workInProgress };
  delete newFiber.alternate;

  switch (workInProgress.tag) {
    case WorkTag.HostRoot:
    case WorkTag.FunctionComponent: {
      return updateFunctionComponent(workInProgress, didReceiveUpdate);
    }
    case WorkTag.HostComponent: {
      return updateHostComponentWork(workInProgress, didReceiveUpdate);
    }
    case WorkTag.HostText: {
      workInProgress.alternate = workInProgress;
      break;
    }
  }
  return null;
};

export const updateFunctionComponent = (
  workInProgress: Fiber,
  didReceiveUpdate: Boolean
) => {
  const children = renderWithHooks(workInProgress);

  if (workInProgress.alternate && !didReceiveUpdate) {
    bailoutHooks(workInProgress);
    return bailoutOnAlreadyFinishedWork(workInProgress);
  }
  workInProgress.alternate = workInProgress;

  reconcileChildren(workInProgress.alternate, workInProgress, children);

  return workInProgress.child;
};

export const bailoutHooks = (workInProgress: Fiber) => {
  workInProgress.lanes = NoLanes;
};

export const bailoutOnAlreadyFinishedWork = (workInProgress: Fiber) => {
  if (!includesSomeLane(workInProgress.childLanes, SyncLane)) {
    return null;
  }
  return workInProgress.child;
};

export const updateHostComponentWork = (
  workInProgress: Fiber,
  didReceiveUpdate: Boolean
) => {
  const children = workInProgress?.pendingProps?.children;
  console.log(
    "updateHostComponentWork",
    workInProgress.alternate,
    didReceiveUpdate
  );
  if (workInProgress.alternate && !didReceiveUpdate) {
    bailoutHooks(workInProgress);
    return bailoutOnAlreadyFinishedWork(workInProgress);
  }
  workInProgress.alternate = workInProgress;
  reconcileChildren(workInProgress.alternate, workInProgress, children);
  return workInProgress.child;
};

export const completeUnitOfWork = (unitOfWork: Fiber) => {
  const current = unitOfWork.alternate;
  const returnFiber = unitOfWork.return;

  const next = completeWork(current, unitOfWork);
  return next;
};

// prepareUpdate
export const completeWork = (
  current: Fiber | null | undefined,
  workInProgress: Fiber
) => {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case WorkTag.FunctionComponent:
      bubbleProperties(workInProgress);
      break;
    case WorkTag.HostComponent: {
      if (current && workInProgress.stateNode) {
        updateHostComponent(
          current,
          workInProgress,
          workInProgress.type as string,
          current.memoizedProps,
          newProps
        );
      } else {
        const { children, ...other } = newProps;
        const instance = createInstance(workInProgress.type as string, other);
        workInProgress.stateNode = instance;
        prepareUpdate(workInProgress);
        appendAllChildren(workInProgress);
      }
      bubbleProperties(workInProgress);
      break;
    }
    case WorkTag.HostText: {
      const newText = newProps;
      const oldText = current.memoizedProps;

      if (current && workInProgress.stateNode) {
        updateHostText(current, workInProgress, oldText, newText);
      } else {
        workInProgress.stateNode = createTextInstance(newText);
        appendAllChildren(workInProgress);
      }
      bubbleProperties(workInProgress);
      break;
    }
    case WorkTag.HostRoot: {
      appendAllChildren(workInProgress);
    }
  }

  if (workInProgress.sibling) {
    return workInProgress.sibling;
  } else if (workInProgress.tag !== WorkTag.HostRoot) {
    return workInProgress.return;
  } else {
    return null;
  }
};

export const updateHostComponent = (
  current: Fiber,
  workInProgress: Fiber,
  type: string,
  oldProps: any,
  newProps: any
) => {
  // if (oldProps === newProps) return;
  prepareUpdate(workInProgress);
};

export const updateHostText = (
  current: Fiber,
  workInProgress: Fiber,
  oldText: string,
  newText: string
) => {
  if (oldText !== newText) {
    workInProgress.stateNode = createTextInstance(newText);
  } else {
    workInProgress.stateNode = current.stateNode;
  }
};

export const bubbleProperties = (workInProgress: Fiber) => {
  let newChildLanes = NoLanes;
  let child = workInProgress.child;
  while (child) {
    newChildLanes = mergeLanes(
      newChildLanes,
      mergeLanes(child.lanes, child.childLanes)
    );
    child = child.sibling;
  }
  workInProgress.childLanes = newChildLanes;
};

export const prepareUpdate = (workInProgress: Fiber) => {
  return diffProperties(
    workInProgress.stateNode,
    workInProgress.type,
    workInProgress.pendingProps,
    workInProgress.pendingProps
  );
};

export const reconcileChildren = (
  current: Fiber,
  workInProgress: Fiber,
  children
): Fiber | null => {
  workInProgress.child = reconcileChildFibers(
    workInProgress,
    current?.child,
    children
  );
};

export const reconcileChildFibers = (
  returnFiber: Fiber,
  currentFirstChild: any,
  newChild: any
): Fiber | null => {
  if (Array.isArray(newChild)) {
    let child: any;
    let head: any;
    newChild.forEach((item) => {
      const created = reconcileChild(returnFiber, currentFirstChild, item);
      if (head) {
        child.sibling = created;
        child = created;
      } else {
        child = created;
        head = child;
      }
    });
    return head;
  } else {
    return reconcileChild(returnFiber, currentFirstChild, newChild);
  }
};

export const reconcileChild = (
  returnFiber: Fiber,
  currentFirstChild: any,
  newChild: any
) => {
  const isObject = typeof newChild === "object" && newChild;
  if (isObject) {
    return reconcileSingleElement(returnFiber, currentFirstChild, newChild);
  }

  if (typeof newChild === "string" || typeof newChild === "number") {
    return reconcileSingleTextNode(
      returnFiber,
      currentFirstChild,
      "" + newChild
    );
  }

  return null;
};

export const reconcileSingleTextNode = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  textContent: string
) => {
  const created = createHostText("text", textContent);
  created.return = returnFiber;
  return created;
};

export const reconcileSingleElement = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: any
) => {
  const created = createFiberFromElement(element);
  created.return = returnFiber;
  return created;
};

export const reconcileChildrenArray = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: any[]
) => {};

export const createFiberFromElement = (element: any) => {
  const { type, props } = element;
  return createFiberFromTypeAndProps(type, props);
};

export const createFiberFromTypeAndProps = (type: any, props: any) => {
  if (typeof type === "function") {
    return createReactElement(type, props);
  } else if (typeof type === "string") {
    return createHostComponent(type, props);
  }
};

export const requestEventTime = () => performance.now();

export const requestUpdateLane = (fiber: Fiber | null) => {
  return SyncLane;
};

export const appendAllChildren = (workInProgress: Fiber) => {
  let parent = workInProgress;
  let node = workInProgress.child;
  while (node) {
    if (node.tag === WorkTag.HostComponent || node.tag === WorkTag.HostText) {
      appendChild(parent?.stateNode, node?.stateNode);
    } else if (node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    // node.sibling.return = node.return;
    node = node.sibling;
  }
};