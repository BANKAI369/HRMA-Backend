import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("badges")
export class Badge extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ nullable: true })
  description?: string;
}
