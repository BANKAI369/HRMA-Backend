import { Column,Entity } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("time_frames")
export class TimeFrame extends BaseEntity {
    @Column()
    name: string;
    
    @Column({ type: "date" })
    startDate: string;

    @Column({ type: "date" })
    endDate: string;

    @Column({ default: true })
    isActive: boolean;
}