import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

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
    @OneToOne(() => Role)
    @JoinColumn()
    role!: Role;

}