import { AppDataSource } from "../config/data-source";
import { Module } from "../entities/Module";

const moduleRepository = AppDataSource.getRepository(Module);

export async function findAllModules() {
  return moduleRepository.find({
    relations: ["permissions"],
  });
}

export async function findModuleById(id: string) {
  const moduleEntity = await moduleRepository.findOne({
    where: { id },
    relations: ["permissions"],
  });

  if (!moduleEntity) {
    throw new Error("Module not found");
  }

  return moduleEntity;
}
