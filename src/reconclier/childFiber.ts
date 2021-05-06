import { WorkTag } from "../types";
import { createFiberFromText } from "../react";
import { createFiberFromElement, createWorkInProgress, Fiber } from "./fiber";
import { Flags } from "./flags";

export const reconcileChildFibers = (
  returnFiber: Fiber,
  currentFirstChild: any,
  newChild: any
): Fiber | null => {
  console.log("reconcileChildFibers", newChild);

  if (Array.isArray(newChild)) {
    return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
  } else if (newChild) {
    return reconcileChildrenElement(returnFiber, currentFirstChild, newChild);
  } else {
    deleteRemainingChildren(returnFiber, currentFirstChild);
    return null;
  }
};

export const reconcileChildrenElement = (
  returnFiber: Fiber,
  currentFirstChild: any,
  newChild: any
): Fiber | null => {
  console.log("reconcileChildrenElement", newChild, currentFirstChild);

  if (!returnFiber.alternate) returnFiber.flags |= Flags.Placement;

  const isObject = typeof newChild === "object" && newChild;
  if (isObject) {
    return reconcileSingleElement(returnFiber, currentFirstChild, newChild);
  }

  if (typeof newChild === "string" || typeof newChild === "number") {
    return reconcileSingleTextNode(
      returnFiber,
      currentFirstChild,
      "" + newChild
    );
  }

  return null;
};

export const reconcileSingleTextNode = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  textContent: string
) => {
  console.log(
    "reconcileSingleTextNode",
    returnFiber,
    currentFirstChild,
    textContent
  );

  if (currentFirstChild && currentFirstChild.tag === WorkTag.HostText) {
    deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
    const existing = useFiber(currentFirstChild, textContent);
    existing.return = returnFiber;
    return existing;
  } else {
    deleteRemainingChildren(returnFiber, currentFirstChild);
    const created = createFiberFromText("text", textContent);
    created.return = returnFiber;
    console.log("reconcileSingleTextNode", created);
    return created;
  }
};

export const deleteRemainingChildren = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null
) => {
  let childToDelete = currentFirstChild;
  while (childToDelete) {
    console.log("deleteRemainingChildren loop");
    deleteChild(returnFiber, childToDelete);
    childToDelete = childToDelete.sibling;
  }
  return null;
};

// custom
export const deleteChild = (returnFiber: Fiber, childToDelete: Fiber) => {
  console.log("deleteChild", returnFiber, childToDelete);
  const deletions = returnFiber.deletions;
  if (!deletions) {
    returnFiber.deletions = [childToDelete];
    returnFiber.flags |= Flags.ChildDeletion;
  } else {
    deletions.push(childToDelete);
  }
};

// 需要复用之前的节点信息，否则就会导致更新的时候一直创建
// 此外需要判断的是，如果之前的节点其实是数组，那么就需要遍历链表来进行处理，顺便把多余的节点删除
export const reconcileSingleElement = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: any
): Fiber | null => {
  console.log(
    "reconcileSingleElement",
    element,
    currentFirstChild,
    element.key === currentFirstChild?.key,
    currentFirstChild?.type === element.type
  );
  let child = currentFirstChild;
  while (child) {
    console.log("reconcileSingleElement loop", child.key === element.key);
    if (child.key === element.key) {
      if (child.type === element.type) {
        deleteRemainingChildren(returnFiber, child.sibling);
        const existing = useFiber(child, element.props);
        existing.return = returnFiber;
        console.log("reconcileSingleElement equals", element.props, existing);
        return existing;
      } else {
        console.log("reconcileSingleElement deletes");
        deleteRemainingChildren(returnFiber, child);
      }
    } else {
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }

  const created = createFiberFromElement(element);
  created.return = returnFiber;
  return created;
};

export const reconcileChildrenArray = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: any[]
) => {
  console.log(
    "reconcileChildrenArray",
    returnFiber,
    currentFirstChild,
    newChildren
  );
  let resultingFirstChild: Fiber | null = null;
  let previousNewFiber: Fiber | null = null;

  let oldFiber = currentFirstChild;
  let nextOldFiber = null;
  let newIndex = 0;
  let lastPlacedIndex = 0;
  // 直接复用之前的节点
  for (; oldFiber && newIndex < newChildren.length; newIndex++) {
    if (oldFiber.index > newIndex) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }

    const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIndex]);

    if (!newFiber) {
      if (!oldFiber) oldFiber = nextOldFiber;
      break;
    }

    console.log(
      "reconcileChildrenArray delete",
      oldFiber && !newFiber.alternate
    );

    if (oldFiber && !newFiber.alternate) deleteChild(returnFiber, oldFiber);

    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);

    if (previousNewFiber) {
      previousNewFiber.sibling = newFiber;
    } else {
      resultingFirstChild = newFiber;
    }
    previousNewFiber = newFiber;
    oldFiber = nextOldFiber;
  }

  if (newIndex === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }

  if (!oldFiber) {
    for (; newIndex < newChildren.length; newIndex++) {
      const newFiber = createChild(returnFiber, newChildren[newIndex]);

      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);

      if (previousNewFiber) {
        previousNewFiber.sibling = newFiber;
      } else {
        resultingFirstChild = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    return resultingFirstChild;
  }

  const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

  for (; newIndex < newChildren.length; newIndex++) {
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIndex,
      newChildren[newIndex]
    );

    if (newFiber) {
      if (newFiber.alternate) {
        existingChildren.delete(
          newFiber.key === null ? newIndex : newFiber.key
        );
      }
      if (previousNewFiber) {
        previousNewFiber.sibling = newFiber;
      } else {
        resultingFirstChild = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
  }

  existingChildren.forEach((child) => deleteChild(returnFiber, child));

  return resultingFirstChild;
};

export const useFiber = (fiber: Fiber, pendingProps: any): Fiber => {
  const clone = createWorkInProgress(fiber, pendingProps);
  clone.index = 0;
  clone.sibling = null;
  return clone;
};

export const updateSlot = (
  returnFiber: Fiber,
  oldFiber: Fiber | null,
  newChild: any
) => {
  console.log("updateSlot", newChild, oldFiber?.key);
  const key = oldFiber?.key;
  if (["string", "number"].includes(typeof newChild)) {
    if (key) return null;
    return updateTextNode(returnFiber, oldFiber, "" + newChild);
  }

  if (newChild && typeof newChild === "object") {
    if (newChild.key === key) {
      return updateElement(returnFiber, oldFiber, newChild);
    }
  }

  return null;
};

export const updateTextNode = (
  returnFiber: Fiber,
  current: Fiber | null,
  textContent: string
) => {
  console.log("updateTextNode", current, textContent);
  if (!current) {
    const created = createFiberFromText("text", textContent);
    created.return = returnFiber;
    return created;
  } else {
    console.log("updateTextNode update", textContent);
    const existing = useFiber(current, textContent);
    existing.return = returnFiber;
    existing.flags |= Flags.Placement;
    return existing;
  }
};

export const updateElement = (
  returnFiber: Fiber,
  current: Fiber | null,
  element: any
) => {
  if (current) {
    const existing = useFiber(current, element.props);
    existing.return = returnFiber;
    return existing;
  } else {
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }
};

export const createChild = (returnFiber: Fiber, newChild: any) => {
  if (["string", "number"].includes(typeof newChild)) {
    const created = createFiberFromText("text", "" + newChild);
    created.return = returnFiber;
    return created;
  }

  if (newChild && typeof newChild === "object") {
    const created = createFiberFromElement(newChild);
    created.return = returnFiber;
    return created;
  }
};

function mapRemainingChildren(returnFiber: Fiber, currentFirstChild: Fiber) {
  const existingChildren: Map<string | number, Fiber> = new Map();

  // 遍历一遍，然后利用key来构建Map
  let existingChild = currentFirstChild;
  while (existingChild) {
    if (existingChild.key !== null) {
      existingChildren.set(existingChild.key, existingChild);
    } else {
      existingChildren.set(existingChild.index, existingChild);
    }
    existingChild = existingChild.sibling;
  }
  return existingChildren;
}

function updateFromMap(
  existingChildren: Map<string | number, Fiber>,
  returnFiber: Fiber,
  newIdx: number,
  newChild: any
) {
  if (["string", "number"].includes(typeof newChild)) {
    const matchedFiber = existingChildren.get(newIdx) || null;
    return updateTextNode(returnFiber, matchedFiber, "" + newChild);
  }

  if (newChild && typeof newChild === "object") {
    const matchedFiber =
      existingChildren.get(newChild.key === null ? newIdx : newChild.key) ||
      null;
    return updateElement(returnFiber, matchedFiber, newChild);
  }
}

const placeChild = (
  newFiber: Fiber,
  lastPlacedIndex: number,
  newIndex: number
): number => {
  newFiber.index = newIndex;

  const current = newFiber.alternate;
  if (current) {
    const oldIndex = current.index;
    if (oldIndex < lastPlacedIndex) {
      newFiber.flags |= Flags.Placement;
      return lastPlacedIndex;
    } else {
      return oldIndex;
    }
  } else {
    newFiber.flags |= Flags.Placement;
    return lastPlacedIndex;
  }
};

export const cloneChildFibers = (
  current: Fiber | null,
  workInProgress: Fiber
): void => {
  if (workInProgress.child === null) {
    return;
  }

  let currentChild = workInProgress.child;
  let newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
  workInProgress.child = newChild;

  newChild.return = workInProgress;
  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(
      currentChild,
      currentChild.pendingProps
    );
    newChild.return = workInProgress;
  }
  newChild.sibling = null;
};
