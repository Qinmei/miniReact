import { WorkTag } from "../types";
import { cloneChildFibers, reconcileChildFibers } from "./childFiber";
import { Fiber } from "./fiber";
import { Flags } from "./flags";
import { renderWithHooks } from "./hooks";
import { includesSomeLane, NoLanes, SyncLane } from "./lane";

export const beginWork = (current: Fiber, workInProgress: Fiber) => {
  const updateLanes = workInProgress.lanes;

  const oldProps = current?.memoizedProps;
  const newProps = workInProgress.pendingProps;


  const didReceiveUpdate =
    oldProps !== newProps ||
    includesSomeLane(updateLanes, SyncLane) ||
    current.flags !== Flags.NoFlags;

  workInProgress.lanes = NoLanes;

  switch (workInProgress.tag) {
    case WorkTag.HostRoot:
    case WorkTag.FunctionComponent: {
      return updateFunctionComponent(current, workInProgress, didReceiveUpdate);
    }
    case WorkTag.HostComponent: {
      return updateHostComponent(current, workInProgress, didReceiveUpdate);
    }
    case WorkTag.HostText: {
      break;
    }
  }
  return null;
};

export const updateFunctionComponent = (
  current: Fiber,
  workInProgress: Fiber,
  didReceiveUpdate: Boolean
) => {
  const children = renderWithHooks(workInProgress);

  if (workInProgress.alternate && !didReceiveUpdate) {
    bailoutHooks(workInProgress);
    return bailoutOnAlreadyFinishedWork(workInProgress);
  }

  workInProgress.flags |= Flags.PerformedWork;
  reconcileChildren(current, workInProgress, children);

  return workInProgress.child;
};

export const bailoutHooks = (workInProgress: Fiber) => {
  workInProgress.lanes = NoLanes;
};

export const bailoutOnAlreadyFinishedWork = (workInProgress: Fiber) => {
  if (!includesSomeLane(workInProgress.childLanes, SyncLane)) {
    return null;
  }
  cloneChildFibers(workInProgress.alternate, workInProgress);
  return workInProgress.child;
};

export const updateHostComponent = (
  current: Fiber,
  workInProgress: Fiber,
  didReceiveUpdate: Boolean
) => {
  let children = workInProgress?.pendingProps?.children;

  reconcileChildren(current, workInProgress, children);

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
