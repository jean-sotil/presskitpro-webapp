/**
 * Pure (DI-style) reconciler for the social-links collection.
 *
 * Compares the incoming ordered list (from the editor) against the rows
 * currently in the database and emits the minimum delete/update/create
 * sequence to make the database match. `displayOrder` is rewritten to
 * the array index — the array is the source of truth for ordering.
 *
 * IDs are preserved across saves: a row with `id` in the incoming list
 * becomes an UPDATE (not delete + create), so optimistic state in the
 * editor doesn't churn when the autosave round-trips.
 */

export type ReconcileRow = {
  id: number;
  profile: number;
  platform: string;
  url: string;
  displayOrder: number;
};

export type ReconcileDeps = {
  listExisting(): Promise<ReconcileRow[]>;
  deleteRow(id: number): Promise<void>;
  updateRow(id: number, data: Record<string, unknown>): Promise<void>;
  createRow(data: Record<string, unknown>): Promise<ReconcileRow>;
};

export type IncomingLink = {
  id?: number;
  platform: string;
  url: string;
};

export async function reconcileSocialLinks(
  deps: ReconcileDeps,
  args: { profileId: number; incoming: IncomingLink[] },
): Promise<ReconcileRow[]> {
  const existing = await deps.listExisting();
  const incomingIds = new Set(
    args.incoming.map((it) => it.id).filter((x): x is number => typeof x === 'number'),
  );

  // Deletes first so a unique-constraint reshuffle doesn't trip a later
  // create. (Doesn't apply to social-links today, but keeps the order
  // safe if a future schema adds one.)
  for (const row of existing) {
    if (!incomingIds.has(row.id)) {
      await deps.deleteRow(row.id);
    }
  }

  const final: ReconcileRow[] = [];
  for (let i = 0; i < args.incoming.length; i++) {
    const item = args.incoming[i]!;
    const data = {
      platform: item.platform,
      url: item.url,
      displayOrder: i,
    };
    if (typeof item.id === 'number') {
      await deps.updateRow(item.id, data);
      const before = existing.find((e) => e.id === item.id);
      final.push({
        id: item.id,
        profile: args.profileId,
        platform: item.platform,
        url: item.url,
        displayOrder: i,
        // preserve any extra fields in the future shape if needed
        ...(before ? {} : {}),
      });
    } else {
      const row = await deps.createRow({ profile: args.profileId, ...data });
      final.push(row);
    }
  }
  return final;
}
