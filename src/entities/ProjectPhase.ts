import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Project } from "./Projects";

@Entity("project_phases")
export class ProjectPhase extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "int", default: 1 })
  phaseOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Project, (project) => project.phases, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "projectId" })
  project: Project;

  @Column()
  projectId: string;
}
