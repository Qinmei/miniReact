import { Lane, Lanes } from "./reconclier/lane";

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

export type Update<State> = {
  // TODO: Temporary field. Will remove this by storing a map of
  // transition -> event time on the root.
  eventTime: number;
  lane: Lane;

  tag: 0 | 1 | 2 | 3;
  payload: any;
  callback: (() => void) | null;

  next: Update<State> | null;
};

export type SharedQueue<State> = {
  pending: Update<State> | null;
  interleaved: Update<State> | null;
  lanes: Lanes;
};

export type UpdateQueue<State> = {
  baseState: State;
  firstBaseUpdate: Update<State> | null;
  lastBaseUpdate: Update<State> | null;
  shared: SharedQueue<State>;
  effects: Array<Update<State>> | null;
};
