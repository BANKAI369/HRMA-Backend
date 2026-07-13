import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1782207394942 implements MigrationInterface {
    name = 'Migrations1782207394942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP CONSTRAINT "FK_54a57db316598806786c2b95323"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "reviewed_at"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "review_remarks"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "reviewedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "reviewRemarks" text`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "total_days"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "total_days" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TYPE "public"."leave_requests_status_enum" RENAME TO "leave_requests_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."leave_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ALTER COLUMN "status" TYPE "public"."leave_requests_status_enum" USING "status"::"text"::"public"."leave_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."leave_requests_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD CONSTRAINT "FK_54a57db316598806786c2b95323" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP CONSTRAINT "FK_54a57db316598806786c2b95323"`);
        await queryRunner.query(`CREATE TYPE "public"."leave_requests_status_enum_old" AS ENUM('Pending', 'Approved', 'Rejected', 'Cancelled')`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ALTER COLUMN "status" TYPE "public"."leave_requests_status_enum_old" USING "status"::"text"::"public"."leave_requests_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ALTER COLUMN "status" SET DEFAULT 'Pending'`);
        await queryRunner.query(`DROP TYPE "public"."leave_requests_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."leave_requests_status_enum_old" RENAME TO "leave_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "total_days"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "total_days" numeric(5,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "reviewRemarks"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" DROP COLUMN "reviewedAt"`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "review_remarks" text`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "reviewed_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "leave_requests" ADD CONSTRAINT "FK_54a57db316598806786c2b95323" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
