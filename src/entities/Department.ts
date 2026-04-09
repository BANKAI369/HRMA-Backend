import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { User } from "./User";

@Entity("departments")
export class Department extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @OneToMany(() => User, (user) => user.department)
  employees: User[];

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: "managerId" })
  manager: User | null;

  @Column({ type: "varchar", nullable: true })
  managerId: string | null;
}
