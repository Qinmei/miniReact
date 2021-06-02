export enum Flags {
  NoFlags = 0,
  PerformedWork = 1,
  Placement = 2,
  Update = 4,
  PlacementAndUpdate = Flags.Placement | Flags.Update,
  Deletion = 8,
  ChildDeletion = 16,
  Passive = 1024,
  PassiveStatic = 1048576,
}

export enum HookFlags {
  NoFlags = 0,
  HasEffect = 1,
  Layout = 2,
  Passive = 4,
}
