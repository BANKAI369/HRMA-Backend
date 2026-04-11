import "reflect-metadata";
import { join } from "path";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { AuditLog } from "../entities/AuditLog";
import { Currency } from "../entities/Currency";
import { Department } from "../entities/Department";
import { DocumentType } from "../entities/DocumentTypes";
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

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Bankai@123",
  database: process.env.DB_NAME || "HRMA",
  synchronize: (process.env.DB_SYNCHRONIZE || "false").toLowerCase() === "true",
  logging: false,
  entities: [
    User,
    Role,
    Permission,
    Department,
    DocumentType,
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
});
