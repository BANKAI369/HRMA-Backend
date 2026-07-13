import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Tenant } from "./Tenant";

@Entity("leave_types")
export class LeaveType extends BaseEntity {
  @Column({ name: "tenant_id", type: "uuid" })
  tenantId: string;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "int", default: 0 })
  annualAllowanceDays: number;

  @Column({ type: "boolean", default: true })
  isPaid: boolean;

  @Column({ type: "boolean", default: true })
  requiresApproval: boolean;

  @Column({ type: "boolean", default: false })
  allowHalfDay: boolean;

  @Column({ type: "boolean", default: false })
  allowHourly: boolean;

  @Column({ type: "boolean", default: false })
  requiresDocument: boolean;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;
}
