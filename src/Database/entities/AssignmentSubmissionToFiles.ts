import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Course } from "./Course.js";
import { User } from "./User.js";


/**
 *
 */
@Entity("AssignmentSubmissionToFiles")
export class AssignmentSubmissionToFiles {
    @PrimaryGeneratedColumn("uuid")
    	assignmentSubmissionToFilesId!: string;

    @Column({
    	type: "date",
    	nullable: false,
    	default: () => "CURRENT_DATE"
    })
    	enrolledOn!: string;

    @ManyToOne(() => User, (user) => user.courses)
    @JoinColumn({ name: "userId" })
    	user!: User;

    @ManyToOne(() => Course, (course) => course.users)
    @JoinColumn({ name: "classId" })
    	classEntity!: Course;
}
