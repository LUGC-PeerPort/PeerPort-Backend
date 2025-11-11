import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { UsersToCourses } from "./UsersToCourses.js";
import { Content } from "./Content.js";
import { Assignments } from "./Assignments.js";
import { Grade } from "./Grade.js";

/**
 * Used to represent a class/course the the user can be enrolled in.
 */
@Entity("Courses")
export class Course {
    @PrimaryGeneratedColumn("uuid")
        courseId!: string;

    @Column({
        type: "text",
        nullable: false,
    })
        name!: string;

    @Column({
    	type: "text",
    	nullable: false,
    })
    	courseCode!: string;

    @Column({
    	type: "boolean",
    	nullable: false,
    })
    	isOpen!: boolean;

    @Column({
    	type: "text",
    	nullable: true,
    })
    	description?: string;
    
    @Column({
    	type: "date",
    	nullable: false,
    })
    	startDate!: string;

    @Column({
    	type: "date",
    	nullable: true,
    })
    	endDate?: string;

    // Connections
    @OneToMany(() => UsersToCourses, (usersToCourses) => usersToCourses.course)
    	users!: UsersToCourses[];

    @OneToMany(() => Assignments, (assignment) => assignment.course)
    	assignments!: Assignments[];

    @OneToMany(() => Content, (content) => content.course)
        content!: Content[];

    @OneToMany(() => Grade, (grade) => grade.course)
        grades!: Grade[];

}