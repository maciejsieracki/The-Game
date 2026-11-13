/**
 * Coalesce expensive renderer synchronization while simulation updates several
 * model objects before the next visible frame.
 *
 * `markDirty` is cheap and may be called after each domain mutation. `flush`
 * runs the supplied sync once for all pending mutations and leaves the batch
 * dirty if the sync throws, so a later UI boundary can retry it.
 */
export interface DirtyRenderSync {
  markDirty(): void;
  flush(): boolean;
  isDirty(): boolean;
}

export function createDirtyRenderSync(sync: () => void): DirtyRenderSync {
  let dirty = false;
  return {
    markDirty(): void {
      dirty = true;
    },
    flush(): boolean {
      if (!dirty) return false;
      sync();
      dirty = false;
      return true;
    },
    isDirty(): boolean {
      return dirty;
    },
  };
}
