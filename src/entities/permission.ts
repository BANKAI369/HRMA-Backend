import { Entity, Column, ManyToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Role } from "./role";

@Entity("permissions")
export class Permission extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ default: true })
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}