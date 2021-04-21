export interface ReactElement {
  type: string;
  props: Record<string, unknown>;
  key: string;
}

export enum WorkTag {
  FunctionComponent,
  HostRoot,
  HostComponent,
  HostText,
}

export interface Fiber {
  type: any;
  tag: WorkTag;
  key?: string;
  stateNode: any;
  return?: Fiber;
  sibling?: Fiber;
  child?: Fiber;
}
