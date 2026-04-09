import "reflect-metadata";
import { DataSource } from "typeorm";
import { Department } from "../entities/Department";
import { Permission } from "../entities/permission";
import { Role } from "../entities/role";
import { User } from "../entities/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "Bankai@123",
  database: process.env.DB_NAME || "hrma",
  synchronize: (process.env.DB_SYNCHRONIZE || "true").toLowerCase() === "true",
  logging: false,
  entities: [User, Role, Permission, Department],
});
