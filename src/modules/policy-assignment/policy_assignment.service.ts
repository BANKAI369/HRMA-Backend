import { AppDataSource } from "../../config/data-source";

import {
  PolicyAssignment,
  PolicyAssignmentType,
} from "../../entities/PolicyAssignment";

import { CreatePolicyAssignmentDto } from "./dto/create-policy-assignment.dto";

export class PolicyAssignmentService {
  private repo =
    AppDataSource.getRepository(PolicyAssignment);

  async create(
    dto: CreatePolicyAssignmentDto,
    tenantId: string
  ) {
    switch (dto.assignmentType) {
      case PolicyAssignmentType.EMPLOYEE:
        if (!dto.employeeId) {
          throw new Error(
            "employeeId is required"
          );
        }
        break;

      case PolicyAssignmentType.DEPARTMENT:
        if (!dto.departmentId) {
          throw new Error(
            "departmentId is required"
          );
        }
        break;

      case PolicyAssignmentType.DESIGNATION:
        if (!dto.designationId) {
          throw new Error(
            "designationId is required"
          );
        }
        break;

      case PolicyAssignmentType.EMPLOYMENT_TYPE:
        if (!dto.employmentType) {
          throw new Error(
            "employmentType is required"
          );
        }
        break;
    }

    const assignment =
      this.repo.create({
        ...dto,
        tenantId,
      });

    return this.repo.save(assignment);
  }

  async getAll(
    tenantId: string
  ) {
    return this.repo.find({
      where: {
        tenantId,
        isActive: true,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async getById(id: string) {
    return this.repo.findOne({
      where: { id },
    });
  }

  async update(
    id: string,
    payload: Partial<PolicyAssignment>
  ) {
    await this.repo.update(
      id,
      payload
    );

    return this.getById(id);
  }

  async delete(id: string) {
    await this.repo.update(id, {
      isActive: false,
    });
  }
}
