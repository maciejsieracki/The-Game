export interface EventDetailsDeleter {
  delete(id: string): boolean;
}

export interface EventDetailsOwner {
  idPrefix: string;
  details: EventDetailsDeleter;
}

/** Trim newest-first side-panel events and drop detail records for evicted cards. */
export function trimSidePanelEventLog<T extends { id: string }>(
  events: T[],
  maxEntries: number,
  detailOwners: readonly EventDetailsOwner[],
): T[] {
  const limit = Math.max(0, Math.floor(maxEntries));
  if (events.length <= limit) return [];

  const evicted = events.splice(limit);
  for (const event of evicted) {
    for (const owner of detailOwners) {
      if (event.id.startsWith(owner.idPrefix)) owner.details.delete(event.id);
    }
  }
  return evicted;
}
