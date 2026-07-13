import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAnnouncements1781694462120 implements MigrationInterface {
    name = 'AddAnnouncements1781694462120'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ADD "departmentId" uuid`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "scope" character varying NOT NULL DEFAULT 'organization'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "scope"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "departmentId"`);
    }

}
