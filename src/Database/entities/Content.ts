import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn, OneToOne, ManyToOne } from "typeorm";
import { Files } from "./Files.js";
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
    	nullable: true,
    })
    	description!: string;

    @Column({
    	type: "date",
    	nullable: false,
        default: () => "CURRENT_DATE"
    })
    	dateCreated!: Date;
    
    @Column({
    	type: "boolean",
    	nullable: false,
    })
    	viewable!: boolean;
	
    @OneToMany(() => Files, (files) => files.content)
    	files!: Files[];

	@OneToOne(() => Content, (content) => content.contentId)
	    parent?: Content;

	@ManyToOne(() => Course, (course) => course.content)
	@JoinColumn({ name: "courseId" })
	    course?: Course;
}
