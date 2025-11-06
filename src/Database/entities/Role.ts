import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from "typeorm";
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

    @ManyToOne(() => User, (user) => user.role)
    	user!: User;
}