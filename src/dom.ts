import { Fiber } from "./element";
import { createHostRoot, getHostRoot } from "./react";
import { scheduleUpdateOnFiber } from "./reconclier";

export const render = ({ type, props }, container) => {
  const fiberRoot = createHostRoot(type, props);
  fiberRoot.stateNode = container;
  scheduleUpdateOnFiber(fiberRoot);
  console.log("fiberRoot", fiberRoot);
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

export const diffProperties = (
  domElement: Element,
  type: string,
  lastRawProps: any,
  nextRawProps: any
) => {
  console.log("diffProperties");
  const props = { ...lastRawProps, ...nextRawProps };
  Object.keys(props)
    .filter((item) => item !== "children")
    .forEach((item) => {
      const oldValue = lastRawProps[item];
      const newValue = nextRawProps[item];

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
