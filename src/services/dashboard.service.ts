import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/Department";
import { User } from "../entities/User";

const userRepo = AppDataSource.getRepository(User);
const departmentRepo = AppDataSource.getRepository(Department);

type DashboardUserScope = {
  departmentId?: string;
};

export class DashboardService {
  async getMetrics(role: string, userIdentifier: string, userEmail?: string) {
    const isAdmin = role.toLowerCase() === "admin";
    const scope = isAdmin
      ? {}
      : await this.resolveUserScope(userIdentifier, userEmail);

    const topDepartmentsQuery = departmentRepo
      .createQueryBuilder("department")
      .leftJoin("department.employees", "employee")
      .leftJoin("department.manager", "manager")
      .select("department.id", "id")
      .addSelect("department.name", "name")
      .addSelect("COUNT(employee.id)", "count")
      .addSelect("manager.username", "manager")
      .groupBy("department.id")
      .addGroupBy("department.name")
      .addGroupBy("manager.id")
      .addGroupBy("manager.username")
      .orderBy("COUNT(employee.id)", "DESC")
      .limit(4);

    if (scope.departmentId) {
      topDepartmentsQuery.where("department.id = :departmentId", {
        departmentId: scope.departmentId,
      });
    }

    const [
      employeeCount,
      managerCount,
      totalUsers,
      activeUsers,
      inactiveUsers,
      recentUsers,
      departmentCount,
      topDepartments,
    ] = await Promise.all([
      this.buildScopedUserQuery(scope)
        .leftJoin("user.role", "role")
        .andWhere("LOWER(role.name) = :roleName", { roleName: "employee" })
        .getCount(),

      this.buildScopedUserQuery(scope)
        .leftJoin("user.role", "role")
        .andWhere("LOWER(role.name) = :roleName", { roleName: "manager" })
        .getCount(),

      this.buildScopedUserQuery(scope).getCount(),

      this.buildScopedUserQuery(scope)
        .andWhere("user.isActive = :isActive", { isActive: true })
        .getCount(),

      this.buildScopedUserQuery(scope)
        .andWhere("user.isActive = :isActive", { isActive: false })
        .getCount(),

      this.buildScopedUserQuery(scope)
        .leftJoinAndSelect("user.role", "role")
        .leftJoinAndSelect("user.department", "department")
        .andWhere("user.createdAt IS NOT NULL")
        .orderBy("user.createdAt", "DESC")
        .take(5)
        .getMany(),

      isAdmin
        ? departmentRepo.count()
        : Promise.resolve(scope.departmentId ? 1 : 0),

      topDepartmentsQuery.getRawMany<{
        id: string;
        name: string;
        count: string;
        manager: string | null;
      }>(),
    ]);

    return {
      employeeCount,
      managerCount,
      departmentCount,
      totalUsers,
      activeUsers,
      inactiveUsers,
      recentUsers,
      topDepartments: topDepartments.map((department) => ({
        id: department.id,
        name: department.name,
        count: Number(department.count) || 0,
        manager: department.manager,
      })),
    };
  }

  private async resolveUserScope(
    userIdentifier: string,
    userEmail?: string
  ): Promise<DashboardUserScope> {
    const currentUserQuery = userRepo
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.department", "department");

    if (userIdentifier) {
      currentUserQuery
        .where("user.id = :userIdentifier", { userIdentifier })
        .orWhere("user.username = :userIdentifier", { userIdentifier });
    }

    if (userEmail) {
      if (userIdentifier) {
        currentUserQuery.orWhere("user.email = :userEmail", { userEmail });
      } else {
        currentUserQuery.where("user.email = :userEmail", { userEmail });
      }
    }

    if (!userIdentifier && !userEmail) {
      throw new Error("User identifier is required");
    }

    const currentUser = await currentUserQuery.getOne();

    if (!currentUser?.department?.id) {
      throw new Error("User is not assigned to any department");
    }

    return { departmentId: currentUser.department.id };
  }

  private buildScopedUserQuery(scope: DashboardUserScope) {
    const query = userRepo.createQueryBuilder("user").where("1 = 1");
    const whereClause = this.buildScopeWhereClause(scope);

    if (whereClause) {
      query.andWhere(whereClause, scope);
    }

    return query;
  }

  private buildScopeWhereClause(scope: DashboardUserScope) {
    if (scope.departmentId) {
      return "user.departmentId = :departmentId";
    }

    return null;
  }
}
