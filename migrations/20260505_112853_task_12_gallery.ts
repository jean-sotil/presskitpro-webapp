import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."profiles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "payload"."media" ALTER COLUMN "alt" DROP NOT NULL;
  ALTER TABLE "payload"."media" ADD COLUMN "decorative" boolean DEFAULT false;
  ALTER TABLE "payload"."profiles_rels" ADD CONSTRAINT "profiles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."profiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."profiles_rels" ADD CONSTRAINT "profiles_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "profiles_rels_order_idx" ON "payload"."profiles_rels" USING btree ("order");
  CREATE INDEX "profiles_rels_parent_idx" ON "payload"."profiles_rels" USING btree ("parent_id");
  CREATE INDEX "profiles_rels_path_idx" ON "payload"."profiles_rels" USING btree ("path");
  CREATE INDEX "profiles_rels_media_id_idx" ON "payload"."profiles_rels" USING btree ("media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."profiles_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."profiles_rels" CASCADE;
  ALTER TABLE "payload"."media" ALTER COLUMN "alt" SET NOT NULL;
  ALTER TABLE "payload"."media" DROP COLUMN "decorative";`)
}
