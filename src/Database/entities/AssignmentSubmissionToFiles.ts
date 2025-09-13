import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Class } from "./Class.js";
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

    @ManyToOne(() => User, (user) => user.classes)
    @JoinColumn({ name: "userId" })
    	user!: User;

    @ManyToOne(() => Class, (classEntity) => classEntity.users)
    @JoinColumn({ name: "classId" })
    	classEntity!: Class;
}
