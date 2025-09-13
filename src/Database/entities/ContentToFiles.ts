import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn } from "typeorm";
import { Files } from "./Files.js";
import { Content } from "./Content.js";


/**
 *
 */
@Entity("ContentToFiles")
export class ContentToFiles {
    @PrimaryGeneratedColumn("uuid")
    	contentToFilesId!: string;
    @OneToMany(() => Files, (files) => files.filesId)
    @JoinColumn({ name: "FilesId" })
    	filesId!: Files;

    @OneToMany(() => Content, (content) => content.contentId)
    @JoinColumn({ name: "ContentId" })
    	contentId!: Content;
}
