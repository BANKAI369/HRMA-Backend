import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganizationInvites1779500300000 implements MigrationInterface {
    name = 'AddOrganizationInvites1779500300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organization_invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "email" character varying(255) NOT NULL, "role_name" character varying(60) NOT NULL DEFAULT 'Employee', "token" character varying(128) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "invited_by_user_id" uuid, "accepted_by_user_id" uuid, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "accepted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_organization_invites_token" UNIQUE ("token"), CONSTRAINT "PK_organization_invites" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_organization_invites_scope" ON "organization_invites" ("tenant_id", "organization_id", "email")`);
        await queryRunner.query(`ALTER TABLE "organization_invites" ADD CONSTRAINT "FK_organization_invites_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "organization_invites" ADD CONSTRAINT "FK_organization_invites_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "organization_invites" ADD CONSTRAINT "FK_organization_invites_invited_by" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "organization_invites" ADD CONSTRAINT "FK_organization_invites_accepted_by" FOREIGN KEY ("accepted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_invites" DROP CONSTRAINT "FK_organization_invites_accepted_by"`);
        await queryRunner.query(`ALTER TABLE "organization_invites" DROP CONSTRAINT "FK_organization_invites_invited_by"`);
        await queryRunner.query(`ALTER TABLE "organization_invites" DROP CONSTRAINT "FK_organization_invites_organization"`);
        await queryRunner.query(`ALTER TABLE "organization_invites" DROP CONSTRAINT "FK_organization_invites_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_organization_invites_scope"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "organization_invites"`);
    }
}
