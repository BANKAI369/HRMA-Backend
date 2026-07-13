import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("salary_components")
export class SalaryComponent extends BaseEntity {
  @Column({ type: "varchar", unique: true })
  code: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar" })
  type: string;

  @Column({ type: "varchar", default: "FIXED" })
  calculationType: string;

  @Column({ type: "boolean", default: false })
  isTaxable: boolean;

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}

