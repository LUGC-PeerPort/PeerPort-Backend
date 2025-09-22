import { Entity, PrimaryGeneratedColumn, OneToMany, JoinColumn } from "typeorm";
import { Files } from "./Files.js";
import { Assignments } from "./Assignments.js";


/**
 * The link between the assingment and the files
 */
@Entity("AssignmentToFiles")
export class AssignmentToFiles {
    @PrimaryGeneratedColumn("uuid")
    	AssignmentToFileId!: string;

    @OneToMany(() => Files, (files) => files.filesId)
    @JoinColumn({ name: "fileId" })
    	files!: Files[];

    @OneToMany(() => Assignments, (assignments) => assignments.assignmentId)
    @JoinColumn({ name: "assignmentId" })
    	assignments!: Assignments[];
}
