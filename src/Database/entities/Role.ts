import {Entity, Column, PrimaryGeneratedColumn, OneToOne} from "typeorm";
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

    @OneToOne(() => User, (user) => user.role)
    	user!: User;
}