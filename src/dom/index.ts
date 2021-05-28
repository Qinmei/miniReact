import { createHostRoot, getHostRoot } from "../react";
import { scheduleUpdateOnFiber } from "../reconclier/workLoop";
import { ReactElement } from "../types";
import { diffProperties, updateProperties } from "./component";

export { diffProperties };

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

export const commitUpdate = (
  domElement: Element,
  updatePayload: any,
  type: string,
  oldProps: any,
  newProps: any,
  internalInstanceHandle: any
) => {
  updateProperties(domElement, updatePayload);
};
