import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Files } from "./Files.js";
import { Assignments } from "./Assignments.js";


/**
 * The link between the assignment and the files
 */
@Entity("AssignmentToFiles")
export class AssignmentToFiles {
    @PrimaryGeneratedColumn("uuid")
    	AssignmentToFileId!: string;

    @ManyToOne(() => Files, (files) => files.contentToFiles)
    @JoinColumn({ name: "fileId" })
    	file!: Files;

    @ManyToOne(() => Assignments, (assignments) => assignments.assignmentToFiles)
    @JoinColumn({ name: "assignmentId" })
    	assignment!: Assignments;
}
