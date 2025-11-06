import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, OneToOne, ManyToOne } from "typeorm";
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
    
    @Column({
        type: "decimal",
        nullable: false,
    })
        weight!: number;

    @ManyToOne(() => Course, (course) => course.grades)
        course!: Course;

    @ManyToOne(() => User, (user) => user.grades)
        user!: User;

    @OneToOne(() => AssignmentSubmissions, { nullable: true })
    @JoinColumn({ name: "assignmentSubmissionId" })
        assignmentSubmission?: AssignmentSubmissions | null;
}
