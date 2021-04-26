import { Lane, NoLanes } from "./lane";
import { WorkTag } from "../types";
import { createFiber } from "../react";
import { Hook } from "./hooks";

export class Fiber {
  // Instance
  tag: WorkTag;
  type: string | Function | null;

  key: string;
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
  flags: any;
  subtreeFlags: any;
  deletions: any;

  lanes: Lane;
  childLanes: Lane;

  alternate: Fiber | null;

  constructor(
    type: any,
    tag: WorkTag,
    pendingProps: Record<string, unknown> | string | null
  ) {
    this.tag = tag;
    this.index = 0;
    this.pendingProps = pendingProps;
    this.type = type;
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
  return createFiber(WorkTag.HostRoot, null, null);
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
export const createWorkInProgress = (current: Fiber, pendingProps: any) => {
  let workInProgress = current.alternate;

  if (workInProgress) {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;

    workInProgress.deletions = null;
  } else {
    workInProgress = createFiber(current.tag, current.type, pendingProps);
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
