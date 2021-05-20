export const diffProperties = (
  domElement: Element,
  type: string,
  lastRawProps: any = {},
  nextRawProps: any = {}
) => {
  const lastProps = lastRawProps;
  const nextProps = nextRawProps;
  const updatePasyload = [];

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
    }
  }
};
