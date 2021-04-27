import { WorkTag } from "../types";
import { reconcileChildFibers } from "./childFiber";
import { Fiber } from "./fiber";
import { renderWithHooks } from "./hooks";
import { includesSomeLane, NoLanes, SyncLane } from "./lane";

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
      return updateHostComponent(workInProgress, didReceiveUpdate);
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

export const updateHostComponent = (
  workInProgress: Fiber,
  didReceiveUpdate: Boolean
) => {
  const children = workInProgress?.pendingProps?.children;

  if (workInProgress.alternate && !didReceiveUpdate) {
    bailoutHooks(workInProgress);
    return bailoutOnAlreadyFinishedWork(workInProgress);
  }
  workInProgress.alternate = workInProgress;
  reconcileChildren(workInProgress.alternate, workInProgress, children);
  return workInProgress.child;
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
