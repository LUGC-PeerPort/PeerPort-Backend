import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
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
    	type: "boolean",
    	nullable: false,
    })
    	viewable!: boolean;
	
	@CreateDateColumn()
    	dateCreated!: Date;

	@UpdateDateColumn()
    	dateUpdated!: Date;

    @OneToMany(() => Files, (files) => files.content)
    	files!: Files[];

	@ManyToOne(() => Content, (content) => content.contentId)
	@JoinColumn({ name: "parentId" })
	    parent?: Content;

	@ManyToOne(() => Course, (course) => course.content)
	@JoinColumn({ name: "courseId" })
	    course?: Course;
}
