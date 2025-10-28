import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn, ManyToOne } from "typeorm";
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

    /*
    //To be done when grading is implemented
    @Column({
    	type: "number",
    	nullable: false,
    })
    	gradeId!: GradeId;
        */
    @Column({
    	type: "text",
    	nullable: true,
    })
    	comment!: string;
    @Column({
    	type: "text",
    	nullable: false,
    })
    	timeSubmitted!: string;
        
        
    @OneToOne(() => User, (user) => user.courses)
    @JoinColumn({ name: "userId" })
    	user!: User;

    @ManyToOne(() => Assignments, (assignment) => assignment.assignmentSubmissions)
    @JoinColumn({ name: "assignmentId" })
    	assignment!: Assignments;

    @OneToMany(() => Files, (files) => files.submission)
        files!: Files[];
}
