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
