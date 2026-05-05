import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Currency } from "./Currency";

@Entity("pay_grades")
export class PayGrade extends BaseEntity {
  @Column({ type: "varchar", unique: true })
  name: string;

  @Column({ type: "varchar", nullable: true })
  description: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  minAmount: string;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  maxAmount: string;

  @ManyToOne(() => Currency, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "currency_id" })
  currency: Currency | null;

  @Column({ name: "currency_id", type: "varchar", nullable: true })
  currencyId: string | null;

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}

