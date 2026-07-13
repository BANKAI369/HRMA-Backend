import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { User } from "./User";

@Entity("employee_fnf")
export class EmployeeFnF extends BaseEntity {
  @OneToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id", type: "uuid", unique: true })
  userId: string;

  @Column({ type: "varchar", nullable: true })
  employeeCode: string | null;

  @Column({ type: "date", nullable: true })
  lastWorkingDate: string | null;

  @Column({ type: "varchar", default: "PENDING" })
  status: string;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  payableAmount: string;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  deductionAmount: string;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  netSettlementAmount: string;

  @Column({ type: "varchar", nullable: true })
  remarks: string | null;
}

