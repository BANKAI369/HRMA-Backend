import { Entity, Column, ManyToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Module } from "./Module";
import { Role } from "./role";

@Entity("permissions")
export class Permission extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ default: true })
  description: string;

  @Column({ type: "uuid", name: "module_id", nullable: true })
  moduleId: string | null;

  @ManyToOne(() => Module, (module) => module.permissions, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "module_id" })
  module: Module | null;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}