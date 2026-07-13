import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDepartmentPermissions1779600000000 implements MigrationInterface {
    name = 'AddDepartmentPermissions1779600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "department_permissions" (
                "department_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                CONSTRAINT "PK_department_permissions" PRIMARY KEY ("department_id", "permission_id")
            )
        `);

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_department_permissions_department_id" ON "department_permissions" ("department_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_department_permissions_permission_id" ON "department_permissions" ("permission_id")`);

        await queryRunner.query(`
            ALTER TABLE "department_permissions"
            ADD CONSTRAINT "FK_department_permissions_department"
            FOREIGN KEY ("department_id") REFERENCES "departments"("id")
            ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "department_permissions"
            ADD CONSTRAINT "FK_department_permissions_permission"
            FOREIGN KEY ("permission_id") REFERENCES "permissions"("id")
            ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "department_permissions" DROP CONSTRAINT IF EXISTS "FK_department_permissions_permission"`);
        await queryRunner.query(`ALTER TABLE "department_permissions" DROP CONSTRAINT IF EXISTS "FK_department_permissions_department"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_department_permissions_permission_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_department_permissions_department_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "department_permissions"`);
    }

}
