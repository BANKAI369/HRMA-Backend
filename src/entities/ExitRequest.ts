import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { ExitReason } from "./ExitReason";
import { NoticePeriod } from "./NoticePeriod";
import { User } from "./User";

@Entity("exit_requests")
export class ExitRequest extends BaseEntity {
  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  employeeUser: User;

  @Column({ name: "user_id", type: "uuid" })
  employeeUserId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "NO ACTION" })
  @JoinColumn({ name: "requestedByUserId" })
  requestedByUser: User;

  @Column({ type: "uuid" })
  requestedByUserId: string;

  @ManyToOne(() => ExitReason, { nullable: false, onDelete: "NO ACTION" })
  @JoinColumn({ name: "exit_reason_id" })
  exitReason: ExitReason;

  @Column({ name: "exit_reason_id", type: "varchar" })
  exitReasonId: string;

  @ManyToOne(() => NoticePeriod, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "noticePeriodId" })
  noticePeriod: NoticePeriod | null;

  @Column({ type: "varchar", nullable: true })
  noticePeriodId: string | null;

  @Column({ type: "date", nullable: true })
  lastWorkingDate: string | null;

  @Column({ type: "varchar", default: "Pending" })
  status: string;

  @Column({ type: "text", nullable: true })
  remarks: string | null;
}
