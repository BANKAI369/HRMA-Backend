import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { GroupType } from "./GroupType";

@Entity("groups")
export class EmployeeGroup {
  @PrimaryColumn({ type: "varchar" })
  id: string;

  @Column({ unique: true })
  name: string;

  @ManyToOne(() => GroupType, (groupType) => groupType.groups, {
    nullable: false,
  })
  @JoinColumn({ name: "groupTypeId" })
  groupType: GroupType;

  @Column({ type: "varchar" })
  groupTypeId: string;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
