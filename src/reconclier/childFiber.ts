import { removeChild } from "../dom";
import { createHostText } from "../react";
import { createFiberFromElement, Fiber } from "./fiber";

export const reconcileChildFibers = (
  returnFiber: Fiber,
  currentFirstChild: any,
  newChild: any
): Fiber | null => {
  console.log("reconcileChildFibers", returnFiber.stateNode, returnFiber.child);
  if (Array.isArray(newChild)) {
    return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
  } else {
    return reconcileChild(returnFiber, currentFirstChild, newChild);
  }
};

export const reconcileChild = (
  returnFiber: Fiber,
  currentFirstChild: any,
  newChild: any
): Fiber | null => {
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
  deleteRemainingChildren(returnFiber, currentFirstChild);
  const created = createHostText("text", textContent);
  created.return = returnFiber;
  return created;
};

export const deleteRemainingChildren = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null
) => {
  let childToDelete = currentFirstChild;
  while (childToDelete) {
    deleteChild(returnFiber, childToDelete);
    childToDelete = childToDelete.sibling;
  }
  return null;
};

// custom
export const deleteChild = (parent: Fiber, child: Fiber) => {
  const parentNode = parent.stateNode;
  const childNode = child.stateNode;
  removeChild(parentNode, childNode);
  parent.child = child?.sibling;
};

// 需要复用之前的节点信息，否则就会导致更新的时候一直创建
export const reconcileSingleElement = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: any
): Fiber | null => {
  deleteRemainingChildren(returnFiber, currentFirstChild);
  const created = createFiberFromElement(element);
  created.return = returnFiber;
  return created;
};

export const reconcileChildrenArray = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any[]
) => {
  let child: any;
  let head: any;
  newChild.forEach((item) => {
    const created = reconcileChild(returnFiber, currentFirstChild, item);
    if (head) {
      child.sibling = created;
      child = created;
    } else {
      child = created;
      head = child;
    }
  });
  return head;
};
