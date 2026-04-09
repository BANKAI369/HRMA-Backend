import { Column, Entity, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { User } from "./User";

@Entity("departments")
export class Department extends BaseEntity {

  @Column({ unique: true })
  name: string;

  // one department → many employees
  @OneToMany(() => User, (user) => user.department)
  employees: User[];
}
