import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Organization } from "./Organization";
import { User } from "./User";

@Entity("departments")
export class Department extends BaseEntity {

  @Column({ unique: true })
  name: string;

  @Column({ type: "uuid", name: "organization_id", nullable: true })
  organizationId: string | null;

  @ManyToOne(() => Organization, (organization) => organization.departments, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "organization_id" })
  organization: Organization | null;

  // one department → many employees
  @OneToMany(() => User, (user) => user.department)
  employees: User[];
}
