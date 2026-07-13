import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { Department } from "./Department";
import { Tenant } from "./Tenant";

@Entity("organizations")
@Unique(["tenantId", "code"])
@Unique(["tenantId", "name"])
export class Organization extends BaseEntity {
  @Column({ type: "uuid", name: "tenant_id" })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.organizations, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ name: "code", length: 60 })
  code: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Department, (department) => department.organization)
  departments: Department[];
}
