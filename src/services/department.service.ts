import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/Department";
import { User } from "../entities/User";
import { Roles } from "../utils/roles.enum";

const departmentRepo = AppDataSource.getRepository(Department);
const userRepo = AppDataSource.getRepository(User);

export class DepartmentService {
  private serializeManager(user: User | null) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
          }
        : null,
      isActive: user.isActive,
    };
  }

  private isManager(user: User | null) {
    return user?.role?.name?.toLowerCase() === Roles.Manager.toLowerCase();
  }

  private async ensureDepartmentManagerSlot(
    departmentId: string,
    currentUserId?: string
  ) {
    const existingManager = await userRepo
      .createQueryBuilder("user")
      .leftJoin("user.role", "role")
      .where("user.departmentId = :departmentId", { departmentId })
      .andWhere("LOWER(role.name) = :roleName", {
        roleName: Roles.Manager.toLowerCase(),
      })
      .andWhere(currentUserId ? "user.id != :currentUserId" : "1 = 1", {
        currentUserId,
      })
      .getOne();

    if (existingManager) {
      throw new Error("Department already has a manager");
    }
  }

  private withDerivedManager(department: Department & { employees?: User[] }) {
    const manager =
      department.employees?.find((employee) => this.isManager(employee)) ?? null;

    return {
      id: department.id,
      name: department.name,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
      manager: this.serializeManager(manager),
    };
  }

  async createDepartment(name: string) {
    const existing = await departmentRepo.findOne({ where: { name } });
    if (existing) throw new Error("Department already exists");

    const department = departmentRepo.create({ name });
    return await departmentRepo.save(department);
  }

  async assignManager(departmentId: string, userId: string) {
    const department = await departmentRepo.findOne({ where: { id: departmentId } });

    if (!department) throw new Error("Department not found");

    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ["role", "department"],
    });
    if (!user) throw new Error("User not found");

    if (!this.isManager(user)) {
      throw new Error("User must have Manager role");
    }

    await this.ensureDepartmentManagerSlot(departmentId, user.id);

    user.department = department;
    await userRepo.save(user);

    return this.getDepartmentById(department.id);
  }

  async assignUserToDepartment(userId: string, departmentId: string){
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ["role"],
    });
    if(!user) throw new Error("User Not Found");
    
    const department = await departmentRepo.findOne({
      where: { id: departmentId },
    });
    if(!department) throw new Error("Department Not Found");

    if (this.isManager(user)) {
      await this.ensureDepartmentManagerSlot(departmentId, user.id);
    }
    
    user.department = department;
    return await userRepo.save(user);
  }

  async getDepartmentById(id: string){
    const department = await departmentRepo.findOne({
        where: { id },
        relations: ["employees", "employees.role"],
    });
    if(!department) throw new Error("Department not found");
    return this.withDerivedManager(department);
  }

  async updateDepartment(id: string, name: string){
    const department = await departmentRepo.findOne({
        where: { id },
    });
    if(!department) throw new Error("Department not Found");

    department.name = name.trim();
    return await departmentRepo.save(department);
  }

  async deleteDepartment(id: string){
    const department = await departmentRepo.findOne({
        where: {id},
        relations: ["employees"],
    });

    if(!department) throw new Error("Department not Found");

    for (const user of department.employees){
        user.department = null as any;
        await userRepo.save(user);
    }

    await departmentRepo.remove(department);

    return { message: "department deleted successfully" };
  }

  async listDepartments() {
    const departments = await departmentRepo.find({
      relations: ["employees", "employees.role"],
    });

    return departments.map((department) => this.withDerivedManager(department));
  }
}
