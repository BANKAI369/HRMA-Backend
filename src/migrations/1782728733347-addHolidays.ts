import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHolidays1782728733347 implements MigrationInterface {
    name = 'AddHolidays1782728733347'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP CONSTRAINT "FK_54a57db316598806786c2b95323"`);
        await queryRunner.query(`CREATE TYPE "public"."holidays_type_enum" AS ENUM('PUBLIC', 'OPTIONAL')`);
        await queryRunner.query(`CREATE TABLE "holidays" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "date" date NOT NULL, "type" "public"."holidays_type_enum" NOT NULL DEFAULT 'PUBLIC', "tenantId" uuid, "region" character varying, "isRecurring" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_3646bdd4c3817d954d830881dfe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "reviewed_at"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "review_remarks"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "reviewedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "reviewRemarks" text`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "total_days"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "total_days" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD CONSTRAINT "FK_54a57db316598806786c2b95323" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP CONSTRAINT "FK_54a57db316598806786c2b95323"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "total_days"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "total_days" numeric(5,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "reviewRemarks"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "reviewedAt"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "review_remarks" text`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "reviewed_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP TABLE "holidays"`);
        await queryRunner.query(`DROP TYPE "public"."holidays_type_enum"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD CONSTRAINT "FK_54a57db316598806786c2b95323" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
