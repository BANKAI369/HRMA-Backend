import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLeaveType1781782884157 implements MigrationInterface {
    name = 'AddLeaveType1781782884157'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "annualAllowanceDays"`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD "tenant_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD "code" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD "requiresApproval" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD "allowHalfDay" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD "allowHourly" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD "requiresDocument" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP CONSTRAINT "UQ_e41bb9537ef5e65ee2de2cfa81a"`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD "name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD CONSTRAINT "FK_eb555086a7c9271e5206b1889c6" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leave_types" DROP CONSTRAINT "FK_eb555086a7c9271e5206b1889c6"`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD CONSTRAINT "UQ_e41bb9537ef5e65ee2de2cfa81a" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "requiresDocument"`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "allowHourly"`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "allowHalfDay"`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "requiresApproval"`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "leave_types" ADD "annualAllowanceDays" integer NOT NULL DEFAULT '0'`);
    }

}
