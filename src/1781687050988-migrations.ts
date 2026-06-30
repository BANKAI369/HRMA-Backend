import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1781687050988 implements MigrationInterface {
    name = 'Migrations1781687050988'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ADD "type" character varying NOT NULL DEFAULT 'POST'`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "metadata" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "type"`);
    }

}
