import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { ContentToFiles}from "./ContentToFiles.js";
import { AssignmentToFiles } from "./AssignmentToFiles.js";


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

    @OneToMany(() => ContentToFiles, (contentToFiles) => contentToFiles.filesId)
        contentToFiles!: ContentToFiles[];

    @ManyToOne(() => AssignmentToFiles, (assignmentToFiles) => assignmentToFiles.file)
    @JoinColumn({ name: "assignmentId" })
        assignmentToFiles!: AssignmentToFiles;
}
