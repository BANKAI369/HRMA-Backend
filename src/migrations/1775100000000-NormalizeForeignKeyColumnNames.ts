import { MigrationInterface, QueryRunner } from "typeorm";

export class NormalizeForeignKeyColumnNames1775100000000
  implements MigrationInterface
{
  name = "NormalizeForeignKeyColumnNames1775100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'roleId'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'role_id'
        ) THEN
          ALTER TABLE "users" RENAME COLUMN "roleId" TO "role_id";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'departmentId'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'department_id'
        ) THEN
          ALTER TABLE "users" RENAME COLUMN "departmentId" TO "department_id";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'employee_profiles' AND column_name = 'userId'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'employee_profiles' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "employee_profiles" RENAME COLUMN "userId" TO "user_id";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'employee_profiles' AND column_name = 'jobTitleId'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'employee_profiles' AND column_name = 'job_title_id'
        ) THEN
          ALTER TABLE "employee_profiles" RENAME COLUMN "jobTitleId" TO "job_title_id";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'employee_profiles' AND column_name = 'locationId'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'employee_profiles' AND column_name = 'location_id'
        ) THEN
          ALTER TABLE "employee_profiles" RENAME COLUMN "locationId" TO "location_id";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'role_permissions' AND column_name = 'rolesId'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'role_permissions' AND column_name = 'role_id'
        ) THEN
          ALTER TABLE "role_permissions" RENAME COLUMN "rolesId" TO "role_id";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'role_permissions' AND column_name = 'permissionsId'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'role_permissions' AND column_name = 'permission_id'
        ) THEN
          ALTER TABLE "role_permissions" RENAME COLUMN "permissionsId" TO "permission_id";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'exit_requests' AND column_name = 'employeeUserId'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'exit_requests' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "exit_requests" RENAME COLUMN "employeeUserId" TO "user_id";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'exit_requests' AND column_name = 'exitReasonId'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'exit_requests' AND column_name = 'exit_reason_id'
        ) THEN
          ALTER TABLE "exit_requests" RENAME COLUMN "exitReasonId" TO "exit_reason_id";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_roleId";
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_554d853741f2083faaa5794d2ae";
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_0921d1972cf861d568f5271cd85";
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles" DROP CONSTRAINT IF EXISTS "FK_employee_profiles_userId";
      ALTER TABLE "employee_profiles" DROP CONSTRAINT IF EXISTS "FK_employee_profiles_jobTitleId";
      ALTER TABLE "employee_profiles" DROP CONSTRAINT IF EXISTS "FK_employee_profiles_locationId";
    `);
    await queryRunner.query(`
      ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_178199805b901ccd220ab7740ec";
      ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_17022daf3f885f7d35423e9971e";
      ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_0cb93c5877d37e954e2aa59e52c";
      ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_d422dabc78ff74a8dab6583da02";
    `);
    await queryRunner.query(`
      ALTER TABLE "exit_requests" DROP CONSTRAINT IF EXISTS "FK_exit_requests_employeeUserId";
      ALTER TABLE "exit_requests" DROP CONSTRAINT IF EXISTS "FK_exit_requests_exitReasonId";
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_role_id"
      FOREIGN KEY ("role_id")
      REFERENCES "roles"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_department_id"
      FOREIGN KEY ("department_id")
      REFERENCES "departments"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles"
      ADD CONSTRAINT "FK_employee_profiles_user_id"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles"
      ADD CONSTRAINT "FK_employee_profiles_job_title_id"
      FOREIGN KEY ("job_title_id")
      REFERENCES "job_titles"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles"
      ADD CONSTRAINT "FK_employee_profiles_location_id"
      FOREIGN KEY ("location_id")
      REFERENCES "locations"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_role_permissions_role_id"
      FOREIGN KEY ("role_id")
      REFERENCES "roles"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_role_permissions_permission_id"
      FOREIGN KEY ("permission_id")
      REFERENCES "permissions"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "exit_requests"
      ADD CONSTRAINT "FK_exit_requests_user_id"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "exit_requests"
      ADD CONSTRAINT "FK_exit_requests_exit_reason_id"
      FOREIGN KEY ("exit_reason_id")
      REFERENCES "exit_reasons"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exit_requests" DROP CONSTRAINT IF EXISTS "FK_exit_requests_exit_reason_id";
      ALTER TABLE "exit_requests" DROP CONSTRAINT IF EXISTS "FK_exit_requests_user_id";
      ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_role_permissions_permission_id";
      ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "FK_role_permissions_role_id";
      ALTER TABLE "employee_profiles" DROP CONSTRAINT IF EXISTS "FK_employee_profiles_location_id";
      ALTER TABLE "employee_profiles" DROP CONSTRAINT IF EXISTS "FK_employee_profiles_job_title_id";
      ALTER TABLE "employee_profiles" DROP CONSTRAINT IF EXISTS "FK_employee_profiles_user_id";
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_department_id";
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_role_id";
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'exit_requests' AND column_name = 'exit_reason_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'exit_requests' AND column_name = 'exitReasonId'
        ) THEN
          ALTER TABLE "exit_requests" RENAME COLUMN "exit_reason_id" TO "exitReasonId";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'exit_requests' AND column_name = 'user_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'exit_requests' AND column_name = 'employeeUserId'
        ) THEN
          ALTER TABLE "exit_requests" RENAME COLUMN "user_id" TO "employeeUserId";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'role_permissions' AND column_name = 'permission_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'role_permissions' AND column_name = 'permissionsId'
        ) THEN
          ALTER TABLE "role_permissions" RENAME COLUMN "permission_id" TO "permissionsId";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'role_permissions' AND column_name = 'role_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'role_permissions' AND column_name = 'rolesId'
        ) THEN
          ALTER TABLE "role_permissions" RENAME COLUMN "role_id" TO "rolesId";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'employee_profiles' AND column_name = 'location_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'employee_profiles' AND column_name = 'locationId'
        ) THEN
          ALTER TABLE "employee_profiles" RENAME COLUMN "location_id" TO "locationId";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'employee_profiles' AND column_name = 'job_title_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'employee_profiles' AND column_name = 'jobTitleId'
        ) THEN
          ALTER TABLE "employee_profiles" RENAME COLUMN "job_title_id" TO "jobTitleId";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'employee_profiles' AND column_name = 'user_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'employee_profiles' AND column_name = 'userId'
        ) THEN
          ALTER TABLE "employee_profiles" RENAME COLUMN "user_id" TO "userId";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'department_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'departmentId'
        ) THEN
          ALTER TABLE "users" RENAME COLUMN "department_id" TO "departmentId";
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'role_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'roleId'
        ) THEN
          ALTER TABLE "users" RENAME COLUMN "role_id" TO "roleId";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_roleId"
      FOREIGN KEY ("roleId")
      REFERENCES "roles"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_554d853741f2083faaa5794d2ae"
      FOREIGN KEY ("departmentId")
      REFERENCES "departments"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles"
      ADD CONSTRAINT "FK_employee_profiles_userId"
      FOREIGN KEY ("userId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles"
      ADD CONSTRAINT "FK_employee_profiles_jobTitleId"
      FOREIGN KEY ("jobTitleId")
      REFERENCES "job_titles"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "employee_profiles"
      ADD CONSTRAINT "FK_employee_profiles_locationId"
      FOREIGN KEY ("locationId")
      REFERENCES "locations"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_0cb93c5877d37e954e2aa59e52c"
      FOREIGN KEY ("rolesId")
      REFERENCES "roles"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_d422dabc78ff74a8dab6583da02"
      FOREIGN KEY ("permissionsId")
      REFERENCES "permissions"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "exit_requests"
      ADD CONSTRAINT "FK_exit_requests_employeeUserId"
      FOREIGN KEY ("employeeUserId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION;
    `);
    await queryRunner.query(`
      ALTER TABLE "exit_requests"
      ADD CONSTRAINT "FK_exit_requests_exitReasonId"
      FOREIGN KEY ("exitReasonId")
      REFERENCES "exit_reasons"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION;
    `);
  }
}
