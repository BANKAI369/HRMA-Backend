import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentTypesTable1775200000000
  implements MigrationInterface
{
  name = "AddDocumentTypesTable1775200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "document_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "description" text NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_document_types_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_document_types_name" UNIQUE ("name")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "document_types"`);
  }
}
