import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { EmployeeGroup } from "./EmployeeGroup";

@Entity("group_types")
export class GroupType {
  @PrimaryColumn({ type: "varchar" })
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => EmployeeGroup, (group) => group.groupType)
  groups: EmployeeGroup[];

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
