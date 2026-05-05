import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("capture_schemes")
export class CaptureScheme {
  @PrimaryColumn({ type: "varchar" })
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: "varchar", nullable: true })
  description: string | null;

  @Column({ type: "varchar" })
  mode: string;

  @Column({ type: "int", default: 0 })
  graceMinutes: number;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
