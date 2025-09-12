import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Class } from "./Class.js";
import { User } from "./User.js";


/**
 *
 */
@Entity("UsersToClasses")
export class UsersToClasses {
    @PrimaryGeneratedColumn("uuid")
    	id!: string;

    @Column({
    	type: "date",
    	nullable: false,
    	default: () => "CURRENT_DATE"
    })
    	enrolledOn!: string;

    @ManyToOne(() => User, (user) => user.classes)
    @JoinColumn({ name: "userId" })
    	user!: User;

    @ManyToOne(() => Class, (classEntity) => classEntity.users)
    @JoinColumn({ name: "classId" })
    	classEntity!: Class;
}
