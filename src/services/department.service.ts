import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/Department";
import { User } from "../entities/User";
import { auditLogService, buildAuditDiff } from "./audit-log.service";
import { Roles } from "../utils/roles.enum";

const departmentRepo = AppDataSource.getRepository(Department);
const userRepo = AppDataSource.getRepository(User);

type AuditOptions = {
  actorUserId?: string | null;
};

export class DepartmentService {
  private buildDepartmentAuditSnapshot(department: Department) {
    return {
      name: department.name,
    };
  }

  private buildUserDepartmentAuditSnapshot(user: User) {
    return {
      department: this.serializeDepartment(user.department ?? null),
    };
  }

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

  private serializeDepartment(department: Department | null) {
    if (!department) {
      return null;
    }

    return {
      id: department.id,
      name: department.name,
    };
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

  async assignManager(
    departmentId: string,
    userId: string,
    options: AuditOptions = {}
  ) {
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

    const previousDepartmentSnapshot = this.buildUserDepartmentAuditSnapshot(user);
    user.department = department;
    user.departmentId = department.id;

    const nextDepartmentSnapshot = this.buildUserDepartmentAuditSnapshot(user);
    const departmentAssignmentDiff = buildAuditDiff(
      previousDepartmentSnapshot,
      nextDepartmentSnapshot
    );

    await AppDataSource.transaction(async (managerTx) => {
      await managerTx.save(User, user);

      if (departmentAssignmentDiff.hasChanges) {
        await auditLogService.log(
          {
            actorUserId: options.actorUserId ?? null,
            action: "EMPLOYEE_PROFILE_UPDATED",
            entityType: "employee_profile",
            entityId: user.id,
            oldValue: departmentAssignmentDiff.oldValue,
            newValue: departmentAssignmentDiff.newValue,
          },
          managerTx
        );
      }
    });

    return this.getDepartmentById(department.id);
  }

  async assignUserToDepartment(
    userId: string,
    departmentId: string,
    options: AuditOptions = {}
  ){
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ["role", "department"],
    });
    if(!user) throw new Error("User Not Found");
    
    const department = await departmentRepo.findOne({
      where: { id: departmentId },
    });
    if(!department) throw new Error("Department Not Found");

    if (this.isManager(user)) {
      await this.ensureDepartmentManagerSlot(departmentId, user.id);
    }

    const previousDepartmentSnapshot = this.buildUserDepartmentAuditSnapshot(user);
    user.department = department;
    user.departmentId = department.id;

    const nextDepartmentSnapshot = this.buildUserDepartmentAuditSnapshot(user);
    const departmentAssignmentDiff = buildAuditDiff(
      previousDepartmentSnapshot,
      nextDepartmentSnapshot
    );

    await AppDataSource.transaction(async (managerTx) => {
      await managerTx.save(User, user);

      if (departmentAssignmentDiff.hasChanges) {
        await auditLogService.log(
          {
            actorUserId: options.actorUserId ?? null,
            action: "EMPLOYEE_PROFILE_UPDATED",
            entityType: "employee_profile",
            entityId: user.id,
            oldValue: departmentAssignmentDiff.oldValue,
            newValue: departmentAssignmentDiff.newValue,
          },
          managerTx
        );
      }
    });

    return user;
  }

  async getDepartmentById(id: string){
    const department = await departmentRepo.findOne({
        where: { id },
        relations: ["employees", "employees.role"],
    });
    if(!department) throw new Error("Department not found");
    return this.withDerivedManager(department);
  }

  async updateDepartment(
    id: string,
    name: string,
    options: AuditOptions = {}
  ){
    const department = await departmentRepo.findOne({
        where: { id },
    });
    if(!department) throw new Error("Department not Found");

    const previousDepartmentSnapshot = this.buildDepartmentAuditSnapshot(department);
    department.name = name.trim();
    const nextDepartmentSnapshot = this.buildDepartmentAuditSnapshot(department);
    const departmentAuditDiff = buildAuditDiff(
      previousDepartmentSnapshot,
      nextDepartmentSnapshot
    );

    await AppDataSource.transaction(async (managerTx) => {
      await managerTx.save(Department, department);

      if (departmentAuditDiff.hasChanges) {
        await auditLogService.log(
          {
            actorUserId: options.actorUserId ?? null,
            action: "DEPARTMENT_UPDATED",
            entityType: "department",
            entityId: department.id,
            oldValue: departmentAuditDiff.oldValue,
            newValue: departmentAuditDiff.newValue,
          },
          managerTx
        );
      }
    });

    return department;
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
