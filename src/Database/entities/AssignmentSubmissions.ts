import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from "typeorm";
import { AssignmentSubmissionToFiles } from "./AssignmentSubmissionToFiles.js";
import { Assignments } from "./Assignments.js";
import { User } from "./User.js";


/**
 *
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

    @OneToOne(() => Assignments, (assignments) => assignments.assignmentId)
    @JoinColumn({ name: "assignmentId" })
    	assignments!: Assignments;

    @OneToOne(() => AssignmentSubmissionToFiles, (assignmentSubmissionToFiles) => assignmentSubmissionToFiles.assignmentSubmissionToFilesId)
    @JoinColumn({ name: "assignmentSubmissionToFilesId" })
        assignmentSubmissionToFiles!: AssignmentSubmissionToFiles;

}
