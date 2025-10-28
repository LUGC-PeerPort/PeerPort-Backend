import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { AssignmentSubmissions } from "./AssignmentSubmissions.js";
import { Assignments } from "./Assignments.js";
import { Content } from "./Content.js";


/**
 *
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
    	location!: string; //check if this is correct type

    @Column({
        type: "date",
        nullable: false,
        default: () => "CURRENT_DATE"
    })
        uploadedOn!: string;

    @ManyToOne(() => AssignmentSubmissions, (submission) => submission.files)
        submission!: AssignmentSubmissions;

    @ManyToOne(() => Content, (content) => content.files)
        content!: Content;

    @ManyToOne(() => Assignments, (assignment) => assignment.files)
        assignment!: Assignments;
}
