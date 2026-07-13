import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { Permission } from "./permission";

@Entity("modules")
export class Module extends BaseEntity {
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
}
