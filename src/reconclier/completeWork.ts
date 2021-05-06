import {
  appendChild,
  createInstance,
  createTextInstance,
  diffProperties,
} from "../dom";
import { WorkTag } from "../types";
import { Fiber } from "./fiber";
import { Flags } from "./flags";
import { mergeLanes, NoLanes } from "./lane";

const markUpdate = (workInProgress: Fiber) => {
  workInProgress.flags |= Flags.Update;
};

export const completeWork = (
  current: Fiber | null | undefined,
  workInProgress: Fiber
) => {
  const newProps = workInProgress.pendingProps;

  console.log("completeWork start", workInProgress);

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
        prepareUpdate(
          current,
          workInProgress,
          current?.memoizedProps,
          newProps
        );
        appendAllChildren(workInProgress);
      }
      bubbleProperties(workInProgress);
      break;
    }
    case WorkTag.HostText: {
      const newText = newProps;
      const oldText = current?.memoizedProps;

      console.log(
        "completeWork HostText",
        newText,
        oldText,
        workInProgress.memoizedProps,
        workInProgress.pendingProps
      );

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

  return null;
};

export const bubbleProperties = (workInProgress: Fiber) => {
  let newChildLanes = NoLanes;
  let subtreeFlags = Flags.NoFlags;

  let child = workInProgress.child;
  while (child) {
    newChildLanes = mergeLanes(
      newChildLanes,
      mergeLanes(child.lanes, child.childLanes)
    );

    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;

    child.return = workInProgress;
    child = child.sibling;
  }

  workInProgress.subtreeFlags |= subtreeFlags;
  // workInProgress.flags = Flags.NoFlags;
  workInProgress.childLanes = newChildLanes;
};

export const prepareUpdate = (
  current: Fiber,
  workInProgress: Fiber,
  oldProps: any,
  newProps: any
) => {
  return diffProperties(
    workInProgress.stateNode,
    workInProgress.type,
    oldProps,
    newProps
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

    while (!node.sibling) {
      if (!node.return || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }

    node.sibling && (node.sibling.return = node.return);
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
  prepareUpdate(current, workInProgress, oldProps, newProps);
  markUpdate(workInProgress);
};

export const updateHostText = (
  current: Fiber,
  workInProgress: Fiber,
  oldText: string,
  newText: string
) => {
  console.log("updateHostText complete", oldText, newText);

  if (oldText !== newText) {
    markUpdate(workInProgress);
  }
};
