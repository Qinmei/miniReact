import { Fiber } from "../reconclier/fiber";
import { scheduleUpdateOnFiber } from "../reconclier";
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
  type: WorkTag,
  props: Record<string, unknown>
) => {
  return createFiber(type, WorkTag.FunctionComponent, props);
};

export const createHostText = (type: WorkTag, text: string) => {
  return createFiber(type, WorkTag.HostText, text);
};

export const createHostComponent = (
  type: WorkTag,
  props: Record<string, unknown>
) => {
  return createFiber(type, WorkTag.HostComponent, props);
};

export const createHostRoot = (type: any, props: Record<string, unknown>) => {
  fiberRoot = createFiber(type, WorkTag.HostRoot, props);
  return fiberRoot;
};

export const getHostRoot = () => fiberRoot;

interface FiberParams {
  tag: WorkTag;
  type: any;
  props: Record<string, unknown> | string;
}
export const createFiber = (
  tag: WorkTag,
  type: any,
  props: Record<string, unknown> | string | null
) => new Fiber(tag, type, props);
