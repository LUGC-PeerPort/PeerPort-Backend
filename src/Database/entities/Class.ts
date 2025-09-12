import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { UsersToClasses } from "./UsersToClasses.js";

@Entity("Classes")
export class Class {
    @PrimaryGeneratedColumn("uuid")
    classId!: string;

    @Column({
        type: "text",
        nullable: false,
    })
    name!: string;

    @Column({
        type: "text",
        nullable: false,
    })
    courseCode!: string;

    @Column({
        type: "boolean",
        nullable: false,
    })
    isOpen!: boolean;

    @Column({
        type: "text",
        nullable: true,
    })
    description?: string;
    
    @Column({
        type: "date",
        nullable: false,
    })
    startDate!: string;

    @Column({
        type: "date",
        nullable: true,
    })
    endDate?: string;

    // Connections
    @OneToMany(() => UsersToClasses, (usersToClasses) => usersToClasses.classEntity)
    users!: UsersToClasses[];

}