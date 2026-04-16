import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { PayCycle } from "./PayCycle";
import { PayGroup } from "./PayGroup";

@Entity("pay_batches")
export class PayBatch extends BaseEntity {
  @Column({ type: "varchar", unique: true })
  batchNumber: string;

  @Column({ type: "varchar" })
  name: string;

  @ManyToOne(() => PayGroup, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "pay_group_id" })
  payGroup: PayGroup;

  @Column({ name: "pay_group_id", type: "uuid" })
  payGroupId: string;

  @ManyToOne(() => PayCycle, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "pay_cycle_id" })
  payCycle: PayCycle;

  @Column({ name: "pay_cycle_id", type: "uuid" })
  payCycleId: string;

  @Column({ type: "date" })
  periodStart: string;

  @Column({ type: "date" })
  periodEnd: string;

  @Column({ type: "date", nullable: true })
  payoutDate: string | null;

  @Column({ type: "varchar", default: "DRAFT" })
  status: string;
}

