import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity("audit_logs")
@Index("IDX_audit_logs_actor_user_id", ["actorUserId"])
@Index("IDX_audit_logs_entity_type_entity_id", ["entityType", "entityId"])
@Index("IDX_audit_logs_created_at", ["createdAt"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "actor_user_id" })
  actorUser: User | null;

  @Column({ name: "actor_user_id", type: "uuid", nullable: true })
  actorUserId: string | null;

  @Column({ name: "action", type: "varchar" })
  action: string;

  @Column({ name: "entity_type", type: "varchar" })
  entityType: string;

  @Column({ name: "entity_id", type: "varchar" })
  entityId: string;

  @Column({ name: "old_value", type: "jsonb", nullable: true })
  oldValue: Record<string, unknown> | null;

  @Column({ name: "new_value", type: "jsonb", nullable: true })
  newValue: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt: Date;
}
