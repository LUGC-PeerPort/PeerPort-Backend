import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Files } from "./Files.js";
import { Content } from "./Content.js";


/**
 * The link between the content and the files
 */
@Entity("ContentToFiles")
export class ContentToFiles {
    @PrimaryGeneratedColumn("uuid")
        contentToFilesId!: string;

    @ManyToOne(() => Files, (files) => files.contentToFiles)
    @JoinColumn({ name: "fileId" })
        filesId!: Files;

    @ManyToOne(() => Content, (content) => content.contentToFiles)
    @JoinColumn({ name: "contentId" })
        contentId!: Content;
}
