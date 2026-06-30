import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, RelationId, BaseEntity } from "typeorm";
import { User } from "./User";
import { LeaveType } from "./LeaveType";
import { LeaveStatus } from "../enum/leaveStatus.enum";

@Entity("leave_requests")
export class LeaveRequest extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

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
  status: LeaveStatus;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "reviewed_by" })
  reviewedByUser?: User | null;

  @RelationId((lr: LeaveRequest) => lr.reviewedByUser)
  reviewedBy?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  reviewedAt?: Date | null;

  @Column({ type: "text", nullable: true })
  reviewRemarks?: string | null;
}