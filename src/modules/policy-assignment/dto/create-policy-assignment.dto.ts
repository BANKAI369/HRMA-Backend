import { PolicyAssignmentType } from "../../../entities/PolicyAssignment";

export interface CreatePolicyAssignmentDto {
  policyId: string;

  assignmentType: PolicyAssignmentType;

  employeeId?: string;

  departmentId?: string;

  designationId?: string;

  employmentType?: string;

  effectiveFrom: Date;

  effectiveTo?: Date;
}
