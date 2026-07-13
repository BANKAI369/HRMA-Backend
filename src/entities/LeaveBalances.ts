import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("leave_balances")
export class LeaveBalance extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  tenantId!: string;

  @Column()
  employeeId!: string;

  @Column()
  leaveTypeId!: string;

  @Column()
  policyId!: string;

  @Column()
  year!: number;

  @Column("decimal", {
    precision: 5,
    scale: 2,
    default: 0,
  })
  allocated!: number;

  @Column("decimal", {
    precision: 5,
    scale: 2,
    default: 0,
  })
  used!: number;

  @Column("decimal", {
    precision: 5,
    scale: 2,
    default: 0,
  })
  pending!: number;

  @Column("decimal", {
    precision: 5,
    scale: 2,
    default: 0,
  })
  remaining!: number;
}