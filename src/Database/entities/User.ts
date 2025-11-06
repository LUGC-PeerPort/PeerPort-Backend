import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Role } from "./Role.js";
import { UsersToCourses } from "./UsersToCourses.js";
import { Grade } from "./Grade.js";
import { AssignmentSubmissions } from "./AssignmentSubmissions.js";

/**
 * The users details
 */
@Entity("Users")
export class User {
    @PrimaryGeneratedColumn("uuid")
        userId!: string;

    @Column({
        type: "text",
        nullable: false,
    })
        name!: string;

    @Column({
        type: "text",
        nullable: false,
    })
        email!: string;

    @Column({
        type: "text",
        nullable: true,
    })
        profilePictureUrl?: string;

    @Column({
        type: "text",
        nullable: false,
    })
        idNumber!: string;

    // Connections
    @OneToMany(() => Role, (role) => role.user)
        role!: Role;

    @OneToMany(() => UsersToCourses, (usersToCourses) => usersToCourses.user)
        courses?: UsersToCourses[];

	@OneToMany(() => AssignmentSubmissions, (assignmentSubmission) => assignmentSubmission.user)
	    assignmentSubmissions?: AssignmentSubmissions[];

	@OneToMany(() => Grade, (grade) => grade.user)
	    grades?: Grade[];
}