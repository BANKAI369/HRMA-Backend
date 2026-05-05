import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { Department } from "./Department";
import { Role } from "./role";

@Entity("users")
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: "varchar" })
  password: string;

  @Column({ default: false })
  mustChangePassword: boolean;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Department, (department) => department.employees, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "department_id" })
  department: Department | null;

  @Column({ name: "department_id", type: "uuid", nullable: true })
  departmentId: string | null;

  @ManyToOne(() => Role, (role) => role.users, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "role_id" })
  role: Role | null;

  @Column({ name: "role_id", type: "uuid", nullable: true })
  roleId: string | null;
}
