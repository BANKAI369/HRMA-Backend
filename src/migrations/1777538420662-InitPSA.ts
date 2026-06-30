import { MigrationInterface, QueryRunner } from "typeorm";

export class InitPSA1777538420662 implements MigrationInterface {
    name = 'InitPSA1777538420662'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "project_allocations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "projectId" uuid NOT NULL, "allocationPercentage" integer NOT NULL DEFAULT '100', "startDate" date, "endDate" date, CONSTRAINT "PK_7a462ca39fe5d16b55005e95491" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."project_tasks_status_enum" AS ENUM('To Do', 'In Progress', 'Done')`);
        await queryRunner.query(`CREATE TABLE "project_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying NOT NULL, "status" "public"."project_tasks_status_enum" NOT NULL DEFAULT 'To Do', "projectId" uuid NOT NULL, CONSTRAINT "PK_b1b6204912a6f44133df3a4518b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "timesheet_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "projectId" uuid NOT NULL, "taskId" uuid, "date" date NOT NULL, "hours" numeric(5,2) NOT NULL, "description" character varying, CONSTRAINT "PK_25a8a9b6a96e72864d598563c56" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "project_allocations" ADD CONSTRAINT "FK_99ae46243c3b024ca3634d95470" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_allocations" ADD CONSTRAINT "FK_224071f425ba2a2b486117b2e09" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_tasks" ADD CONSTRAINT "FK_8691c10b6396e041f4b6d48f8a0" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "timesheet_entries" ADD CONSTRAINT "FK_013f4b223291c19dd0cfbe8b486" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "timesheet_entries" ADD CONSTRAINT "FK_4879f2ec8c7a0e7a173dd1c912d" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "timesheet_entries" ADD CONSTRAINT "FK_e6e73df609e70ed6dc428a3a4fc" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "timesheet_entries" DROP CONSTRAINT "FK_e6e73df609e70ed6dc428a3a4fc"`);
        await queryRunner.query(`ALTER TABLE "timesheet_entries" DROP CONSTRAINT "FK_4879f2ec8c7a0e7a173dd1c912d"`);
        await queryRunner.query(`ALTER TABLE "timesheet_entries" DROP CONSTRAINT "FK_013f4b223291c19dd0cfbe8b486"`);
        await queryRunner.query(`ALTER TABLE "project_tasks" DROP CONSTRAINT "FK_8691c10b6396e041f4b6d48f8a0"`);
        await queryRunner.query(`ALTER TABLE "project_allocations" DROP CONSTRAINT "FK_224071f425ba2a2b486117b2e09"`);
        await queryRunner.query(`ALTER TABLE "project_allocations" DROP CONSTRAINT "FK_99ae46243c3b024ca3634d95470"`);
        await queryRunner.query(`DROP TABLE "timesheet_entries"`);
        await queryRunner.query(`DROP TABLE "project_tasks"`);
        await queryRunner.query(`DROP TYPE "public"."project_tasks_status_enum"`);
        await queryRunner.query(`DROP TABLE "project_allocations"`);
    }

}
