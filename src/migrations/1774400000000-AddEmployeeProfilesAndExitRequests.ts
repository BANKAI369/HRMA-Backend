import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmployeeProfilesAndExitRequests1774400000000
  implements MigrationInterface
{
  name = "AddEmployeeProfilesAndExitRequests1774400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "employee_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "firstName" character varying,
        "lastName" character varying,
        "phone" character varying,
        "dateOfBirth" date,
        "gender" character varying,
        "employeeCode" character varying,
        "dateOfJoining" date,
        "locationId" character varying,
        "jobTitleId" character varying,
        "noticePeriodId" character varying,
        "groupId" character varying,
        "managerUserId" uuid,
        CONSTRAINT "PK_employee_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_employee_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "UQ_employee_profiles_employeeCode" UNIQUE ("employeeCode")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "exit_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "employeeUserId" uuid NOT NULL,
        "requestedByUserId" uuid NOT NULL,
        "exitReasonId" character varying NOT NULL,
        "noticePeriodId" character varying,
        "lastWorkingDate" date,
        "status" character varying NOT NULL DEFAULT 'Pending',
        "remarks" text,
        CONSTRAINT "PK_exit_requests_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_employee_profiles_managerUserId"
      ON "employee_profiles" ("managerUserId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_exit_requests_employeeUserId"
      ON "exit_requests" ("employeeUserId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_exit_requests_status"
      ON "exit_requests" ("status")
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles"
      ADD CONSTRAINT "FK_employee_profiles_userId"
      FOREIGN KEY ("userId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles"
      ADD CONSTRAINT "FK_employee_profiles_locationId"
      FOREIGN KEY ("locationId")
      REFERENCES "locations"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles"
      ADD CONSTRAINT "FK_employee_profiles_jobTitleId"
      FOREIGN KEY ("jobTitleId")
      REFERENCES "job_titles"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles"
      ADD CONSTRAINT "FK_employee_profiles_noticePeriodId"
      FOREIGN KEY ("noticePeriodId")
      REFERENCES "notice_periods"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles"
      ADD CONSTRAINT "FK_employee_profiles_groupId"
      FOREIGN KEY ("groupId")
      REFERENCES "groups"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles"
      ADD CONSTRAINT "FK_employee_profiles_managerUserId"
      FOREIGN KEY ("managerUserId")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "exit_requests"
      ADD CONSTRAINT "FK_exit_requests_employeeUserId"
      FOREIGN KEY ("employeeUserId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "exit_requests"
      ADD CONSTRAINT "FK_exit_requests_requestedByUserId"
      FOREIGN KEY ("requestedByUserId")
      REFERENCES "users"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "exit_requests"
      ADD CONSTRAINT "FK_exit_requests_exitReasonId"
      FOREIGN KEY ("exitReasonId")
      REFERENCES "exit_reasons"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "exit_requests"
      ADD CONSTRAINT "FK_exit_requests_noticePeriodId"
      FOREIGN KEY ("noticePeriodId")
      REFERENCES "notice_periods"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      INSERT INTO "employee_profiles" ("userId")
      SELECT "id"
      FROM "users" u
      WHERE NOT EXISTS (
        SELECT 1
        FROM "employee_profiles" ep
        WHERE ep."userId" = u."id"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exit_requests" DROP CONSTRAINT "FK_exit_requests_noticePeriodId"`
    );
    await queryRunner.query(
      `ALTER TABLE "exit_requests" DROP CONSTRAINT "FK_exit_requests_exitReasonId"`
    );
    await queryRunner.query(
      `ALTER TABLE "exit_requests" DROP CONSTRAINT "FK_exit_requests_requestedByUserId"`
    );
    await queryRunner.query(
      `ALTER TABLE "exit_requests" DROP CONSTRAINT "FK_exit_requests_employeeUserId"`
    );
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" DROP CONSTRAINT "FK_employee_profiles_managerUserId"`
    );
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" DROP CONSTRAINT "FK_employee_profiles_groupId"`
    );
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" DROP CONSTRAINT "FK_employee_profiles_noticePeriodId"`
    );
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" DROP CONSTRAINT "FK_employee_profiles_jobTitleId"`
    );
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" DROP CONSTRAINT "FK_employee_profiles_locationId"`
    );
    await queryRunner.query(
      `ALTER TABLE "employee_profiles" DROP CONSTRAINT "FK_employee_profiles_userId"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_exit_requests_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_exit_requests_employeeUserId"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_employee_profiles_managerUserId"`
    );
    await queryRunner.query(`DROP TABLE "exit_requests"`);
    await queryRunner.query(`DROP TABLE "employee_profiles"`);
  }
}
