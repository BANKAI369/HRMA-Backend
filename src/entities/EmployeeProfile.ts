import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { EmployeeGroup } from "./EmployeeGroup";
import { JobTitle } from "./JobTitle";
import { Location } from "./Location";
import { NoticePeriod } from "./NoticePeriod";
import { User } from "./User";

@Entity("employee_profiles")
export class EmployeeProfile extends BaseEntity {
  @OneToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id", type: "uuid", unique: true })
  userId: string;

  @Column({ type: "varchar", nullable: true })
  firstName: string | null;

  @Column({ type: "varchar", nullable: true })
  lastName: string | null;

  @Column({ type: "varchar", nullable: true })
  phone: string | null;

  @Column({ type: "date", nullable: true })
  dateOfBirth: string | null;

  @Column({ type: "varchar", nullable: true })
  gender: string | null;

  @Column({ type: "varchar", nullable: true, unique: true })
  employeeCode: string | null;

  @Column({ type: "date", nullable: true })
  dateOfJoining: string | null;

  @ManyToOne(() => Location, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "location_id" })
  location: Location | null;

  @Column({ name: "location_id", type: "varchar", nullable: true })
  locationId: string | null;

  @ManyToOne(() => JobTitle, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "job_title_id" })
  jobTitle: JobTitle | null;

  @Column({ name: "job_title_id", type: "varchar", nullable: true })
  jobTitleId: string | null;

  @ManyToOne(() => NoticePeriod, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "noticePeriodId" })
  noticePeriod: NoticePeriod | null;

  @Column({ type: "varchar", nullable: true })
  noticePeriodId: string | null;

  @ManyToOne(() => EmployeeGroup, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "groupId" })
  group: EmployeeGroup | null;

  @Column({ type: "varchar", nullable: true })
  groupId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "managerUserId" })
  manager: User | null;

  @Column({ type: "uuid", nullable: true })
  managerUserId: string | null;
}
