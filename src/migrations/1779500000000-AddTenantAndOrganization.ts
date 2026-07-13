import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantAndOrganization1779500000000 implements MigrationInterface {
    name = 'AddTenantAndOrganization1779500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create tenants table
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_663f73f13f1ee7e5d4d24b95c70" UNIQUE ("slug"), CONSTRAINT "PK_53be67a04c72c4e0db8657fa4d8" PRIMARY KEY ("id"))`);
        
        // Create organizations table
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "code" character varying(60) NOT NULL, "name" character varying(150) NOT NULL, "description" text, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_e6ff0f52c3a8e5a8f7f5c7f6f5f" UNIQUE ("tenant_id", "code"), CONSTRAINT "UQ_f6f0f52c3a8e5a8f7f5c7f6f5f6" UNIQUE ("tenant_id", "name"), CONSTRAINT "PK_6a9d8b8e8f8e8d8c8b8a89878767" PRIMARY KEY ("id"), CONSTRAINT "FK_tenants" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE)`);
        
        // Create index for tenant_id
        await queryRunner.query(`CREATE INDEX "IDX_organizations_tenant_id" ON "organizations" ("tenant_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop organizations table first (due to foreign key)
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_organizations_tenant_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);
        
        // Then drop tenants table
        await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
    }
}
