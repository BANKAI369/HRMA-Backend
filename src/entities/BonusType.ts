import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("bonus_types")
export class BonusType extends BaseEntity {
  @Column({ type: "varchar", unique: true })
  name: string;

  @Column({ type: "varchar", nullable: true })
  description: string | null;

  @Column({ type: "varchar", default: "FIXED" })
  payoutMode: string;

  @Column({ type: "boolean", default: false })
  isRecurring: boolean;

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}

