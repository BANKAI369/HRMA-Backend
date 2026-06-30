import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { CaptureScheme } from "./CaptureScheme";
import { ShiftPolicy } from "./ShiftPolicy";
import { User } from "./User";

@Entity("attendance_records")
export class AttendanceRecord extends BaseEntity {
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user: User | null;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId: string | null;

  @Column({ type: "varchar", nullable: true })
  employeeCode: string | null;

  @ManyToOne(() => CaptureScheme, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "capture_scheme_id" })
  captureScheme: CaptureScheme | null;

  @Column({ name: "capture_scheme_id", type: "varchar", nullable: true })
  captureSchemeId: string | null;

  @ManyToOne(() => ShiftPolicy, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "shift_policy_id" })
  shiftPolicy: ShiftPolicy | null;

  @Column({ name: "shift_policy_id", type: "varchar", nullable: true })
  shiftPolicyId: string | null;

  @Column({ type: "date" })
  attendanceDate: string;

  @Column({ type: "timestamp with time zone" })
  punchTime: Date;

  @Column({ type: "varchar", default: "IN" })
  punchType: string;

  @Column({ type: "varchar", default: "manual" })
  source: string;

  @Column({ type: "varchar", nullable: true })
  deviceId: string | null;

  @Column({ type: "varchar", nullable: true })
  remarks: string | null;

  @Column({ type: "jsonb", nullable: true })
  rawPayload: Record<string, unknown> | null;
}
