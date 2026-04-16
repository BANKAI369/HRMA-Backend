import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tracking_policies")
export class TrackingPolicy {
  @PrimaryColumn({ type: "varchar" })
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: "varchar", nullable: true })
  description: string | null;

  @Column({ type: "numeric", precision: 5, scale: 2, default: 8 })
  minimumHoursPerDay: number;

  @Column({ type: "numeric", precision: 5, scale: 2, default: 12 })
  maximumHoursPerDay: number;

  @Column({ type: "boolean", default: false })
  allowOvertime: boolean;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
