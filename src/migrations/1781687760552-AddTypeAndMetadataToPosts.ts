import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTypeAndMetadataToPosts1781687760552 implements MigrationInterface {
    name = 'AddTypeAndMetadataToPosts1781687760552'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ADD "likes" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "comments" jsonb NOT NULL DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "comments"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "likes"`);
    }

}
