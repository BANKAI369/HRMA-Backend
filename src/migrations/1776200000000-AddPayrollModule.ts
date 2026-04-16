import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPayrollModule1776200000000 implements MigrationInterface {
  name = "AddPayrollModule1776200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "salary_components" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "type" character varying NOT NULL,
        "calculationType" character varying NOT NULL DEFAULT 'FIXED',
        "isTaxable" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_salary_components_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_salary_components_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pay_cycles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "frequency" character varying NOT NULL,
        "processingDay" integer,
        "payoutDay" integer,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_pay_cycles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pay_cycles_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pay_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "description" character varying,
        "pay_cycle_id" uuid NOT NULL,
        "currency_id" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_pay_groups_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pay_groups_name" UNIQUE ("name"),
        CONSTRAINT "FK_pay_groups_pay_cycle_id"
          FOREIGN KEY ("pay_cycle_id")
          REFERENCES "pay_cycles"("id")
          ON DELETE RESTRICT
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_pay_groups_currency_id"
          FOREIGN KEY ("currency_id")
          REFERENCES "currencies"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pay_grades" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "description" character varying,
        "minAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "maxAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "currency_id" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_pay_grades_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pay_grades_name" UNIQUE ("name"),
        CONSTRAINT "FK_pay_grades_currency_id"
          FOREIGN KEY ("currency_id")
          REFERENCES "currencies"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pay_bands" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "description" character varying,
        "pay_grade_id" uuid NOT NULL,
        "minAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "maxAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_pay_bands_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pay_bands_pay_grade_id"
          FOREIGN KEY ("pay_grade_id")
          REFERENCES "pay_grades"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bonus_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        "description" character varying,
        "payoutMode" character varying NOT NULL DEFAULT 'FIXED',
        "isRecurring" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_bonus_types_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_bonus_types_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_salaries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "employeeCode" character varying,
        "pay_group_id" uuid,
        "pay_grade_id" uuid,
        "pay_band_id" uuid,
        "annualCtc" numeric(14,2) NOT NULL DEFAULT 0,
        "monthlyGross" numeric(14,2) NOT NULL DEFAULT 0,
        "monthlyNet" numeric(14,2) NOT NULL DEFAULT 0,
        "effectiveFrom" date NOT NULL,
        "components" jsonb NOT NULL DEFAULT '[]',
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_employee_salaries_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_employee_salaries_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_employee_salaries_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_employee_salaries_pay_group_id"
          FOREIGN KEY ("pay_group_id")
          REFERENCES "pay_groups"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_employee_salaries_pay_grade_id"
          FOREIGN KEY ("pay_grade_id")
          REFERENCES "pay_grades"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_employee_salaries_pay_band_id"
          FOREIGN KEY ("pay_band_id")
          REFERENCES "pay_bands"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employee_fnf" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "employeeCode" character varying,
        "lastWorkingDate" date,
        "status" character varying NOT NULL DEFAULT 'PENDING',
        "payableAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "deductionAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "netSettlementAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "remarks" character varying,
        CONSTRAINT "PK_employee_fnf_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_employee_fnf_user_id" UNIQUE ("user_id"),
        CONSTRAINT "FK_employee_fnf_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pay_batches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "batchNumber" character varying NOT NULL,
        "name" character varying NOT NULL,
        "pay_group_id" uuid NOT NULL,
        "pay_cycle_id" uuid NOT NULL,
        "periodStart" date NOT NULL,
        "periodEnd" date NOT NULL,
        "payoutDate" date,
        "status" character varying NOT NULL DEFAULT 'DRAFT',
        CONSTRAINT "PK_pay_batches_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pay_batches_batchNumber" UNIQUE ("batchNumber"),
        CONSTRAINT "FK_pay_batches_pay_group_id"
          FOREIGN KEY ("pay_group_id")
          REFERENCES "pay_groups"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_pay_batches_pay_cycle_id"
          FOREIGN KEY ("pay_cycle_id")
          REFERENCES "pay_cycles"("id")
          ON DELETE RESTRICT
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "batch_payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "pay_batch_id" uuid NOT NULL,
        "user_id" uuid,
        "employeeCode" character varying,
        "grossAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "deductionAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "netAmount" numeric(14,2) NOT NULL DEFAULT 0,
        "paymentStatus" character varying NOT NULL DEFAULT 'PENDING',
        "paidAt" TIMESTAMP WITH TIME ZONE,
        "paymentReference" character varying,
        CONSTRAINT "PK_batch_payments_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_batch_payments_batch_user" UNIQUE ("pay_batch_id", "user_id"),
        CONSTRAINT "FK_batch_payments_pay_batch_id"
          FOREIGN KEY ("pay_batch_id")
          REFERENCES "pay_batches"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_batch_payments_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_employee_salaries_pay_group_id"
      ON "employee_salaries" ("pay_group_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_batch_payments_pay_batch_id"
      ON "batch_payments" ("pay_batch_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_batch_payments_user_id"
      ON "batch_payments" ("user_id")
    `);

    await queryRunner.query(`
      INSERT INTO "salary_components" ("id", "code", "name", "type", "calculationType", "isTaxable")
      VALUES
        ('11111111-1111-1111-1111-111111111111', 'BASIC', 'Basic Salary', 'EARNING', 'FIXED', true),
        ('22222222-2222-2222-2222-222222222222', 'HRA', 'House Rent Allowance', 'EARNING', 'FIXED', true),
        ('33333333-3333-3333-3333-333333333333', 'PF', 'Provident Fund', 'DEDUCTION', 'FIXED', false),
        ('44444444-4444-4444-4444-444444444444', 'TDS', 'Tax Deducted at Source', 'DEDUCTION', 'VARIABLE', false)
      ON CONFLICT ("code") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "type" = EXCLUDED."type",
        "calculationType" = EXCLUDED."calculationType",
        "isTaxable" = EXCLUDED."isTaxable",
        "updatedAt" = now()
    `);

    await queryRunner.query(`
      INSERT INTO "pay_cycles" ("id", "name", "frequency", "processingDay", "payoutDay")
      VALUES
        ('55555555-5555-5555-5555-555555555555', 'Monthly', 'MONTHLY', 28, 30),
        ('66666666-6666-6666-6666-666666666666', 'Bi-Weekly', 'BI_WEEKLY', 14, 15)
      ON CONFLICT ("name") DO UPDATE
      SET
        "frequency" = EXCLUDED."frequency",
        "processingDay" = EXCLUDED."processingDay",
        "payoutDay" = EXCLUDED."payoutDay",
        "updatedAt" = now()
    `);

    await queryRunner.query(`
      INSERT INTO "pay_groups" ("id", "name", "description", "pay_cycle_id", "currency_id")
      VALUES
        ('77777777-7777-7777-7777-777777777777', 'Corporate Monthly', 'Monthly salary group for corporate employees', '55555555-5555-5555-5555-555555555555', null),
        ('88888888-8888-8888-8888-888888888888', 'Operations Bi-Weekly', 'Bi-weekly payroll group for shift operations', '66666666-6666-6666-6666-666666666666', null)
      ON CONFLICT ("name") DO UPDATE
      SET
        "description" = EXCLUDED."description",
        "pay_cycle_id" = EXCLUDED."pay_cycle_id",
        "currency_id" = EXCLUDED."currency_id",
        "updatedAt" = now()
    `);

    await queryRunner.query(`
      INSERT INTO "pay_grades" ("id", "name", "description", "minAmount", "maxAmount", "currency_id")
      VALUES
        ('99999999-9999-9999-9999-999999999999', 'G5', 'Entry to mid-level roles', 300000, 600000, null),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'G7', 'Senior individual contributors and leads', 600000, 1200000, null)
      ON CONFLICT ("name") DO UPDATE
      SET
        "description" = EXCLUDED."description",
        "minAmount" = EXCLUDED."minAmount",
        "maxAmount" = EXCLUDED."maxAmount",
        "currency_id" = EXCLUDED."currency_id",
        "updatedAt" = now()
    `);

    await queryRunner.query(`
      INSERT INTO "pay_bands" ("id", "name", "description", "pay_grade_id", "minAmount", "maxAmount")
      VALUES
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Band A', 'Lower band within grade', '99999999-9999-9999-9999-999999999999', 300000, 450000),
        ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Band B', 'Upper band within grade', '99999999-9999-9999-9999-999999999999', 450000, 600000),
        ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Band C', 'Senior band within grade', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 600000, 900000)
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "bonus_types" ("id", "name", "description", "payoutMode", "isRecurring")
      VALUES
        ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Performance Bonus', 'Variable payout linked to appraisal outcomes', 'VARIABLE', true),
        ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Festival Bonus', 'Fixed festival season payout', 'FIXED', false),
        ('12121212-1212-1212-1212-121212121212', 'Joining Bonus', 'One-time bonus on employee onboarding', 'FIXED', false)
      ON CONFLICT ("name") DO UPDATE
      SET
        "description" = EXCLUDED."description",
        "payoutMode" = EXCLUDED."payoutMode",
        "isRecurring" = EXCLUDED."isRecurring",
        "updatedAt" = now()
    `);

    await queryRunner.query(`
      INSERT INTO "pay_batches" ("id", "batchNumber", "name", "pay_group_id", "pay_cycle_id", "periodStart", "periodEnd", "payoutDate", "status")
      VALUES
        ('13131313-1313-1313-1313-131313131313', 'APR-2026-MONTHLY', 'April 2026 Monthly Payroll', '77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', '2026-04-01', '2026-04-30', '2026-04-30', 'PROCESSING'),
        ('14141414-1414-1414-1414-141414141414', 'APR-2026-BW-2', 'April 2026 Operations Cycle 2', '88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', '2026-04-16', '2026-04-30', '2026-04-30', 'DRAFT')
      ON CONFLICT ("batchNumber") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "pay_group_id" = EXCLUDED."pay_group_id",
        "pay_cycle_id" = EXCLUDED."pay_cycle_id",
        "periodStart" = EXCLUDED."periodStart",
        "periodEnd" = EXCLUDED."periodEnd",
        "payoutDate" = EXCLUDED."payoutDate",
        "status" = EXCLUDED."status",
        "updatedAt" = now()
    `);

    await queryRunner.query(`
      INSERT INTO "employee_salaries" (
        "user_id",
        "employeeCode",
        "pay_group_id",
        "pay_grade_id",
        "pay_band_id",
        "annualCtc",
        "monthlyGross",
        "monthlyNet",
        "effectiveFrom",
        "components",
        "isActive"
      )
      SELECT
        u."id",
        ep."employeeCode",
        '77777777-7777-7777-7777-777777777777',
        '99999999-9999-9999-9999-999999999999',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        600000,
        50000,
        42500,
        CURRENT_DATE,
        '[{"componentCode":"BASIC","amount":25000},{"componentCode":"HRA","amount":12500},{"componentCode":"PF","amount":1800},{"componentCode":"TDS","amount":3200}]',
        true
      FROM "users" u
      LEFT JOIN "employee_profiles" ep ON ep."user_id" = u."id"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "employee_salaries" es
        WHERE es."user_id" = u."id"
      )
    `);

    await queryRunner.query(`
      INSERT INTO "employee_fnf" (
        "user_id",
        "employeeCode",
        "lastWorkingDate",
        "status",
        "payableAmount",
        "deductionAmount",
        "netSettlementAmount",
        "remarks"
      )
      SELECT
        u."id",
        ep."employeeCode",
        null,
        'PENDING',
        0,
        0,
        0,
        'FnF not initiated'
      FROM "users" u
      LEFT JOIN "employee_profiles" ep ON ep."user_id" = u."id"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "employee_fnf" fnf
        WHERE fnf."user_id" = u."id"
      )
    `);

    await queryRunner.query(`
      INSERT INTO "batch_payments" (
        "pay_batch_id",
        "user_id",
        "employeeCode",
        "grossAmount",
        "deductionAmount",
        "netAmount",
        "paymentStatus",
        "paymentReference"
      )
      SELECT
        '13131313-1313-1313-1313-131313131313',
        u."id",
        ep."employeeCode",
        50000,
        7500,
        42500,
        'PENDING',
        null
      FROM "users" u
      LEFT JOIN "employee_profiles" ep ON ep."user_id" = u."id"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "batch_payments" bp
        WHERE bp."pay_batch_id" = '13131313-1313-1313-1313-131313131313'
          AND bp."user_id" = u."id"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_batch_payments_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_batch_payments_pay_batch_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_employee_salaries_pay_group_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "batch_payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pay_batches"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_fnf"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_salaries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bonus_types"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pay_bands"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pay_grades"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pay_groups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pay_cycles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "salary_components"`);
  }
}

