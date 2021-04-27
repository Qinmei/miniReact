import { Fiber } from "./fiber";
import { Lane, mergeLanes, SyncLane } from "./lane";

import { WorkTag } from "../types";
import { beginWork } from "./beginWork";
import { completeWork } from "./completeWork";

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
  return node;
};

export const performConcurrentWorkOnRoot = (root: Fiber) => {
  renderRootConcurrent(root);

  commitRoot(root);
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

export const workLoopConcurrent = (workInProgress: Fiber | null) => {
  while (workInProgress) {
    workInProgress = performUnitOfWork(workInProgress);
  }
};

export const performUnitOfWork = (fiber: Fiber): Fiber | null => {
  const next = beginWork(fiber);
  console.log("performUnitOfWork", fiber, next);
  if (next) return next;
  const res = completeUnitOfWork(fiber);
  return res;
};

export const completeUnitOfWork = (unitOfWork: Fiber) => {
  const current = unitOfWork.alternate;
  const returnFiber = unitOfWork.return;

  const next = completeWork(current, unitOfWork);
  console.log("completeUnitOfWork", next?.stateNode, current?.stateNode);
  return next;
};

export const requestEventTime = () => performance.now();

export const requestUpdateLane = (fiber: Fiber | null) => {
  return SyncLane;
};

export const commitRoot = (root: Fiber) => {
  flushPassiveEffects();
};

export const flushPassiveEffects = () => {};
