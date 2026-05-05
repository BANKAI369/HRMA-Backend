import{
    Column, Entity, JoinColumn, ManyToOne
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { User } from "./User";
import { Project } from "./Projects";
import { ProjectTask } from "./ProjectTask";

@Entity("timesheet_entries")
export class TimeSheetEntry extends BaseEntity {
    @ManyToOne(() => User)
    @JoinColumn({name: "userId"})
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => Project)
    @JoinColumn({name: "projectId"})
    project: Project;

    @Column()
    projectId: string;

    @ManyToOne(() => ProjectTask, {nullable: true})
    @JoinColumn({name:"taskId"})
    task?: ProjectTask;

    @Column({nullable: true})
    taskId?: string;

    @Column({type: "date"})
    date: string;

    @Column({type: "decimal", precision:5 , scale: 2})
    hours: number;

    @Column({nullable: true})
    description?: string; 
}
