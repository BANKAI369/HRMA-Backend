import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLeaveModule1775300000000 implements MigrationInterface {
  name = "AddLeaveModule1775300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."leave_requests_status_enum" AS ENUM ('Pending', 'Approved', 'Rejected', 'Cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leave_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "description" text,
        "annualAllowanceDays" integer NOT NULL DEFAULT 0,
        "isPaid" boolean NOT NULL DEFAULT true,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_leave_types_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_leave_types_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leave_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "leave_type_id" uuid NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "total_days" numeric(5,2) NOT NULL,
        "reason" text,
        "status" "public"."leave_requests_status_enum" NOT NULL DEFAULT 'Pending',
        "reviewed_by" uuid,
        "reviewed_at" TIMESTAMP WITH TIME ZONE,
        "review_remarks" text,
        CONSTRAINT "PK_leave_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_leave_requests_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_leave_requests_leave_type_id" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_leave_requests_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_leave_requests_user_id" ON "leave_requests" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_leave_requests_status" ON "leave_requests" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_leave_requests_date_range" ON "leave_requests" ("start_date", "end_date")
    `);

    await queryRunner.query(`
      INSERT INTO "leave_types" ("name", "description", "annualAllowanceDays", "isPaid", "isActive")
      VALUES
        ('Casual Leave', 'Short personal leave for planned time off', 12, true, true),
        ('Sick Leave', 'Medical leave for illness or recovery', 12, true, true),
        ('Unpaid Leave', 'Leave without pay after approval', 0, false, true)
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leave_requests_date_range"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leave_requests_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leave_requests_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_types"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."leave_requests_status_enum"`);
  }
}
