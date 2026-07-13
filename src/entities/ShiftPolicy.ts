import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("shift_policies")
export class ShiftPolicy {
  @PrimaryColumn({ type: "varchar" })
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: "varchar", nullable: true })
  description: string | null;

  @Column({ type: "time" })
  shiftStart: string;

  @Column({ type: "time" })
  shiftEnd: string;

  @Column({ type: "int", default: 0 })
  lateMarkGraceMinutes: number;

  @Column({ type: "int", default: 0 })
  halfDayThresholdMinutes: number;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
