import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeRahulAdmin1780000000000 implements MigrationInterface {
  name = "MakeRahulAdmin1780000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const adminRoleRows = await queryRunner.query(
      `SELECT id FROM "roles" WHERE lower("name") = 'admin' LIMIT 1`
    );

    if (!adminRoleRows.length) {
      return;
    }

    const adminRoleId = adminRoleRows[0].id as string;

    const oldUsers = await queryRunner.query(
      `
        SELECT id, username, email
        FROM "users"
        WHERE lower("username") = 'rahul.employee'
           OR lower("email") = 'rahul.employee@ngenux.com'
      `
    );

    const targetUsers = oldUsers.length
      ? oldUsers
      : await queryRunner.query(
          `
            SELECT id, username, email
            FROM "users"
            WHERE lower("username") = 'rahul.admin'
               OR lower("email") = 'rahul.admin@ngenux.com'
          `
        );

    if (!targetUsers.length) {
      return;
    }

    const userIds = targetUsers.map((user: { id: string }) => user.id);

    await queryRunner.query(
      `
        UPDATE "users"
        SET
          "role_id" = $1,
          "username" = CASE
            WHEN lower("username") = 'rahul.employee'
              OR lower("email") = 'rahul.employee@ngenux.com'
            THEN 'rahul.admin'
            ELSE "username"
          END,
          "email" = CASE
            WHEN lower("username") = 'rahul.employee'
              OR lower("email") = 'rahul.employee@ngenux.com'
            THEN 'rahul.admin@ngenux.com'
            ELSE "email"
          END
        WHERE "id" = ANY($2::uuid[])
      `
      ,
      [adminRoleId, userIds]
    );

    await queryRunner.query(
      `DELETE FROM "user_roles" WHERE "user_id" = ANY($1::uuid[])`,
      [userIds]
    );

    await queryRunner.query(
      `
        INSERT INTO "user_roles" ("user_id", "role_id")
        SELECT u.id, $1
        FROM "users" u
        WHERE u.id = ANY($2::uuid[])
        ON CONFLICT DO NOTHING
      `,
      [adminRoleId, userIds]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const employeeRoleRows = await queryRunner.query(
      `SELECT id FROM "roles" WHERE lower("name") = 'employee' LIMIT 1`
    );

    if (!employeeRoleRows.length) {
      return;
    }

    const employeeRoleId = employeeRoleRows[0].id as string;

    const targetUsers = await queryRunner.query(
      `
        SELECT id
        FROM "users"
        WHERE lower("username") = 'rahul.admin'
           OR lower("email") = 'rahul.admin@ngenux.com'
      `
    );

    if (!targetUsers.length) {
      return;
    }

    const userIds = targetUsers.map((user: { id: string }) => user.id);

    await queryRunner.query(
      `
        UPDATE "users"
        SET
          "role_id" = $1,
          "username" = 'rahul.employee',
          "email" = 'rahul.employee@ngenux.com'
        WHERE "id" = ANY($2::uuid[])
      `,
      [employeeRoleId, userIds]
    );

    await queryRunner.query(
      `DELETE FROM "user_roles" WHERE "user_id" = ANY($1::uuid[])`,
      [userIds]
    );

    await queryRunner.query(
      `
        INSERT INTO "user_roles" ("user_id", "role_id")
        SELECT u.id, $1
        FROM "users" u
        WHERE u.id = ANY($2::uuid[])
        ON CONFLICT DO NOTHING
      `,
      [employeeRoleId, userIds]
    );
  }
}
