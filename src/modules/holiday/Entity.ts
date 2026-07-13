import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "../../entities/base.entity";

export enum HolidayType {
  PUBLIC = "PUBLIC",
  OPTIONAL = "OPTIONAL",
}

@Entity("holidays")
export class Holiday extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "date" })
  date: string;

  @Column({
    type: "enum",
    enum: HolidayType,
    default: HolidayType.PUBLIC,
  })
  type: HolidayType;

  @Column({ type: "uuid", nullable: true })
  tenantId?: string | null;

  @Column({ type: "varchar", nullable: true })
  region?: string | null;

  @Column({ default: false })
  isRecurring: boolean;
}
