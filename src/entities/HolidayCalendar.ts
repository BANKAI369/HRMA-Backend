import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { Location } from "./Location";

@Entity("holiday_calendars")
export class HolidayCalendar {
  @PrimaryColumn({ type: "varchar" })
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: "int" })
  year: number;

  @ManyToOne(() => Location, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "location_id" })
  location: Location | null;

  @Column({ name: "location_id", type: "varchar", nullable: true })
  locationId: string | null;

  @Column({ type: "jsonb", default: () => "'[]'" })
  holidays: Array<{
    name: string;
    date: string;
    isOptional?: boolean;
  }>;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
