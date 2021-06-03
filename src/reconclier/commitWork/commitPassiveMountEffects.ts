
import { WorkTag } from "../../types";
import { Fiber } from "../fiber";
import { Flags, HookFlags } from "../flags";

let nextEffect: any = null;

export const commitPassiveMountEffects = (finishedWork: Fiber) => {
  nextEffect = finishedWork;
  commitPassiveMountEffects_begin(finishedWork);
};

const commitPassiveMountEffects_begin = (subtreeRoot: Fiber) => {
  while (nextEffect) {
    const fiber = nextEffect;
    const firstChild = fiber.child;
    if (
      (fiber.subtreeFlags & (Flags.ChildDeletion | Flags.Passive)) !==
        Flags.NoFlags &&
      firstChild
    ) {
      nextEffect = firstChild;
    } else {
      commitPassiveMountEffects_complete(subtreeRoot);
    }
  }
};

const commitPassiveMountEffects_complete = (subtreeRoot: Fiber) => {
  while (nextEffect) {
    const fiber = nextEffect;
    if ((fiber.flags & Flags.Passive) !== Flags.NoFlags) {
      try {
        commitPassiveMountOnFiber(fiber);
      } catch (error) {}
    }

    if (fiber === subtreeRoot) {
      nextEffect = null;
      return;
    }

    const sibling = fiber.sibling;
    if (sibling) {
      nextEffect = sibling;
      return;
    }

    nextEffect = fiber.return;
  }
};

const commitPassiveMountOnFiber = (finishedWork: Fiber) => {
  switch (finishedWork.tag) {
    case WorkTag.HostRoot:
    case WorkTag.FunctionComponent: {
      commitHookEffectListMount(
        HookFlags.Passive | HookFlags.HasEffect,
        finishedWork
      );
      break;
    }
  }
};

const commitHookEffectListMount = (tag: number, finishedWork: Fiber) => {
  const updateQueue: any = finishedWork.updateQueue;
  const lastEffect = updateQueue ? updateQueue.lastEffect : null;
  if (lastEffect) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        const create = effect.create;
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
};
