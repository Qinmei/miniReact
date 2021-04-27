import {
  appendChild,
  createInstance,
  createTextInstance,
  diffProperties,
} from "../dom";
import { WorkTag } from "../types";
import { Fiber } from "./fiber";
import { mergeLanes, NoLanes } from "./lane";

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
      console.log(
        "completeWork hostComponent",
        current?.stateNode,
        workInProgress.stateNode
      );
      if (current && workInProgress.stateNode) {
        console.log("completeWork update");
        updateHostComponent(
          current,
          workInProgress,
          workInProgress.type as string,
          current.memoizedProps,
          newProps
        );
      } else {
        console.log("completeWork mount");
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

export const updateHostComponent = (
  current: Fiber,
  workInProgress: Fiber,
  type: string,
  oldProps: any,
  newProps: any
) => {
  if (oldProps === newProps) return;
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
