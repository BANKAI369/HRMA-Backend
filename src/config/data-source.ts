import "reflect-metadata";
import { join } from "path";
import { DataSource } from "typeorm";
<<<<<<< Updated upstream
import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USER || process.env.DB_USERNAME,
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.DB_NAME || process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [path.join(__dirname, "..", "entities", "*.{ts,js}")],
  migrations: [path.join(__dirname, "..", "migrations", "*.{ts,js}")],
=======
import { AuditLog } from "../entities/AuditLog";
import { Currency } from "../entities/Currency";
import { Department } from "../entities/Department";
import { EmployeeGroup } from "../entities/EmployeeGroup";
import { EmployeeProfile } from "../entities/EmployeeProfile";
import { ExitRequest } from "../entities/ExitRequest";
import { ExitReason } from "../entities/ExitReason";
import { GroupType } from "../entities/GroupType";
import { JobTitle } from "../entities/JobTitle";
import { Location } from "../entities/Location";
import { NoticePeriod } from "../entities/NoticePeriod";
import { Permission } from "../entities/permission";
import { Role } from "../entities/role";
import { User } from "../entities/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Bankai@123",
  database: process.env.DB_NAME || "HRMA",
  synchronize: (process.env.DB_SYNCHRONIZE || "true").toLowerCase() === "true",
  logging: false,
  entities: [
    User,
    Role,
    Permission,
    Department,
    AuditLog,
    Location,
    JobTitle,
    Currency,
    NoticePeriod,
    ExitReason,
    GroupType,
    EmployeeGroup,
    EmployeeProfile,
    ExitRequest,
  ],
  migrations: [join(__dirname, "../migrations/*.{ts,js}")],
>>>>>>> Stashed changes
});
