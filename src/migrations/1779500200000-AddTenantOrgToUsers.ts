import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantOrgToUsers1779500200000 implements MigrationInterface {
    name = 'AddTenantOrgToUsers1779500200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add tenant_id column to users
        await queryRunner.query(`ALTER TABLE "users" ADD "tenant_id" uuid`);
        
        // Add organization_id column to users
        await queryRunner.query(`ALTER TABLE "users" ADD "organization_id" uuid`);
        
        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE`);
        
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL`);
        
        // Drop existing unique constraints on username and email
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_fe0bb3f6520ee0469504521e710"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_97672ac88f789774dd47f7c8be3"`);
        
        // Create new unique constraints that include tenant_id
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_tenant_username" ON "users" ("tenant_id", "username") WHERE ("tenant_id" IS NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_tenant_email" ON "users" ("tenant_id", "email") WHERE ("tenant_id" IS NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop unique indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_tenant_email"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_tenant_username"`);
        
        // Add back original constraints
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
        
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_organization"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_tenant"`);
        
        // Drop columns
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "organization_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "tenant_id"`);
    }
}
