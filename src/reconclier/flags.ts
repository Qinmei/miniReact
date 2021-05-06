export type HookFlags = number;

export const NoFlags = /*  */ 0b000;
export const HasEffect = /* */ 0b001;

export const Layout = /*    */ 0b010;
export const Passive = /*   */ 0b100;

export enum Flags {
  NoFlags = 0,
  PerformedWork = 1,
  Placement = 2,
  Update = 4,
  PlacementAndUpdate = Flags.Placement | Flags.Update,
  Deletion = 8,
  ChildDeletion = 16,
}
