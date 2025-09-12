import { Entity, Column, PrimaryGeneratedColumn, OneToOne, ManyToMany, JoinColumn, OneToMany } from "typeorm";
import { Role } from "./Role.js";
import { UsersToClasses } from "./UsersToClasses.js";

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
        nullable: false,
    })
    password!: string;

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
    @JoinColumn()
    role!: Role;

    @OneToMany(() => UsersToClasses, (usersToClasses) => usersToClasses.user)
    classes!: UsersToClasses[];
}