import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "payload"."enum_profiles_press_kit_provider" ADD VALUE 'notion' BEFORE 'other';
  ALTER TYPE "payload"."enum_profiles_press_kit_provider" ADD VALUE 'mediafire' BEFORE 'other';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."profiles" ALTER COLUMN "press_kit_provider" SET DATA TYPE text;
  ALTER TABLE "payload"."profiles" ALTER COLUMN "press_kit_provider" SET DEFAULT 'unknown'::text;
  DROP TYPE "payload"."enum_profiles_press_kit_provider";
  CREATE TYPE "payload"."enum_profiles_press_kit_provider" AS ENUM('unknown', 'google-drive', 'dropbox', 'onedrive', 'wetransfer', 'other');
  ALTER TABLE "payload"."profiles" ALTER COLUMN "press_kit_provider" SET DEFAULT 'unknown'::"payload"."enum_profiles_press_kit_provider";
  ALTER TABLE "payload"."profiles" ALTER COLUMN "press_kit_provider" SET DATA TYPE "payload"."enum_profiles_press_kit_provider" USING "press_kit_provider"::"payload"."enum_profiles_press_kit_provider";`)
}
