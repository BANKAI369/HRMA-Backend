import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("pay_cycles")
export class PayCycle extends BaseEntity {
  @Column({ type: "varchar", unique: true })
  name: string;

  @Column({ type: "varchar" })
  frequency: string;

  @Column({ type: "integer", nullable: true })
  processingDay: number | null;

  @Column({ type: "integer", nullable: true })
  payoutDay: number | null;

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}

