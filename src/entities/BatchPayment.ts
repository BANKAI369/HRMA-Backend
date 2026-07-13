import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { PayBatch } from "./PayBatch";
import { User } from "./User";

@Entity("batch_payments")
export class BatchPayment extends BaseEntity {
  @ManyToOne(() => PayBatch, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "pay_batch_id" })
  payBatch: PayBatch;

  @Column({ name: "pay_batch_id", type: "uuid" })
  payBatchId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user: User | null;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId: string | null;

  @Column({ type: "varchar", nullable: true })
  employeeCode: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  grossAmount: string;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  deductionAmount: string;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  netAmount: string;

  @Column({ type: "varchar", default: "PENDING" })
  paymentStatus: string;

  @Column({ type: "timestamp with time zone", nullable: true })
  paidAt: Date | null;

  @Column({ type: "varchar", nullable: true })
  paymentReference: string | null;
}

