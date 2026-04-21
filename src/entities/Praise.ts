import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { User } from "./User";
import { Badge } from "./Badge";

@Entity("praises")
export class Praise extends BaseEntity {
  @Column({ type: "text" })
  message: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "fromUserId" })
  fromUser: User;

  @Column()
  fromUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "toUserId" })
  toUser: User;

  @Column()
  toUserId: string;

  @ManyToOne(() => Badge)
  @JoinColumn({ name: "badgeId" })
  badge: Badge;

  @Column({ nullable: true })
  badgeId?: string;
}