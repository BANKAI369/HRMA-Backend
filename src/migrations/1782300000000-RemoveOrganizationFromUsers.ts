import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveOrganizationFromUsers1782300000000 implements MigrationInterface {
  name = "RemoveOrganizationFromUsers1782300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_organization"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "organization_id"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "organization_id" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL`
    );
  }
}
