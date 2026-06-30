<<<<<<< HEAD
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, RelationId, BaseEntity } from "typeorm";
import { User } from "./User";
import { LeaveType } from "./LeaveType";
import { LeaveStatus } from "../enum/leaveStatus.enum";

@Entity("leave_requests")
export class LeaveRequest extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

=======
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { LeaveType } from "./LeaveType";
import { User } from "./User";
import { LeaveStatus } from "../utils/leave-status.enum";

@Entity("leave_requests")
export class LeaveRequest extends BaseEntity {
>>>>>>> 5d05ed33fe7ba54133d7769201aef82cfbfdf950
  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

<<<<<<< HEAD
  @RelationId((lr: LeaveRequest) => lr.user)
  userId: string;

  @ManyToOne(() => LeaveType, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "leave_type_id" })
  leaveType: LeaveType;

  @RelationId((lr: LeaveRequest) => lr.leaveType)
  leaveTypeId: string;

  @Column({ type: "date", name: "start_date" })
  startDate: string;

  @Column({ type: "date", name: "end_date" })
  endDate: string;

  @Column({ type: "int", name: "total_days", default: 0 })
  totalDays: number;

  @Column({ type: "text", nullable: true })
  reason?: string | null;

  @Column({ type: "enum", enum: LeaveStatus, default: LeaveStatus.PENDING })
=======
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => LeaveType, { nullable: false, onDelete: "NO ACTION" })
  @JoinColumn({ name: "leave_type_id" })
  leaveType: LeaveType;

  @Column({ name: "leave_type_id", type: "uuid" })
  leaveTypeId: string;

  @Column({ name: "start_date", type: "date" })
  startDate: string;

  @Column({ name: "end_date", type: "date" })
  endDate: string;

  @Column({ name: "total_days", type: "numeric", precision: 5, scale: 2 })
  totalDays: number;

  @Column({ type: "text", nullable: true })
  reason: string | null;

  @Column({
    type: "enum",
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
>>>>>>> 5d05ed33fe7ba54133d7769201aef82cfbfdf950
  status: LeaveStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "reviewed_by" })
<<<<<<< HEAD
  reviewedByUser?: User | null;

  @RelationId((lr: LeaveRequest) => lr.reviewedByUser)
  reviewedBy?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  reviewedAt?: Date | null;

  @Column({ type: "text", nullable: true })
  reviewRemarks?: string | null;
}
=======
  reviewedByUser: User | null;

  @Column({ name: "reviewed_by", type: "uuid", nullable: true })
  reviewedBy: string | null;

  @Column({ name: "reviewed_at", type: "timestamptz", nullable: true })
  reviewedAt: Date | null;

  @Column({ name: "review_remarks", type: "text", nullable: true })
  reviewRemarks: string | null;
}
>>>>>>> 5d05ed33fe7ba54133d7769201aef82cfbfdf950
