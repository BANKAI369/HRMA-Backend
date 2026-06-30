import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModuleTable1779356533865 implements MigrationInterface {
    name = 'AddModuleTable1779356533865'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "modules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "code" character varying(50) NOT NULL,
                "name" character varying(100) NOT NULL,
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                CONSTRAINT "UQ_modules_code" UNIQUE ("code"),
                CONSTRAINT "PK_modules_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "module_id" uuid`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_permissions_module_id" ON "permissions" ("module_id") `);
        await queryRunner.query(`
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'FK_permissions_module_id'
              ) THEN
                ALTER TABLE "permissions"
                ADD CONSTRAINT "FK_permissions_module_id"
                FOREIGN KEY ("module_id") REFERENCES "modules"("id")
                ON DELETE SET NULL ON UPDATE NO ACTION;
              END IF;
            END
            $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT IF EXISTS "FK_permissions_module_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_permissions_module_id"`);
        await queryRunner.query(`ALTER TABLE "permissions" DROP COLUMN IF EXISTS "module_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "modules"`);
    }

}
