import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./Tenant";

@Entity("leave_types")
export class LeaveType extends BaseEntity {
  @Column({ name: "tenant_id" })
  tenantId!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 50 })
  code!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

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

