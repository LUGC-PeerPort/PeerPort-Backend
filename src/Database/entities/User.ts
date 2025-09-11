import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity("Users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

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

}