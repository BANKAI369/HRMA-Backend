import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";

@Entity("leave_policy_rules")
export class LeavePolicyRule {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  policyId!: string;

  @Column()
  leaveTypeId!: string;

  @Column("decimal", {
    precision: 5,
    scale: 2,
  })
  annualQuota!: number;

  @Column({ default: false })
  accrualEnabled!: boolean;

  @Column({ nullable: true })
  accrualFrequency!: string;

  @Column({ default: false })
  carryForwardEnabled!: boolean;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0,
  })
  carryForwardLimit!: number;

  @Column({ default: false })
  encashmentAllowed!: boolean;

  @Column({ default: false })
  negativeBalanceAllowed!: boolean;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  maxConsecutiveDays!: number;
}