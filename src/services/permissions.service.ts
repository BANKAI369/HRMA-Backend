import { AppDataSource } from "../config/data-source";
import { Permission } from "../entities/permission";

const permissionRepository = AppDataSource.getRepository(Permission);

export async function findAllPermissions() {
  return await permissionRepository.find();
}
