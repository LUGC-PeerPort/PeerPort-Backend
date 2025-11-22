import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, BeforeRemove } from "typeorm";
import { AssignmentSubmissions } from "./AssignmentSubmissions.js";
import { Assignments } from "./Assignments.js";
import { Content } from "./Content.js";
import * as fs from "fs";


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

    @ManyToOne(() => AssignmentSubmissions, (submission) => submission.files, { onDelete: "CASCADE" })
    @JoinColumn({ name: "submissionId" })
        submission!: AssignmentSubmissions;

    @ManyToOne(() => Content, (content) => content.files, { onDelete: "CASCADE" })
    @JoinColumn({ name: "contentId" })
        content!: Content;

    @ManyToOne(() => Assignments, (assignment) => assignment.files, { onDelete: "CASCADE" })
    @JoinColumn({ name: "assignmentId" })
        assignment!: Assignments;

    /**
     * Removes the file from the filesystem when the database entry is removed
     */
    @BeforeRemove()
    async RemoveFiles(): Promise<void> {
        try {
            await fs.promises.unlink(this.location);
        } catch (err) {
            console.error(`\x1b[31m[ERROR] Removing file ${this.location} failed: ${err}\x1b[0m`);
        }
    }
}
