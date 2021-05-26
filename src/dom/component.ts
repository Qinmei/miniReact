export const diffProperties = (
  domElement: any,
  type: any,
  lastRawProps: any = {},
  nextRawProps: any = {}
) => {
  const lastProps = lastRawProps;
  const nextProps = nextRawProps;
  let updatePayload = [];

  let styleName;
  let styleUpdates;

  for (let propKey in lastProps) {
    if (
      nextProps.hasOwnProperty(propKey) ||
      !lastProps.hasOwnProperty(propKey) ||
      lastProps[propKey] == null
    ) {
      continue;
    }

    if (propKey === "style") {
      const lastStyle = lastProps[propKey];
      for (styleName in lastStyle) {
        if (lastStyle.hasOwnProperty(styleName)) {
          if (!styleUpdates) {
            styleUpdates = {};
          }
          styleUpdates[styleName] = "";
        }
      }
    } else if (propKey === "children") {
    } else {
      updatePayload.push(propKey, null);
    }
  }

  for (let propKey in nextProps) {
    const nextProp = nextProps[propKey];
    const lastProp = lastProps != null ? lastProps[propKey] : undefined;
    if (
      !nextProps.hasOwnProperty(propKey) ||
      nextProp === lastProp ||
      (nextProp == null && lastProp == null)
    ) {
      continue;
    }
    if (propKey === "style") {
      if (lastProp) {
        for (styleName in lastProp) {
          if (
            lastProp.hasOwnProperty(styleName) &&
            (!nextProp || !nextProp.hasOwnProperty(styleName))
          ) {
            if (!styleUpdates) {
              styleUpdates = {};
            }
            styleUpdates[styleName] = "";
          }
        }
        for (styleName in nextProp) {
          if (
            nextProp.hasOwnProperty(styleName) &&
            lastProp[styleName] !== nextProp[styleName]
          ) {
            if (!styleUpdates) {
              styleUpdates = {};
            }
            styleUpdates[styleName] = nextProp[styleName];
          }
        }
      } else {
        if (!styleUpdates) {
          if (!updatePayload) {
            updatePayload = [];
          }
          updatePayload.push(propKey, styleUpdates);
        }
        styleUpdates = nextProp;
      }
    } else if (propKey === "children") {
      // 没有合成事件，只能补充进来
    } else if (/^on/.test(propKey)) {
      updatePayload.push(propKey, {
        lastProp,
        nextProp,
      });
    } else {
      updatePayload.push(propKey, nextProp);
    }
  }
  if (styleUpdates) {
    updatePayload.push("style", styleUpdates);
  }
  return updatePayload;
};

export const updateProperties = (
  domElement: Element,
  updatePayload: Array<any>
) => {
  updateDOMProperties(domElement, updatePayload);
};

export const updateDOMProperties = (
  domElement: Element,
  updatePayload: Array<any> = []
): void => {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    console.log("updateDOMProperties", propKey, propValue);
    if (propKey === "style") {
      setValueForStyles(domElement, propValue);
    } else if (propKey !== "children") {
      setValueForProperty(domElement, propKey, propValue);
    }
  }
};

export const setValueForStyles = (node: any, styles: any) => {
  const style = node.style;
  for (let styleName in styles) {
    if (!styles.hasOwnProperty(styleName)) {
      continue;
    }
    const isCustomProperty = styleName.indexOf("--") === 0;
    const styleValue = styles[styleName];
    if (styleName === "float") {
      styleName = "cssFloat";
    }
    if (isCustomProperty) {
      style.setProperty(styleName, styleValue);
    } else {
      style[styleName] = styleValue;
    }
  }
};

export const setValueForProperty = (
  node: Element,
  name: string,
  value: any
) => {
  // 对绑定事件做了额外的处理，主要是将旧的事件移除掉，然后绑定新的事件
  if (/^on/.test(name) && value) {
    if (typeof value === "function") {
      name = name.slice(2).toLowerCase() as string;
      node.addEventListener(name, value);
    } else {
      const { lastProp, nextProp } = value;
      name = name.slice(2).toLowerCase() as string;
      node.removeEventListener(name, lastProp);
      node.addEventListener(name, nextProp);
    }
  } else if (value) {
    node.setAttribute(name, value);
  } else {
    node.removeAttribute(name);
  }
};

export function finalizeInitialChildren(
  domElement: any,
  type: any,
  props: any
): boolean {
  setInitialProperties(domElement, type, props);
  return true;
}

export const setInitialProperties = (
  domElement: Element,
  tag: string,
  rawProps: Object
) => {
  let props = rawProps;

  setInitialDOMProperties(tag, domElement, props);
};

export const setInitialDOMProperties = (
  tag: string,
  domElement: Element,
  nextProps: any
) => {
  for (const propKey in nextProps) {
    if (!nextProps.hasOwnProperty(propKey)) {
      continue;
    }
    const nextProp = nextProps[propKey];
    if (propKey === "style") {
      setValueForStyles(domElement, nextProp);
    } else if (propKey === "children") {
    } else if (nextProp != null) {
      setValueForProperty(domElement, propKey, nextProp);
    }
  }
};
