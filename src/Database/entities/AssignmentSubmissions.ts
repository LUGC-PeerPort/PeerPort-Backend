import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToOne, CreateDateColumn } from "typeorm";
import { Assignments } from "./Assignments.js";
import { User } from "./User.js";
import { Files } from "./Files.js";


/**
 * The submission to an assignment made by a user
 */
@Entity("AssignmentSubmissions")
export class AssignmentSubmissions {
    @PrimaryGeneratedColumn("uuid")
    	assignmentSubmissionId!: string;

    @Column({
    	type: "text",
    	nullable: true,
    })
    	comment!: string;

    @CreateDateColumn()
    	timeSubmitted!: Date;
        
    @ManyToOne(() => User, (user) => user.courses)
    	user!: User;

    @ManyToOne(() => Assignments, (assignment) => assignment.assignmentSubmissions)
    @JoinColumn({ name: "assignmentId" })
    	assignment!: Assignments;

    @OneToMany(() => Files, (files) => files.submission)
        files!: Files[];
}
