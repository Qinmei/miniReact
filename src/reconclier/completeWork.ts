import { finalizeInitialChildren } from "../dom/component";
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

        appendAllChildren(workInProgress);

        const init = finalizeInitialChildren(
          instance,
          workInProgress.type,
          newProps
        );
        if (init) {
          markUpdate(workInProgress);
        }
      }
      bubbleProperties(workInProgress);
      break;
    }
    case WorkTag.HostText: {
      const newText = newProps;
      const oldText = current?.memoizedProps;

      if (current && workInProgress.stateNode) {
        updateHostText(current, workInProgress, oldText, newText);
      } else {
        workInProgress.stateNode = createTextInstance(newText);
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
  const updatePayload = prepareUpdate(
    current,
    workInProgress,
    oldProps,
    newProps
  );
  workInProgress.updateQueue = updatePayload;
  updatePayload.length && markUpdate(workInProgress);
};

export const updateHostText = (
  current: Fiber,
  workInProgress: Fiber,
  oldText: string,
  newText: string
) => {
  if (oldText !== newText) {
    markUpdate(workInProgress);
  }
};
