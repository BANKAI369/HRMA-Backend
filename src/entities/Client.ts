import { Column, Entity, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Project } from "./Projects";

@Entity("clients")
export class Client extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  contactPerson?: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Project, (project) => project.client)
  projects: Project[];
}
