import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { User } from "./User";

@Entity("posts")
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;
  @Column({ type: "uuid" })
  authorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "authorId" })
  author!: User;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid", nullable: true })
  departmentId?: string | null;

  @Column({ type: "varchar", default: "organization" })
  scope!: string;

  @Column("text")
  content!: string;

  @Column({ type: "varchar", default: "TEAM" })
  visibility!: string;

  @Column({ type: "varchar", default: "POST" })
  type!: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: any;

  @Column({ type: "jsonb", default: [] })
  likes!: string[]; // Array of User IDs

  @Column({ type: "jsonb", default: [] })
  comments!: any[]; // Array of { userId, username, content, createdAt }
}