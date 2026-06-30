import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { User } from "./User";
import { Project } from "./Projects";

@Entity("project_allocations")
export class ProjectAllocations extends BaseEntity {
    @ManyToOne(()=>User)
    @JoinColumn({name: "userId"})
    user: User;

    @Column()
    userId:string;

    @ManyToOne(() => Project)
    @JoinColumn({name: "projectId"})
    project: Project;

    @Column()
    projectId: string;

    @Column({type:"int", default:100})
    allocationPercentage: number;

    @Column({type: "date", nullable: true})
    startDate?: string;

    @Column({type: "date", nullable: true})
    endDate?: string;
}
