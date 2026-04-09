<<<<<<< Updated upstream
import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
=======
import { Column, Entity, OneToMany } from "typeorm";
>>>>>>> Stashed changes
import { BaseEntity } from "./base.entity";
import { User } from "./User";

@Entity("departments")
@Index("UQ_departments_managerId", ["manager"], { unique: true })
export class Department extends BaseEntity {

  @Column({ unique: true })
  name: string;

  // one department → many employees
  @OneToMany(() => User, (user) => user.department)
  employees: User[];
<<<<<<< Updated upstream

  // department manager
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "managerId" })
  manager: User;
}
=======
}
>>>>>>> Stashed changes
