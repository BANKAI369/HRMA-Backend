<<<<<<< HEAD
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./Tenant";

@Entity("leave_types")
export class LeaveType extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tenant_id" })
  tenantId!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 50 })
  code!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ default: 0 })
  annualAllowanceDays!: number;

  @Column({ default: true })
  isPaid!: boolean;

  @Column({ default: true })
  requiresApproval!: boolean;

  @Column({ default: false })
  allowHalfDay!: boolean;

  @Column({ default: false })
  allowHourly!: boolean;

  @Column({ default: false })
  requiresDocument!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenant_id" })
  tenant!: Tenant;
}
=======
import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("leave_types")
export class LeaveType extends BaseEntity {
  @Column({ type: "varchar", unique: true })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "int", default: 0 })
  annualAllowanceDays: number;

  @Column({ type: "boolean", default: true })
  isPaid: boolean;

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}
>>>>>>> 5d05ed33fe7ba54133d7769201aef82cfbfdf950
