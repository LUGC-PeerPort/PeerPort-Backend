import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { AssignmentSubmissions } from "./AssignmentSubmissions.js";
import { Assignments } from "./Assignments.js";
import { Content } from "./Content.js";


/**
 * Used to manage files that are uploaded
 */
@Entity("Files")
export class Files {
    @PrimaryGeneratedColumn("uuid")
        fileId!: string;

    @Column({
        type: "text",
        nullable: false,
    })
        fileName!: string;
    @Column({
        type: "text",
        nullable: false,
    })
    	location!: string;

    @CreateDateColumn()
        uploadedOn!: string;

    @ManyToOne(() => AssignmentSubmissions, (submission) => submission.files)
    @JoinColumn({ name: "submissionId" })
        submission!: AssignmentSubmissions;

    @ManyToOne(() => Content, (content) => content.files)
    @JoinColumn({ name: "contentId" })
        content!: Content;

    @ManyToOne(() => Assignments, (assignment) => assignment.files)
    @JoinColumn({ name: "assignmentId" })
        assignment!: Assignments;
}
