import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAnnualAllowance1789999999999 implements MigrationInterface {
  name = 'AddAnnualAllowance1789999999999'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leave_types" ADD "annualAllowanceDays" integer NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "annualAllowanceDays"`);
  }
}
