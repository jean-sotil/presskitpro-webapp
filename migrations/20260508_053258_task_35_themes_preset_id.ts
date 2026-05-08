import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Task-35 PR-A — adds the `preset_id` column to `payload.themes` plus
 * its enum type. Source of truth for section variants when set; null
 * falls back to legacy `hero_style` / `gallery_layout`.
 *
 * NOTE: Payload's generator surfaced 8 unrelated drift changes from
 * prior tasks (i18n 'es', slug-reclaim, deletion, plan tier, etc.)
 * that were never captured in their own migration files. Those are
 * intentionally NOT included here — they belong in a dedicated catch-
 * up migration that audits the live DB state first. Keeping this
 * migration single-purpose so it stays safe to apply on any env.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_themes_preset_id" AS ENUM('mediakit-pro-v1', 'editorial-nightlife-v1');
  ALTER TABLE "payload"."themes" ADD COLUMN "preset_id" "payload"."enum_themes_preset_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."themes" DROP COLUMN "preset_id";
  DROP TYPE "payload"."enum_themes_preset_id";`)
}
