import {
  appendChild,
  commitTextUpdate,
  commitUpdate,
  insertBefore,
  removeChild,
} from "../dom";
import { WorkTag } from "../types";
import { Fiber } from "./fiber";
import { Flags } from "./flags";

export const commitMutationEffects = (root: Fiber) => {
  commitMutationEffects_begin(root);
};

export const commitMutationEffects_begin = (root: Fiber) => {
  let nextEffect = root;
  while (nextEffect) {
    nextEffect.deletions?.forEach((item) => commitDeletion(root, item, null));

    const child = nextEffect.child;
    if (child && nextEffect.subtreeFlags !== Flags.NoFlags) {
      nextEffect = child;
    } else {
      nextEffect = commitMutationEffects_complete(root, nextEffect);
    }
  }
};

export const commitMutationEffects_complete = (
  root: Fiber,
  nextEffect: Fiber
) => {
  while (nextEffect) {
    commitMutationEffectsOnFiber(root, nextEffect);
    if (nextEffect.sibling) return nextEffect.sibling;
    nextEffect = nextEffect.return;
  }
  return null;
};

export const commitMutationEffectsOnFiber = (
  root: Fiber,
  finishedWork: Fiber
) => {
  const flags = finishedWork.flags;
  switch (flags) {
    case Flags.Placement:
      commitPlacement(finishedWork);
      finishedWork.flags &= ~Flags.Placement;
      break;

    case Flags.PlacementAndUpdate: {
      commitPlacement(finishedWork);
      finishedWork.flags &= ~Flags.Placement;

      const current = finishedWork.alternate;
      commitWork(current, finishedWork);
      break;
    }
    case Flags.Update: {
      const current = finishedWork.alternate;
      commitWork(current, finishedWork);
      break;
    }
  }
};

const isHostParent = (fiber: Fiber) => {
  return [WorkTag.HostRoot, WorkTag.HostComponent].includes(fiber.tag);
};

const getHostParentFiber = (fiber: Fiber) => {
  let parent = fiber.return;
  while (parent) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
};

const getHostSibling = (fiber: Fiber) => {
  let node = fiber;
  sibling: while (true) {
    while (!node.sibling) {
      if (!node.return || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;

    while (!isHostParent(node)) {
      if (node.flags & Flags.Placement) continue sibling;
      if (!node.child) continue sibling;
      node.child.return = node;
      node = node.child;
    }

    if (!(node.flags & Flags.Placement)) return node?.stateNode;
  }
};

export const insertOrAppendPlacementNode = (
  node: Fiber,
  before: any,
  parent: any
) => {
  if ([WorkTag.HostText, WorkTag.HostComponent].includes(node.tag)) {
    if (before) {
      insertBefore(parent, node.stateNode, before);
    } else {
      appendChild(parent, node.stateNode);
    }
  } else {
    const child = node.child;
    if (child) {
      insertOrAppendPlacementNode(child, before, parent);
      let sibling = child.sibling;
      while (sibling) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
};

export const commitPlacement = (finishedWork: Fiber) => {
  const parentFiber = getHostParentFiber(finishedWork);
  const parentStateNode = parentFiber?.stateNode;

  const before = getHostSibling(finishedWork);

  insertOrAppendPlacementNode(finishedWork, before, parentStateNode);
};

export const commitDeletion = (
  root: Fiber,
  childToDelete: Fiber,
  fiber: Fiber
) => {
  unmountHostComponents(root, childToDelete, fiber);
  detachFiberMutation(childToDelete);
};

export const unmountHostComponents = (
  root: Fiber,
  current: Fiber,
  nearestMountedAncestor: Fiber
) => {
  let node: Fiber = current;
  let currentParent;
  let parent = node.return;

  findParent: while (parent) {
    const parentStateNode = parent.stateNode;
    switch (parent.tag) {
      case WorkTag.HostComponent:
        currentParent = parentStateNode;
        break findParent;
    }
    parent = parent.return;
  }

  while (true) {
    if ([WorkTag.HostComponent, WorkTag.HostText].includes(node.tag)) {
      removeChild(currentParent, node.stateNode);
    } else {
      if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
    }

    if (node === current) {
      return;
    }

    while (!node.sibling) {
      if (!node.return || node.return === current) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
};

export const commitNestedUnmounts = (
  finishedRoot: Fiber,
  root: Fiber,
  nearestMountedAncestor: Fiber
) => {
  let node: Fiber = root;
  while (true) {
    if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === root) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === root) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
};

export const detachFiberMutation = (fiber: Fiber) => {
  const alternate = fiber.alternate;
  if (alternate) {
    alternate.return = null;
  }
  fiber.return = null;
};

export const commitWork = (
  current: Fiber | null,
  finishedWork: Fiber
): void => {
  switch (finishedWork.tag) {
    case WorkTag.HostComponent: {
      if (finishedWork.stateNode) {
        const newProps = finishedWork.memoizedProps;
        const oldProps = current ? current.memoizedProps : newProps;
        commitUpdate(
          finishedWork.stateNode,
          null,
          null,
          oldProps,
          newProps,
          finishedWork
        );
      }
      return;
    }
    case WorkTag.HostText: {
      const newText: string = finishedWork.memoizedProps;
      const oldText: string = current ? current.memoizedProps : newText;

      commitTextUpdate(finishedWork.stateNode, oldText, newText);
      return;
    }
  }
};
