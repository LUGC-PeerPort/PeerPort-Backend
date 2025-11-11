import {Entity, Column, PrimaryGeneratedColumn, OneToMany} from "typeorm";
import { User } from "./User.js";


/**
 * Used to keep track of diffrent roles for the users
 */
@Entity("Roles")
export class Role {
    @PrimaryGeneratedColumn("uuid")
    	roleId!: string;

    @Column({
    	type: "text",
    	nullable: false,
    })
    	name!: string;

    @OneToMany(() => User, (user) => user.role)
    	users!: User[];
}