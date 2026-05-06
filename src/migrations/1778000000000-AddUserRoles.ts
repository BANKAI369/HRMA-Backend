import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class AddUserRoles1778000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "user_roles",
        columns: [
          {
            name: "user_id",
            type: "uuid",
            isNullable: false,
            isPrimary: true,
          },
          {
            name: "role_id",
            type: "uuid",
            isNullable: false,
            isPrimary: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      "user_roles",
      new TableIndex({
        name: "IDX_user_roles_user_id",
        columnNames: ["user_id"],
      })
    );

    await queryRunner.createIndex(
      "user_roles",
      new TableIndex({
        name: "IDX_user_roles_role_id",
        columnNames: ["role_id"],
      })
    );

    await queryRunner.createForeignKeys("user_roles", [
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      }),
      new TableForeignKey({
        columnNames: ["role_id"],
        referencedTableName: "roles",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      }),
    ]);

    await queryRunner.query(`
      INSERT INTO "user_roles" ("user_id", "role_id")
      SELECT "id", "role_id"
      FROM "users"
      WHERE "role_id" IS NOT NULL
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("user_roles");
  }
}
