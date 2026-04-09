import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDepartmentManagerRelation1774100000000
  implements MigrationInterface
{
  name = "RemoveDepartmentManagerRelation1774100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_departments_managerId"`
    );
    await queryRunner.query(`
      DO $$
      DECLARE fk_name text;
      BEGIN
        SELECT tc.constraint_name
        INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'departments'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'managerId'
        LIMIT 1;

        IF fk_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "departments" DROP CONSTRAINT %I', fk_name);
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "departments" DROP COLUMN IF EXISTS "managerId"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "managerId" uuid`
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_departments_managerId'
        ) THEN
          ALTER TABLE "departments"
          ADD CONSTRAINT "FK_departments_managerId"
          FOREIGN KEY ("managerId")
          REFERENCES "users"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_departments_managerId" ON "departments" ("managerId")`
    );
  }
}
