import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantOrgToDepartments1779500100000 implements MigrationInterface {
    name = 'AddTenantOrgToDepartments1779500100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add tenant_id column to departments
        await queryRunner.query(`ALTER TABLE "departments" ADD "tenant_id" uuid`);
        
        // Add organization_id column to departments
        await queryRunner.query(`ALTER TABLE "departments" ADD "organization_id" uuid`);
        
        // Add foreign key constraint for tenant_id
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "FK_departments_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
        
        // Add foreign key constraint for organization_id
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "FK_departments_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE`);
        
        // Add unique constraint
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "UQ_8681da666ad9699d568b3e91064"`);
        
        // Create new unique constraint that includes tenantId and organizationId
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_departments_tenant_org_name" ON "departments" ("tenant_id", "organization_id", "name") WHERE ("tenant_id" IS NOT NULL AND "organization_id" IS NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop unique index
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_departments_tenant_org_name"`);
        
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "FK_departments_tenant"`);
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "FK_departments_organization"`);
        
        // Drop columns
        await queryRunner.query(`ALTER TABLE "departments" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "departments" DROP COLUMN "tenant_id"`);
        
        // Restore original unique constraint on name only
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "UQ_8681da666ad9699d568b3e91064" UNIQUE ("name")`);
    }
}
