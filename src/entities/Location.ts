import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("locations")
export class Location {
  @PrimaryColumn({ type: "varchar" })
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  countryCode: string;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
