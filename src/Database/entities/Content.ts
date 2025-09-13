import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne, JoinColumn } from "typeorm";
import { ContentToFiles } from "./ContentToFiles.js";

/**
 *
 */
@Entity("Content")
export class Content {
    @PrimaryGeneratedColumn("uuid")
    	contentId!: string;

    @Column({
    	type: "text",
    	nullable: false,
    })
    	name!: string;
    @Column({
    	type: "text",
    	nullable: false,
    })
    	Description!: string;
    @Column({
    	type: "date",
    	nullable: false,
        default: () => "CURRENT_DATE"
    })
    	DateCreated!: Date;
    
    @Column({
    	type: "boolean",
    	nullable: false,
    })
    	viewable!: boolean;
    @OneToMany(() => ContentToFiles, (contentToFiles) => contentToFiles.contentToFilesId)
    @JoinColumn({ name: "contentToFilesId" })
    	contentToFiles!: ContentToFiles;
    //FK Parent: nullable (not included yet)
}
