import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn, OneToOne } from "typeorm";
import { ContentToFiles } from "./ContentToFiles.js";
import { Course } from "./Course.js";

/**
 * The content that is in a course
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

	@OneToOne(() => Course, (course) => course.courseId)
	@JoinColumn({ name: "courseId" })
	    parent?: Course;
}
