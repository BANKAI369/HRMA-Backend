import { Entity, Column, ManyToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Module } from "./Module";
import { Role } from "./role";
import { Module } from "./Module";

@Entity("permissions")
export class Permission extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ default: true })
  description: string;

  @ManyToOne(() => Module, (module) => module.permissions, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "module_id" })
  module: Module | null;

  @Column({ name: "module_id", type: "uuid", nullable: true })
  moduleId: string | null;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
