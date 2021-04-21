import { Lane } from "./lane";
import { WorkTag } from "./types";

export class Fiber {
  // Instance
  tag: WorkTag;
  key: string | null;
  elementType: string | null;
  type: string | Function | null;
  stateNode: Element | Text | null;

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

  // Effects
  flags: any;
  subtreeFlags: any;
  deletions: any;

  lanes: Lane;
  childLanes: Lane;

  alternate: Fiber | null;

  constructor(
    tag: WorkTag,
    type: any,
    pendingProps: Record<string, unknown> | string
  ) {
    this.tag = tag;
    this.index = 0;
    this.pendingProps = pendingProps;
    this.type = type;
  }
}
