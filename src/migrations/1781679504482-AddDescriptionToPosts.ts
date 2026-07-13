import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDescriptionToPosts1781679504482 implements MigrationInterface {
    name = 'AddDescriptionToPosts1781679504482'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" RENAME COLUMN "visibility" TO "author_id"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "author_id"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "author_id" uuid`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_312c63be865c81b922e39c2475e"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "author_id"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "author_id" character varying NOT NULL DEFAULT 'TEAM'`);
        await queryRunner.query(`ALTER TABLE "posts" RENAME COLUMN "author_id" TO "visibility"`);
    }

}
