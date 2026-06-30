import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfilePhotoToEmployeeProfiles1780000001000
  implements MigrationInterface
{
  name = "AddProfilePhotoToEmployeeProfiles1780000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" ADD "profile_photo" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" DROP COLUMN "profile_photo"`
    );
  }
}
