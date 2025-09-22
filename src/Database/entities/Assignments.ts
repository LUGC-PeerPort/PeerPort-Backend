import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, ManyToMany } from "typeorm";
import { Course } from "./Course.js";
import { AssignmentToFiles } from "./AssignmentToFiles.js";
import { AssignmentSubmissions } from "./AssignmentSubmissions.js";


/**
 *
 */
@Entity("Assignments")
export class Assignments {
    @PrimaryGeneratedColumn("uuid")
    	assignmentId!: string;
    @Column({
    	type: "text",
    	nullable: false,
    })
    	name!: string;
    @Column({
    	type: "text",
    	nullable: false,
    })
    	description!: string;
    @Column({
    	type: "text",
    	nullable: false,
    })
    	dueDate!: string;

    @ManyToMany(() => AssignmentToFiles, (assignmentToFile) => assignmentToFile.AssignmentToFileId)
    @JoinColumn({ name: "AssignmentToFileId" })
    	assignmentToFile!: AssignmentToFiles;

    @ManyToOne(() => Course, (course) => course.assignments)
    @JoinColumn({ name: "classId" })
    	classEntity!: Course;

    @ManyToOne(() => AssignmentSubmissions, (assignmentSubmissions) => assignmentSubmissions.user)
    @JoinColumn({ name: "assignmentSubmissionsId" })
    	assignmentSubmissions!: AssignmentSubmissions;
}
