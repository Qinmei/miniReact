import { HookFlags } from "./flags";
import { Lane, Lanes } from "./lane";

type Update = {
  lane: Lane;
  action: any;
  eagerReducer: any;
  eagerState: any;
  next: Update;
  priority?: number;
};

export type UpdateQueue = {
  pending: Update | null;
  interleaved: Update | null;
  lanes: Lanes;
  dispatch: any;
  lastRenderedReducer: any;
  lastRenderedState: any;
};

export interface Hook {
  memoizedState: any;
  baseState: any;
  baseQueue: Update | null;
  queue: UpdateQueue | null;
  next: Hook | null;
}

export interface Effect {
  tag: HookFlags;
  create: () => (() => void) | void;
  destroy: (() => void) | void;
  deps: Array<any> | null;
  next: Effect;
}
