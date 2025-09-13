import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn } from "typeorm";
import { Files } from "./Files.js";
import { Assignments } from "./Assignments.js";


/**
 *
 */
@Entity("AssignmentToFiles")
export class AssignmentToFiles {
    @PrimaryGeneratedColumn("uuid")
    	AssignmentToFileId!: string;

    // @Column({
    // 	type: "date",
    // 	nullable: false,
    // 	default: () => "CURRENT_DATE"
    // })
    // 	enrolledOn!: string;

    @OneToMany(() => Files, (files) => files.filesId)
    @JoinColumn({ name: "fileId" })
    	files!: Files[];

    @OneToMany(() => Assignments, (assignments) => assignments.assignmentId)
    @JoinColumn({ name: "assignmentId" })
    	assignments!: Assignments[];
}
