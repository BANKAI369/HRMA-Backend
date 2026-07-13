import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantRegionToHolidays1790000000001 implements MigrationInterface {
    name = 'AddTenantRegionToHolidays1790000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "holidays" ADD COLUMN IF NOT EXISTS "region" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "holidays" DROP COLUMN IF EXISTS "region"`);
    }
}
