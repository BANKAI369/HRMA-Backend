import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Permission } from "../entities/permission";

const permissionRepo = AppDataSource.getRepository(Permission);

export const getPermissions = async (req: Request, res: Response) => {
  const permissions = await permissionRepo.find();

  res.json(permissions);
};
