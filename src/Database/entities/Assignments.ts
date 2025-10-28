import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Course } from "./Course.js";
import { AssignmentSubmissions } from "./AssignmentSubmissions.js";
import { Files } from "./Files.js";


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

	@OneToMany(() => Files, (files) => files.fileId)
	@JoinColumn({ name: "files" })
    	files!: Files[];

    @ManyToOne(() => Course, (course) => course.assignments)
    @JoinColumn({ name: "courseId" })
    	course!: Course;

    @ManyToOne(() => AssignmentSubmissions, (assignmentSubmissions) => assignmentSubmissions.user)
    @JoinColumn({ name: "assignmentSubmissionsId" })
    	assignmentSubmissions!: AssignmentSubmissions;
}
