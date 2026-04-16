import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { PayGrade } from "./PayGrade";

@Entity("pay_bands")
export class PayBand extends BaseEntity {
  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", nullable: true })
  description: string | null;

  @ManyToOne(() => PayGrade, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "pay_grade_id" })
  payGrade: PayGrade;

  @Column({ name: "pay_grade_id", type: "uuid" })
  payGradeId: string;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  minAmount: string;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  maxAmount: string;

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}

