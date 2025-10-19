import {Entity, Column} from "typeorm";

@Entity("FederatedCredentials")
export class FederatedCredentials {
    @Column({
    	type: "text",
    	nullable: false,
    	primary: true,
    })
    	provider!: string;

    @Column({
    	type: "text",
    	nullable: false,
    	primary: true,
    })
    	providerId!: string;

    @Column({
    	type: "text",
    	nullable: false,
    })
    	userId!: string;
}