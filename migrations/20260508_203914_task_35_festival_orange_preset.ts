import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Task-35 follow-up — extends `enum_themes_preset_id` with the new
 * `festival-club-orange` preset (light cream + orange aesthetic).
 * Additive change: every existing row's `preset_id` is unaffected.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "payload"."enum_themes_preset_id" ADD VALUE 'festival-club-orange' BEFORE 'editorial-nightlife-v1';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."themes" ALTER COLUMN "preset_id" SET DATA TYPE text;
  DROP TYPE "payload"."enum_themes_preset_id";
  CREATE TYPE "payload"."enum_themes_preset_id" AS ENUM('mediakit-pro-v1', 'editorial-nightlife-v1');
  ALTER TABLE "payload"."themes" ALTER COLUMN "preset_id" SET DATA TYPE "payload"."enum_themes_preset_id" USING "preset_id"::"payload"."enum_themes_preset_id";`)
}
