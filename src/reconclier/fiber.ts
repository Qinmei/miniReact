import { Lane, NoLanes } from "./lane";
import { WorkTag } from "../types";
import { createFiber, createHostComponent, createReactElement } from "../react";
import { Hook } from "./hooks";
import { Flags } from "./flags";

export class Fiber {
  // Instance
  tag: WorkTag;
  type: string | Function | null;

  key: string | null;
  elementType: string | null;
  stateNode: FiberRoot | Element | Text | null;

  // Fiber
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  index: number;

  ref: any;

  pendingProps: any;
  memoizedProps: any;
  updateQueue: any;
  memoizedState: any;
  dependencies: any;

  // hooks

  hooks: Hook | null;

  // Effects
  flags: Flags;
  subtreeFlags: any;
  deletions: any;

  lanes: Lane;
  childLanes: Lane;

  alternate: Fiber | null;

  constructor(
    type: any,
    tag: WorkTag,
    pendingProps: Record<string, unknown> | string | null,
    key: string | null = null
  ) {
    this.tag = tag;
    this.index = 0;
    this.pendingProps = pendingProps;
    this.type = type;
    this.flags = Flags.NoFlags;
    this.key = key;
  }
}

export class FiberRoot {
  containerInfo: any;
  pendingChildren: any;
  current: Fiber | null;
  pingCache: any;
  finishedWork: any;
  timeoutHandle: any;
  context: any;
  pendingContext: any;
  hydrate: any;
  callbackNode: any;
  callbackPriority: any;
  eventTimes: any;
  expirationTimes: any;

  pendingLanes: any;
  suspendedLanes: any;
  pingedLanes: any;
  expiredLanes: any;
  mutableReadLanes: any;
  finishedLanes: any;

  entangledLanes: any;
  entanglements: any;

  constructor(containerInfo: any) {
    this.containerInfo = containerInfo;
    this.pendingChildren = null;
    this.current = null;
    this.pingCache = null;
    this.finishedWork = null;
    this.timeoutHandle = null;
    this.context = null;
    this.pendingContext = null;
    this.hydrate = null;
    this.callbackNode = null;
    this.callbackPriority = null;
    this.eventTimes = null;
    this.expirationTimes = null;

    this.pendingLanes = NoLanes;
    this.suspendedLanes = NoLanes;
    this.pingedLanes = NoLanes;
    this.expiredLanes = NoLanes;
    this.mutableReadLanes = NoLanes;
    this.finishedLanes = NoLanes;

    this.entangledLanes = NoLanes;
    this.entanglements = null;
  }
}

export const createHostRootFiber = () => {
  return createFiber(null, WorkTag.HostRoot, null);
};

export const createFiberRoot = (containerInfo: any): FiberRoot => {
  const root = new FiberRoot(containerInfo);
  const uninitializedFiber = createHostRootFiber();

  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  // initializeUpdateQueue(uninitializedFiber);

  return root;
};

// 创建一个workInProgress
export const createWorkInProgress = (current: Fiber, pendingProps?: any) => {
  let workInProgress = current.alternate;

  if (workInProgress) {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;

    workInProgress.deletions = null;
  } else {
    workInProgress = createFiber(
      current.type,
      current.tag,
      pendingProps,
      current?.key
    );
    workInProgress.stateNode = current.stateNode;

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  }

  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;

  return workInProgress;
};

export const createFiberFromElement = (element: any): Fiber | null => {
  const { type, props, key } = element;
  return createFiberFromTypeAndProps(type, props, key);
};

export const createFiberFromTypeAndProps = (
  type: any,
  props: any,
  key: string | null = null
): Fiber | null => {
  if (typeof type === "function") {
    return createReactElement(type, props, key);
  } else if (typeof type === "string") {
    return createHostComponent(type, props, key);
  }
  return null;
};
