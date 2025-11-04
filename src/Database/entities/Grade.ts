import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, OneToOne } from "typeorm";
import { Course } from "./Course.js";
import { AssignmentSubmissions } from "./AssignmentSubmissions.js";
import { User } from "./User.js";

/**
 * Keeps track of the grades for the user
 */
@Entity("Grades")
export class Grade {
    @PrimaryGeneratedColumn("uuid")
        gradeId!: string;

    @Column({
        type: "decimal",
        nullable: false,
    })
        maxScore!: number;

    @Column({
        type: "decimal",
        nullable: false,
    })
        minScore!: number;

    @Column({
        type: "decimal",
        nullable: false,
    })
        achievedScore!: number;

    @OneToOne(() => Course)
    @JoinColumn()
        course!: Course;

    @OneToOne(() => User)
    @JoinColumn()
        user!: User;

    @OneToOne(() => AssignmentSubmissions)
    @JoinColumn()
        assignmentSubmission!: AssignmentSubmissions;
}
