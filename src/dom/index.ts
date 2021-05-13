import { createHostRootFiber, Fiber, FiberRoot } from "../reconclier/fiber";
import { createHostRoot, getHostRoot } from "../react";
import {
  requestUpdateLane,
  scheduleUpdateOnFiber,
} from "../reconclier/workLoop";
import { ReactElement } from "../types";

export const render = (element: ReactElement, container: Element) => {
  const fiberRoot = createHostRoot(element.type, element.props);
  fiberRoot.stateNode = container;
  scheduleUpdateOnFiber(fiberRoot);
};

export const getOwnerDocumentFromRootContainer = (): Document => {
  const fiberRoot = getHostRoot();
  return fiberRoot.stateNode;
};

export const createTextInstance = (text: string) => {
  const textNode = createTextNode(text);
  return textNode;
};

export const createTextNode = (text: string): Text => {
  const container = getOwnerDocumentFromRootContainer().ownerDocument;
  return container.createTextNode(text);
};

export const commitTextUpdate = (
  textInstance: Text,
  oldText: string,
  newText: string
) => {
  textInstance.nodeValue = newText;
};

export const createInstance = (type: string, props: any) => {
  const domElement = createDOMElement(type, props);
  return domElement;
};

export const createDOMElement = (type: string, props: any) => {
  const container = getOwnerDocumentFromRootContainer().ownerDocument;
  return container.createElement(type, props);
};

export const appendChild = (
  parent: Element | Text | null,
  child: Element | Text
) => {
  parent && child && parent.appendChild(child);
};

export function insertBefore(
  parentInstance: Element,
  child: Element | Text | null,
  beforeChild: any
): void {
  parentInstance && child && parentInstance.insertBefore(child, beforeChild);
}

export function removeChild(
  parentInstance: Element | Text | null,
  child: Element | Text | null
): void {
  parentInstance && child && parentInstance.removeChild(child);
}

// 需要区分成diff以及update两个阶段，在completeWork中diff，在commitWork 中 update
export const diffProperties = (
  domElement: Element,
  type: string,
  lastRawProps: any = {},
  nextRawProps: any = {}
) => {
  const props = { ...lastRawProps, ...nextRawProps };
  Object.keys(props)
    .filter((item) => item !== "children")
    .forEach((item) => {
      const oldValue = lastRawProps?.[item];
      const newValue = nextRawProps?.[item];

      if (item === "style") {
        for (const styleProperty in { ...oldValue, ...newValue }) {
          if (
            !(
              oldValue &&
              newValue &&
              oldValue[styleProperty] === newValue[styleProperty]
            )
          ) {
            (domElement as any)[item][styleProperty] =
              newValue?.[styleProperty] || "";
          }
        }
      } else if (/^on/.test(item)) {
        item = item.slice(2).toLowerCase() as string;
        if (oldValue) domElement.removeEventListener(item, oldValue);
        domElement.addEventListener(item, newValue);
      } else if (newValue == null || newValue === false) {
        domElement.removeAttribute(item);
      } else {
        domElement.setAttribute(item, newValue);
      }
    });
};

export const commitUpdate = (
  domElement: Element,
  updatePayload: any,
  type: string,
  oldProps: any,
  newProps: any,
  internalInstanceHandle: any
) => {
  diffProperties(domElement, type, oldProps, newProps);
};
