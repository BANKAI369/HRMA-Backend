import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("leave_policies")
export class LeavePolicy extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  tenantId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column()
  createdBy!: string;
}