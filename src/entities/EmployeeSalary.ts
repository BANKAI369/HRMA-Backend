import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { PayBand } from "./PayBand";
import { PayGrade } from "./PayGrade";
import { PayGroup } from "./PayGroup";
import { User } from "./User";

@Entity("employee_salaries")
export class EmployeeSalary extends BaseEntity {
  @OneToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id", type: "uuid", unique: true })
  userId: string;

  @Column({ type: "varchar", nullable: true })
  employeeCode: string | null;

  @ManyToOne(() => PayGroup, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "pay_group_id" })
  payGroup: PayGroup | null;

  @Column({ name: "pay_group_id", type: "uuid", nullable: true })
  payGroupId: string | null;

  @ManyToOne(() => PayGrade, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "pay_grade_id" })
  payGrade: PayGrade | null;

  @Column({ name: "pay_grade_id", type: "uuid", nullable: true })
  payGradeId: string | null;

  @ManyToOne(() => PayBand, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "pay_band_id" })
  payBand: PayBand | null;

  @Column({ name: "pay_band_id", type: "uuid", nullable: true })
  payBandId: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  annualCtc: string;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  monthlyGross: string;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  monthlyNet: string;

  @Column({ type: "date" })
  effectiveFrom: string;

  @Column({ type: "jsonb", default: () => "'[]'" })
  components: Array<Record<string, unknown>>;

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}

