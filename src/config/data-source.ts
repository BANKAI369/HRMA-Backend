import "reflect-metadata";
import { join } from "path";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { AuditLog } from "../entities/AuditLog";
import { AttendanceRecord } from "../entities/AttendanceRecord";
import { BatchPayment } from "../entities/BatchPayment";
import { BonusType } from "../entities/BonusType";
import { CaptureScheme } from "../entities/CaptureScheme";
import { Currency } from "../entities/Currency";
import { Department } from "../entities/Department";
import { Document } from "../entities/Document";
import { DocumentType } from "../entities/DocumentTypes";
import { EmployeeFnF } from "../entities/EmployeeFnF";
import { EmployeeGroup } from "../entities/EmployeeGroup";
import { EmployeeProfile } from "../entities/EmployeeProfile";
import { EmployeeSalary } from "../entities/EmployeeSalary";
import { ExitRequest } from "../entities/ExitRequest";
import { ExitReason } from "../entities/ExitReason";
import { GroupType } from "../entities/GroupType";
import { HolidayCalendar } from "../entities/HolidayCalendar";
import { JobTitle } from "../entities/JobTitle";
import { LeaveRequest } from "../entities/LeaveRequest";
import { LeaveType } from "../entities/LeaveType";
import { Location } from "../entities/Location";
import { NoticePeriod } from "../entities/NoticePeriod";
import { PayBand } from "../entities/PayBand";
import { PayBatch } from "../entities/PayBatch";
import { PayCycle } from "../entities/PayCycle";
import { PayGrade } from "../entities/PayGrade";
import { PayGroup } from "../entities/PayGroup";
import { Permission } from "../entities/permission";
import { Role } from "../entities/role";
import { SalaryComponent } from "../entities/SalaryComponent";
import { ShiftPolicy } from "../entities/ShiftPolicy";
import { TrackingPolicy } from "../entities/TrackingPolicy";
import { User } from "../entities/User";
import { WeeklyOffPolicy } from "../entities/WeeklyOffPolicy";
import { Client } from "../entities/Client";
import { Project } from "../entities/Projects";
import { ProjectPhase } from "../entities/ProjectPhase";
import { TimeFrame } from "../entities/TimeFrame";
import { Goal } from "../entities/Goal";
import { Badge } from "../entities/Badge";
import { Praise } from "../entities/Praise";
import { ProjectAllocations } from "../entities/ProjectAllocation";
import { ProjectTask } from "../entities/ProjectTask";
import { TimeSheetEntry } from "../entities/TimeSheetEntry";

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
    AttendanceRecord,
    BatchPayment,
    BonusType,
    CaptureScheme,
    Role,
    Permission,
    Department,
    Document,
    DocumentType,
    EmployeeFnF,
    AuditLog,
    Location,
    JobTitle,
    Currency,
    NoticePeriod,
    ExitReason,
    GroupType,
    EmployeeGroup,
    EmployeeProfile,
    EmployeeSalary,
    ExitRequest,
    LeaveType,
    LeaveRequest,
    PayBand,
    PayBatch,
    PayCycle,
    PayGrade,
    PayGroup,
    SalaryComponent,
    ShiftPolicy,
    HolidayCalendar,
    TrackingPolicy,
    WeeklyOffPolicy,
    ProjectPhase,
    Client,
    Project,
    TimeFrame,
    Goal,
    Badge,
    Praise,
    AuditLog,
    ProjectAllocations,
    ProjectTask,
    TimeSheetEntry, 
  ],
  migrations: [join(__dirname, "../migrations/*.{ts,js}")],
});
