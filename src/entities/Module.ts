import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Permission } from "./permission";

@Entity("modules")
export class Module {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    unique: true,
    length: 50,
  })
  code!: string;

  @Column({
    length: 100,
  })
  name!: string;

  @Column({
    type: "text",
    nullable: true,
  })
  description?: string;

  @OneToMany(() => Permission, (permission) => permission.module)
  permissions?: Permission[];

  @Column({
    default: true,
  })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
