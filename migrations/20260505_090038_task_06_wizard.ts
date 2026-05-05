import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."users" ADD COLUMN "onboarding_progress" jsonb;
  ALTER TABLE "payload"."profiles" ADD COLUMN "portrait_id" integer;
  ALTER TABLE "payload"."profiles" ADD COLUMN "logo_id" integer;
  ALTER TABLE "payload"."profiles" ADD CONSTRAINT "profiles_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."profiles" ADD CONSTRAINT "profiles_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "profiles_portrait_idx" ON "payload"."profiles" USING btree ("portrait_id");
  CREATE INDEX "profiles_logo_idx" ON "payload"."profiles" USING btree ("logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."profiles" DROP CONSTRAINT "profiles_portrait_id_media_id_fk";
  
  ALTER TABLE "payload"."profiles" DROP CONSTRAINT "profiles_logo_id_media_id_fk";
  
  DROP INDEX "payload"."profiles_portrait_idx";
  DROP INDEX "payload"."profiles_logo_idx";
  ALTER TABLE "payload"."users" DROP COLUMN "onboarding_progress";
  ALTER TABLE "payload"."profiles" DROP COLUMN "portrait_id";
  ALTER TABLE "payload"."profiles" DROP COLUMN "logo_id";`)
}
