import { Entity, PrimaryGeneratedColumn, OneToMany, JoinColumn } from "typeorm";
import { Files } from "./Files.js";
import { Assignments } from "./Assignments.js";


/**
 *
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
