import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { ContentToFiles}from "./ContentToFiles.js";
import { AssignmentToFiles } from "./AssignmentToFiles.js";
import { AssignmentSubmissionToFiles } from "./AssignmentSubmissionToFiles.js";


/**
 *
 */
@Entity("Files")
export class Files {
    @PrimaryGeneratedColumn("uuid")
    	filesId!: string;

    @Column({
    	type: "text",
    	nullable: false,
    })
    	FileName!: string;
    @Column({
    	type: "text",
    	nullable: false,
    })
    	Location!: string; //check if this is correct type


    @OneToMany(() => ContentToFiles, (contentToFiles) => contentToFiles.contentToFilesId)
    @JoinColumn({ name: "contentId" })
    	contentToFiles!: ContentToFiles;

    @ManyToOne(() => AssignmentToFiles, (assignmentToFiles) => assignmentToFiles.files)
    @JoinColumn({ name: "assignmentId" })
    	assignmentToFiles!: AssignmentToFiles;
    @ManyToOne(() => AssignmentSubmissionToFiles, (assignmentSubmissionToFiles) => assignmentSubmissionToFiles.assignmentSubmissionToFilesId)
    @JoinColumn({ name: "assignmentSubmissionId" })
        assignmentSubmissionToFiles!: AssignmentSubmissionToFiles;
}
