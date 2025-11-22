import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, OneToOne, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
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
        nullable: true,
    })
        achievedScore!: number;
    
    @Column({
        type: "decimal",
        nullable: false,
    })
        weight!: number;

    @CreateDateColumn()
        dateGraded!: Date;

    @UpdateDateColumn()
        dateUpdated!: Date;

    @ManyToOne(() => Course, (course) => course.grades, { onDelete: "CASCADE" })
        course!: Course;

    @ManyToOne(() => User, (user) => user.grades, { onDelete: "CASCADE" })
        user!: User;

    @OneToOne(() => AssignmentSubmissions, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "assignmentSubmissionId" })
        assignmentSubmission?: AssignmentSubmissions | null;
}
