import { createWorkInProgress, Fiber } from "./fiber";
import { Lane, mergeLanes, SyncLane } from "./lane";

import { WorkTag } from "../types";
import { beginWork } from "./beginWork";
import { completeWork } from "./completeWork";
import { commitMutationEffects } from "./commitWork";

export const scheduleUpdateOnFiber = (fiber: Fiber) => {
  const lane = requestUpdateLane(fiber);
  const root = markUpdateLaneFromFiberToRoot(fiber, lane);
  performConcurrentWorkOnRoot(root);
  console.log("scheduleUpdateOnFiber", root);
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
  createWorkInProgress(root);
  workLoopConcurrent(root);
};

export const workLoopConcurrent = (workInProgress: Fiber | null) => {
  while (workInProgress) {
    workInProgress = performUnitOfWork(workInProgress);
  }
};

export const performUnitOfWork = (unitOfWork: Fiber): Fiber | null => {
  const current = unitOfWork.alternate;

  const next = beginWork(current, unitOfWork);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next) return next;
  const completeWork = completeUnitOfWork(unitOfWork);
  return completeWork;
};

export const completeUnitOfWork = (unitOfWork: Fiber) => {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;

    const next = completeWork(current, completedWork);

    if (next) return next;
    if (completedWork.sibling) return completedWork.sibling;
    completedWork = completedWork.return;
  } while (completedWork);
};

export const requestEventTime = () => performance.now();

export const requestUpdateLane = (fiber: Fiber | null) => {
  return SyncLane;
};

export const commitRoot = (root: Fiber) => {
  commitMutationEffects(root);
};
