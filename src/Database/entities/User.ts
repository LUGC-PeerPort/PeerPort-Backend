import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany } from "typeorm";
import { Role } from "./Role.js";
import { UsersToCourses } from "./UsersToCourses.js";

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
    @OneToOne(() => Role, (role) => role.user)
    @JoinColumn({ name: "roleId" })
    	role!: Role;

    @OneToMany(() => UsersToCourses, (usersToCourses) => usersToCourses.user)
    	courses?: UsersToCourses[];
}