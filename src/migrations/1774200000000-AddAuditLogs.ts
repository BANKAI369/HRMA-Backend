import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditLogs1774200000000 implements MigrationInterface {
  name = "AddAuditLogs1774200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor_user_id" uuid,
        "action" character varying NOT NULL,
        "entity_type" character varying NOT NULL,
        "entity_id" character varying NOT NULL,
        "old_value" jsonb,
        "new_value" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_actor_user_id"
      ON "audit_logs" ("actor_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_entity_type_entity_id"
      ON "audit_logs" ("entity_type", "entity_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_created_at"
      ON "audit_logs" ("created_at")
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "FK_audit_logs_actor_user_id"
      FOREIGN KEY ("actor_user_id")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      DROP CONSTRAINT "FK_audit_logs_actor_user_id"
    `);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_created_at"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_audit_logs_entity_type_entity_id"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_audit_logs_actor_user_id"`
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
