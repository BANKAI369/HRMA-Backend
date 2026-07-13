import {
    Column, Entity, JoinColumn, ManyToOne
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { Project } from "./Projects";

export enum TaskStatus {
    TODO = "To Do",
    IN_PROGRESS = "In Progress",
    DONE = "Done"
}

@Entity("project_tasks")
export class ProjectTask extends BaseEntity {
    @Column()
    name: string;

    @Column()
    description?: string;

    @Column({
        type: "enum",
        enum: TaskStatus,
        default: TaskStatus.TODO,
    })
    status: TaskStatus;

    @ManyToOne(() => Project)
    @JoinColumn({name: "projectId"})
    project: Project;

    @Column()
    projectId: string;
}
