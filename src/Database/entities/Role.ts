import {Entity, Column, PrimaryGeneratedColumn, OneToOne} from "typeorm";
import { User } from "./User.js";


/**
 *
 */
@Entity("Roles")
export class Role {
    @PrimaryGeneratedColumn("uuid")
    	userId!: string;

    @Column({
    	type: "text",
    	nullable: false,
    })
    	name!: string;

    @OneToOne(() => User, (user) => user.role)
    	user!: User;
}