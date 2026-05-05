import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Currency } from "./Currency";
import { PayCycle } from "./PayCycle";

@Entity("pay_groups")
export class PayGroup extends BaseEntity {
  @Column({ type: "varchar", unique: true })
  name: string;

  @Column({ type: "varchar", nullable: true })
  description: string | null;

  @ManyToOne(() => PayCycle, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "pay_cycle_id" })
  payCycle: PayCycle;

  @Column({ name: "pay_cycle_id", type: "uuid" })
  payCycleId: string;

  @ManyToOne(() => Currency, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "currency_id" })
  currency: Currency | null;

  @Column({ name: "currency_id", type: "varchar", nullable: true })
  currencyId: string | null;

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}

