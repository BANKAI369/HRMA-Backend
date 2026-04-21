import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { TimeFrame } from "./TimeFrame";
import { User } from "./User";

@Entity("goals")
export class Goal extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "int", default: 0 })
  progress: number;

  @ManyToOne(() => TimeFrame)
  @JoinColumn({ name: "timeFrameId" })
  timeFrame: TimeFrame;

  @Column()
  timeFrameId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;
}
