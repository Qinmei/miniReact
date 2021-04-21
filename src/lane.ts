export type Lanes = number;
export type Lane = number;

export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
export const SyncBatchedLane: Lane = /*                 */ 0b0000000000000000000000000000010;

export const InputDiscreteHydrationLane: Lane = /*      */ 0b0000000000000000000000000000100;
const InputDiscreteLane: Lanes = /*                     */ 0b0000000000000000000000000001000;

const InputContinuousHydrationLane: Lane = /*           */ 0b0000000000000000000000000010000;
const InputContinuousLane: Lanes = /*                   */ 0b0000000000000000000000000100000;

export const DefaultHydrationLane: Lane = /*            */ 0b0000000000000000000000001000000;
export const DefaultLane: Lanes = /*                    */ 0b0000000000000000000000010000000;

const TransitionHydrationLane: Lane = /*                */ 0b0000000000000000000000100000000;
const TransitionLanes: Lanes = /*                       */ 0b0000000011111111111111000000000;
const TransitionLane1: Lane = /*                        */ 0b0000000000000000000001000000000;
const TransitionLane2: Lane = /*                        */ 0b0000000000000000000010000000000;
const TransitionLane3: Lane = /*                        */ 0b0000000000000000000100000000000;
const TransitionLane4: Lane = /*                        */ 0b0000000000000000001000000000000;
const TransitionLane5: Lane = /*                        */ 0b0000000000000000010000000000000;
const TransitionLane6: Lane = /*                        */ 0b0000000000000000100000000000000;
const TransitionLane7: Lane = /*                        */ 0b0000000000000001000000000000000;
const TransitionLane8: Lane = /*                        */ 0b0000000000000010000000000000000;
const TransitionLane9: Lane = /*                        */ 0b0000000000000100000000000000000;
const TransitionLane10: Lane = /*                       */ 0b0000000000001000000000000000000;
const TransitionLane11: Lane = /*                       */ 0b0000000000010000000000000000000;
const TransitionLane12: Lane = /*                       */ 0b0000000000100000000000000000000;
const TransitionLane13: Lane = /*                       */ 0b0000000001000000000000000000000;
const TransitionLane14: Lane = /*                       */ 0b0000000010000000000000000000000;

const RetryLanes: Lanes = /*                            */ 0b0000111100000000000000000000000;
const RetryLane1: Lane = /*                             */ 0b0000000100000000000000000000000;
const RetryLane2: Lane = /*                             */ 0b0000001000000000000000000000000;
const RetryLane3: Lane = /*                             */ 0b0000010000000000000000000000000;
const RetryLane4: Lane = /*                             */ 0b0000100000000000000000000000000;

export const SomeRetryLane: Lane = RetryLane1;

export const SelectiveHydrationLane: Lane = /*          */ 0b0001000000000000000000000000000;

const NonIdleLanes = /*                                 */ 0b0001111111111111111111111111111;

export const IdleHydrationLane: Lane = /*               */ 0b0010000000000000000000000000000;
const IdleLane: Lanes = /*                              */ 0b0100000000000000000000000000000;

export const OffscreenLane: Lane = /*                   */ 0b1000000000000000000000000000000;

export function includesSomeLane(a: Lanes | Lane, b: Lanes | Lane) {
  return (a & b) !== NoLanes;
}

export function isSubsetOfLanes(set: Lanes, subset: Lanes | Lane) {
  return (set & subset) === subset;
}

export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;
}

export function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
  return set & ~subset;
}

export function intersectLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a & b;
}
