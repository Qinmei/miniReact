import { Fiber } from "../reconclier/fiber";
import { scheduleUpdateOnFiber } from "../reconclier/workLoop";
import { WorkTag } from "../types";

let fiberRoot = {} as Fiber;

export const rerender = () => {
  scheduleUpdateOnFiber(fiberRoot);
};

export const createElement = (
  type: any,
  props: Record<string, unknown>,
  ...children: any[]
) => {
  let newProps = props || {};
  const { ref = null, key = null, ...restProps } = newProps;

  const res = {
    type,
    key,
    ref,
    props: {
      ...restProps,
      children: children.length > 1 ? children : children[0],
    },
  };
  return res;
};

export const createReactElement = (
  type: WorkTag,
  props: Record<string, unknown>,
  key: string | null = null
) => {
  return createFiber(type, WorkTag.FunctionComponent, props, key);
};

export const createFiberFromText = (
  type: WorkTag,
  text: string,
  key: string | null = null
) => {
  return createFiber(type, WorkTag.HostText, text, key);
};

export const createHostComponent = (
  type: any,
  props: Record<string, unknown>,
  key: string | null = null
) => {
  return createFiber(type, WorkTag.HostComponent, props, key);
};

export const createHostRoot = (type: any, props: Record<string, unknown>) => {
  fiberRoot = createFiber(type, WorkTag.HostRoot, props);
  return fiberRoot;
};

export const getHostRoot = () => fiberRoot;

export const createFiber = (
  type: any,
  tag: WorkTag,
  props: Record<string, unknown> | string | null,
  key: string | null = null
) => new Fiber(type, tag, props, key);
