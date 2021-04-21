import { Fiber } from "./element";
import { scheduleUpdateOnFiber } from "./reconclier";
import { WorkTag } from "./types";

let fiberRoot = {} as Fiber;

export const rerender = () => {
  scheduleUpdateOnFiber(fiberRoot);
};

export const createElement = (
  type: any,
  props: Record<string, unknown>,
  ...children
) => {
  const res = {
    type,
    props: {
      ...props,
      children,
    },
  };
  return res;
};

export const createReactElement = (
  type: string,
  props: Record<string, unknown>
) => {
  const res = {
    type,
    tag: WorkTag.FunctionComponent,
    props,
  };
  return createFiber(res);
};

export const createHostText = (type: string, text: string) => {
  const res = {
    type,
    tag: WorkTag.HostText,
    props: text,
  };
  return createFiber(res);
};

export const createHostComponent = (
  type: string,
  props: Record<string, unknown>
) => {
  const res = {
    type,
    tag: WorkTag.HostComponent,
    props,
  };
  return createFiber(res);
};

export const createHostRoot = (type: any, props: Record<string, unknown>) => {
  const res = {
    type,
    tag: WorkTag.HostRoot,
    props,
  };
  fiberRoot = createFiber(res);
  return fiberRoot;
};

export const getHostRoot = () => fiberRoot;

interface FiberParams {
  tag: WorkTag;
  type: any;
  props: Record<string, unknown> | string;
}
export const createFiber = ({ tag, type, props }: FiberParams) =>
  new Fiber(tag, type, props);
