import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMasterDataTables1774300000000
  implements MigrationInterface
{
  name = "AddMasterDataTables1774300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "locations" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "countryCode" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_locations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_locations_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_titles" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_job_titles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_job_titles_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "currencies" (
        "id" character varying NOT NULL,
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "symbol" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_currencies_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_currencies_code" UNIQUE ("code"),
        CONSTRAINT "UQ_currencies_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notice_periods" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "days" integer NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notice_periods_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notice_periods_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exit_reasons" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exit_reasons_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_exit_reasons_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "group_types" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_group_types_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_group_types_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "groups" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "groupTypeId" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_groups_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_groups_name" UNIQUE ("name"),
        CONSTRAINT "FK_groups_groupTypeId"
          FOREIGN KEY ("groupTypeId")
          REFERENCES "group_types"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      INSERT INTO "locations" ("id", "name", "countryCode")
      VALUES
        ('blr', 'Bengaluru', 'IN'),
        ('hyd', 'Hyderabad', 'IN'),
        ('mum', 'Mumbai', 'IN'),
        ('del', 'Delhi NCR', 'IN'),
        ('remote', 'Remote', 'GLOBAL')
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "countryCode" = EXCLUDED."countryCode",
        "updatedAt" = now()
    `);
    await queryRunner.query(`
      INSERT INTO "job_titles" ("id", "name")
      VALUES
        ('software-engineer', 'Software Engineer'),
        ('senior-software-engineer', 'Senior Software Engineer'),
        ('engineering-manager', 'Engineering Manager'),
        ('hr-manager', 'HR Manager'),
        ('recruiter', 'Recruiter'),
        ('finance-analyst', 'Finance Analyst')
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "updatedAt" = now()
    `);
    await queryRunner.query(`
      INSERT INTO "currencies" ("id", "code", "name", "symbol")
      VALUES
        ('INR', 'INR', 'Indian Rupee', 'Rs'),
        ('USD', 'USD', 'US Dollar', '$'),
        ('EUR', 'EUR', 'Euro', 'EUR'),
        ('GBP', 'GBP', 'British Pound', 'GBP')
      ON CONFLICT ("id") DO UPDATE
      SET
        "code" = EXCLUDED."code",
        "name" = EXCLUDED."name",
        "symbol" = EXCLUDED."symbol",
        "updatedAt" = now()
    `);
    await queryRunner.query(`
      INSERT INTO "notice_periods" ("id", "name", "days")
      VALUES
        ('immediate', 'Immediate', 0),
        ('15-days', '15 Days', 15),
        ('30-days', '30 Days', 30),
        ('60-days', '60 Days', 60),
        ('90-days', '90 Days', 90)
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "days" = EXCLUDED."days",
        "updatedAt" = now()
    `);
    await queryRunner.query(`
      INSERT INTO "exit_reasons" ("id", "name")
      VALUES
        ('resignation', 'Resignation'),
        ('retirement', 'Retirement'),
        ('termination', 'Termination'),
        ('absconding', 'Absconding'),
        ('contract-end', 'Contract End')
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "updatedAt" = now()
    `);
    await queryRunner.query(`
      INSERT INTO "group_types" ("id", "name")
      VALUES
        ('department', 'Department'),
        ('business-unit', 'Business Unit'),
        ('project', 'Project'),
        ('custom', 'Custom')
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "updatedAt" = now()
    `);
    await queryRunner.query(`
      INSERT INTO "groups" ("id", "name", "groupTypeId")
      VALUES
        ('engineering', 'Engineering', 'department'),
        ('people-ops', 'People Operations', 'department'),
        ('finance', 'Finance', 'department'),
        ('delivery', 'Delivery', 'business-unit'),
        ('internal-tools', 'Internal Tools', 'project')
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "groupTypeId" = EXCLUDED."groupTypeId",
        "updatedAt" = now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "groups"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "group_types"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exit_reasons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notice_periods"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "currencies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_titles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "locations"`);
  }
}
