import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAttendanceModule1776100000000 implements MigrationInterface {
  name = "AddAttendanceModule1776100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "capture_schemes" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "mode" character varying NOT NULL,
        "graceMinutes" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_capture_schemes_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_capture_schemes_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shift_policies" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "shiftStart" time NOT NULL,
        "shiftEnd" time NOT NULL,
        "lateMarkGraceMinutes" integer NOT NULL DEFAULT 0,
        "halfDayThresholdMinutes" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shift_policies_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_shift_policies_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "holiday_calendars" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "year" integer NOT NULL,
        "location_id" character varying,
        "holidays" jsonb NOT NULL DEFAULT '[]',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_holiday_calendars_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_holiday_calendars_name" UNIQUE ("name"),
        CONSTRAINT "FK_holiday_calendars_location_id"
          FOREIGN KEY ("location_id")
          REFERENCES "locations"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tracking_policies" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "minimumHoursPerDay" numeric(5,2) NOT NULL DEFAULT 8,
        "maximumHoursPerDay" numeric(5,2) NOT NULL DEFAULT 12,
        "allowOvertime" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tracking_policies_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tracking_policies_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "weekly_off_policies" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "weeklyOffDays" jsonb NOT NULL DEFAULT '[]',
        "isAlternateSaturdayOff" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_weekly_off_policies_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_weekly_off_policies_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attendance_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "user_id" uuid,
        "employeeCode" character varying,
        "capture_scheme_id" character varying,
        "shift_policy_id" character varying,
        "attendanceDate" date NOT NULL,
        "punchTime" TIMESTAMP WITH TIME ZONE NOT NULL,
        "punchType" character varying NOT NULL DEFAULT 'IN',
        "source" character varying NOT NULL DEFAULT 'manual',
        "deviceId" character varying,
        "remarks" character varying,
        "rawPayload" jsonb,
        CONSTRAINT "PK_attendance_records_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attendance_records_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_attendance_records_capture_scheme_id"
          FOREIGN KEY ("capture_scheme_id")
          REFERENCES "capture_schemes"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION,
        CONSTRAINT "FK_attendance_records_shift_policy_id"
          FOREIGN KEY ("shift_policy_id")
          REFERENCES "shift_policies"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_attendance_records_user_id"
      ON "attendance_records" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_attendance_records_employeeCode"
      ON "attendance_records" ("employeeCode")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_attendance_records_attendanceDate"
      ON "attendance_records" ("attendanceDate")
    `);

    await queryRunner.query(`
      INSERT INTO "capture_schemes" ("id", "name", "description", "mode", "graceMinutes")
      VALUES
        ('biometric-default', 'Biometric Default', 'Standard biometric capture from device punch logs', 'BIOMETRIC', 10),
        ('mobile-selfie', 'Mobile Selfie', 'Attendance capture from employee mobile app with selfie validation', 'MOBILE', 5),
        ('web-checkin', 'Web Check-in', 'Browser-based attendance capture for remote staff', 'WEB', 0)
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "mode" = EXCLUDED."mode",
        "graceMinutes" = EXCLUDED."graceMinutes",
        "updatedAt" = now()
    `);

    await queryRunner.query(`
      INSERT INTO "shift_policies" ("id", "name", "description", "shiftStart", "shiftEnd", "lateMarkGraceMinutes", "halfDayThresholdMinutes")
      VALUES
        ('general-shift', 'General Shift', 'Standard weekday operations shift', '09:30:00', '18:30:00', 10, 240),
        ('morning-shift', 'Morning Shift', 'Early day shift for operations teams', '07:00:00', '16:00:00', 10, 240),
        ('night-shift', 'Night Shift', 'Night support shift for extended coverage', '21:00:00', '06:00:00', 15, 240)
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "shiftStart" = EXCLUDED."shiftStart",
        "shiftEnd" = EXCLUDED."shiftEnd",
        "lateMarkGraceMinutes" = EXCLUDED."lateMarkGraceMinutes",
        "halfDayThresholdMinutes" = EXCLUDED."halfDayThresholdMinutes",
        "updatedAt" = now()
    `);

    await queryRunner.query(`
      INSERT INTO "holiday_calendars" ("id", "name", "year", "location_id", "holidays")
      VALUES
        ('india-2026', 'India Holiday Calendar 2026', 2026, null, '[{"name":"Republic Day","date":"2026-01-26"},{"name":"Independence Day","date":"2026-08-15"},{"name":"Gandhi Jayanti","date":"2026-10-02"}]'),
        ('bengaluru-2026', 'Bengaluru Holiday Calendar 2026', 2026, 'blr', '[{"name":"Republic Day","date":"2026-01-26"},{"name":"Kannada Rajyotsava","date":"2026-11-01","isOptional":true}]')
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "year" = EXCLUDED."year",
        "location_id" = EXCLUDED."location_id",
        "holidays" = EXCLUDED."holidays",
        "updatedAt" = now()
    `);

    await queryRunner.query(`
      INSERT INTO "tracking_policies" ("id", "name", "description", "minimumHoursPerDay", "maximumHoursPerDay", "allowOvertime")
      VALUES
        ('standard-8h', 'Standard 8 Hours', 'Tracks an 8-hour workday with limited overtime', 8, 12, false),
        ('flexi-8h', 'Flexible 8 Hours', 'Tracks outcomes with flexible sign-in windows', 8, 14, true)
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "minimumHoursPerDay" = EXCLUDED."minimumHoursPerDay",
        "maximumHoursPerDay" = EXCLUDED."maximumHoursPerDay",
        "allowOvertime" = EXCLUDED."allowOvertime",
        "updatedAt" = now()
    `);

    await queryRunner.query(`
      INSERT INTO "weekly_off_policies" ("id", "name", "description", "weeklyOffDays", "isAlternateSaturdayOff")
      VALUES
        ('saturday-sunday', 'Saturday and Sunday', 'Regular five-day work week', '["SATURDAY","SUNDAY"]', false),
        ('sunday-only', 'Sunday Only', 'Six-day work week with Sunday as fixed off', '["SUNDAY"]', false),
        ('alternate-saturday', 'Alternate Saturday', 'Sunday off with alternate Saturdays off', '["SUNDAY"]', true)
      ON CONFLICT ("id") DO UPDATE
      SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "weeklyOffDays" = EXCLUDED."weeklyOffDays",
        "isAlternateSaturdayOff" = EXCLUDED."isAlternateSaturdayOff",
        "updatedAt" = now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_records_attendanceDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_records_employeeCode"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_records_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "weekly_off_policies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tracking_policies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "holiday_calendars"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shift_policies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "capture_schemes"`);
  }
}
