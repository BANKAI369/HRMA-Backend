import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDescriptionToPosts1781681059374 implements MigrationInterface {
    name = 'AddDescriptionToPosts1781681059374'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_312c63be865c81b922e39c2475e"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "author_id"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "visibility" character varying NOT NULL DEFAULT 'TEAM'`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "authorId"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "authorId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "tenantId"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "tenantId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "authorId"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "authorId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "visibility"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "author_id" uuid`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
