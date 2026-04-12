import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentsTable1775300000000 implements MigrationInterface {
  name = "AddDocumentsTable1775300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'documents_status_enum') THEN
          CREATE TYPE "documents_status_enum" AS ENUM ('Pending', 'Verified', 'Rejected');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "document_type_id" uuid NOT NULL,
        "file_name" character varying NOT NULL,
        "original_file_name" character varying NOT NULL,
        "file_path" character varying NOT NULL,
        "mime_type" character varying NOT NULL,
        "file_size" bigint NOT NULL,
        "status" "documents_status_enum" NOT NULL DEFAULT 'Pending',
        "remarks" text,
        "verified_by" uuid,
        "verified_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_documents_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_documents_user_id"
      ON "documents" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_documents_document_type_id"
      ON "documents" ("document_type_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD CONSTRAINT "FK_documents_user_id"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD CONSTRAINT "FK_documents_document_type_id"
      FOREIGN KEY ("document_type_id")
      REFERENCES "document_types"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD CONSTRAINT "FK_documents_verified_by"
      FOREIGN KEY ("verified_by")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "FK_documents_verified_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "FK_documents_document_type_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "FK_documents_user_id"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_document_type_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "documents_status_enum"`);
  }
}
