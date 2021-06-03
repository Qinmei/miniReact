import { WorkTag } from "../../types";
import { Fiber } from "../fiber";
import { Flags, HookFlags } from "../flags";

let nextEffect: any = null;

export const commitPassiveUnmountEffects = (firstChild: Fiber) => {
  nextEffect = firstChild;
  commitPassiveUnmountEffects_begin();
};

const commitPassiveUnmountEffects_begin = () => {
  while (nextEffect) {
    const fiber = nextEffect;
    const child = fiber.child;

    if ((nextEffect.flags & Flags.ChildDeletion) !== Flags.NoFlags) {
      const deletions = fiber.deletions;
      if (deletions) {
        for (let i = 0; i < deletions.length; i++) {
          const fiberToDelete = deletions[i];
          nextEffect = fiberToDelete;
          commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
            fiberToDelete,
            fiber
          );
        }

        nextEffect = fiber;
      }
    }

    if ((fiber.subtreeFlags & Flags.Passive) !== Flags.NoFlags && child) {
      nextEffect = child;
    } else {
      commitPassiveUnmountEffects_complete();
    }
  }
};

function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
  deletedSubtreeRoot: Fiber,
  nearestMountedAncestor: Fiber | null
) {
  while (nextEffect) {
    const fiber = nextEffect;

    commitPassiveUnmountInsideDeletedTreeOnFiber(fiber, nearestMountedAncestor);

    const child = fiber.child;
    if (child) {
      nextEffect = child;
    } else {
      commitPassiveUnmountEffectsInsideOfDeletedTree_complete(
        deletedSubtreeRoot
      );
    }
  }
}

function commitPassiveUnmountEffectsInsideOfDeletedTree_complete(
  deletedSubtreeRoot: Fiber
) {
  while (nextEffect !== null) {
    const fiber = nextEffect;
    const sibling = fiber.sibling;
    const returnFiber = fiber.return;

    if (fiber === deletedSubtreeRoot) {
      detachFiberAfterEffects(fiber);
      nextEffect = null;
      return;
    }

    if (sibling) {
      nextEffect = sibling;
      return;
    }

    nextEffect = returnFiber;
  }
}

function commitPassiveUnmountInsideDeletedTreeOnFiber(
  current: Fiber,
  nearestMountedAncestor: Fiber | null
): void {
  switch (current.tag) {
    case WorkTag.FunctionComponent:
    case WorkTag.HostRoot: {
      commitHookEffectListUnmount(HookFlags.Passive, current);
      break;
    }
  }
}

function detachFiberAfterEffects(fiber: Fiber) {
  const alternate = fiber.alternate;
  if (alternate) {
    fiber.alternate = null;
    detachFiberAfterEffects(alternate);
  }

  fiber.child = null;
  fiber.deletions = null;
  fiber.sibling = null;

  fiber.stateNode = null;
}

const commitPassiveUnmountEffects_complete = () => {
  while (nextEffect) {
    const fiber = nextEffect;
    if ((fiber.flags & Flags.Passive) !== Flags.NoFlags) {
      commitPassiveUnmountOnFiber(fiber);
    }

    const sibling = fiber.sibling;
    if (sibling) {
      nextEffect = sibling;
      return;
    }

    nextEffect = fiber.return;
  }
};

const commitPassiveUnmountOnFiber = (finishedWork: Fiber) => {
  switch (finishedWork.tag) {
    case WorkTag.FunctionComponent:
    case WorkTag.HostRoot: {
      commitHookEffectListUnmount(
        HookFlags.Passive | HookFlags.HasEffect,
        finishedWork
      );
      break;
    }
  }
};

const commitHookEffectListUnmount = (flags: HookFlags, finishedWork: Fiber) => {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue ? updateQueue.lastEffect : null;
  if (lastEffect) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & flags) === flags) {
        const destroy = effect.destroy;
        effect.destroy = undefined;
        if (destroy) {
          try {
            destroy();
          } catch (error) {}
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
};
