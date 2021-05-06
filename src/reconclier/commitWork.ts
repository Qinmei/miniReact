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
    console.log("commitMutationEffects_begin nextEffect");
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
    console.log("commitMutationEffects_complete nextEffect");

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
  console.log("commitMutationEffectsOnFiber", finishedWork.flags, finishedWork);
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

const getHostParentFiber = (fiber: Fiber) => {
  let parent = fiber.return;
  while (parent) {
    if ([WorkTag.HostRoot, WorkTag.HostComponent].includes(parent.tag)) {
      return parent;
    }
    parent = parent.return;
  }
};

const getHostSibling = (fiber: Fiber) => {
  let sibling = fiber.sibling;
  while (sibling) {
    if ([WorkTag.HostRoot, WorkTag.HostComponent].includes(sibling.tag)) {
      return sibling;
    }
    sibling = sibling.sibling;
  }
  return null;
};

export const insertOrAppendPlacementNode = (
  node: Fiber,
  before: any,
  parent: any
) => {
  console.log("insertOrAppendPlacementNode", node, before, parent);
  if ([WorkTag.HostRoot, WorkTag.HostComponent].includes(node.tag)) {
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
  console.log("commitPlacement", finishedWork);

  const parentFiber = getHostParentFiber(finishedWork);
  const parentStateNode = parentFiber?.stateNode;

  const before = getHostSibling(finishedWork);

  insertOrAppendPlacementNode(finishedWork, before?.stateNode, parentStateNode);
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
  childToDelete: Fiber,
  fiber: Fiber
) => {
  let node = childToDelete;
  if (node.tag === WorkTag.HostComponent || node.tag === WorkTag.HostText) {
    removeChild(node?.return?.stateNode, node?.stateNode);
  } else {
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
  console.log("commitWorkCall", finishedWork);
  switch (finishedWork.tag) {
    case WorkTag.HostComponent: {
      console.log("commitWorkCall HostComponent");

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
      console.log("commitWorkCall HostText", oldText, newText);

      commitTextUpdate(finishedWork.stateNode, oldText, newText);
      return;
    }
  }
};
