import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { Client } from "./Client";
import { ProjectPhase } from "./ProjectPhase";

export enum ProjectStatus {
  PLANNED = "Planned",
  ACTIVE = "Active",
  ON_HOLD = "On Hold",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}

@Entity("projects")
export class Project extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({
    type: "enum",
    enum: ProjectStatus,
    default: ProjectStatus.PLANNED,
  })
  status: ProjectStatus;

  @Column({ type: "date", nullable: true })
  startDate?: string;

  @Column({ type: "date", nullable: true })
  endDate?: string;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  budget?: number;

  @ManyToOne(() => Client, (client) => client.projects, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "clientId" })
  client: Client;

  @Column()
  clientId: string;

  @OneToMany(() => ProjectPhase, (phase) => phase.project)
  phases: ProjectPhase[];
}