import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum PolicyAssignmentType {
  ORGANIZATION = "ORGANIZATION",
  DEPARTMENT = "DEPARTMENT",
  DESIGNATION = "DESIGNATION",
  EMPLOYMENT_TYPE = "EMPLOYMENT_TYPE",
  EMPLOYEE = "EMPLOYEE",
}

@Entity("policy_assignments")
export class PolicyAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  tenantId!: string;

  @Column()
  policyId!: string;

  @Column({
    type: "enum",
    enum: PolicyAssignmentType,
  })
  assignmentType!: PolicyAssignmentType;

  @Column({ nullable: true })
  employeeId!: string;

  @Column({ nullable: true })
  departmentId!: string;

  @Column({ nullable: true })
  designationId!: string;

  @Column({ nullable: true })
  employmentType!: string;

  @Column({
    type: "timestamp",
  })
  effectiveFrom!: Date;

  @Column({
    type: "timestamp",
    nullable: true,
  })
  effectiveTo!: Date;

  @Column({
    default: true,
  })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}