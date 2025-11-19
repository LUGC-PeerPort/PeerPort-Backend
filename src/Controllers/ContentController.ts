import type { DataSource, Repository } from "typeorm";
import type { Request, Response } from "express";
import { Content } from "../Database/entities/Content.js";
import { Course } from "../Database/entities/Course.js";


export interface ContentReturn {
    contentId: string;
    courseId?: string;
    parentId?: string;
    name: string;
    description?: string;
    viewable: boolean;
    dateCreated: Date;
    dateUpdated: Date;
}


/**
 * Used to manage content.
 */
export class ContentController {
    private contentRepo: Repository<Content>;
    private courseRepo: Repository<Course>;


    /**
     * Constructor for ContentController.
     * @param dataSource - The TypeORM DataSource.
     */
    constructor(dataSource: DataSource) {
        this.contentRepo = dataSource.getRepository(Content);
        this.courseRepo = dataSource.getRepository(Course);
    }

    /**
     * Used to get all content.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getAllContent(req: Request, res: Response): Promise<void> {
        const allContent = await this.contentRepo.find({ relations: ["course"] });

        res.status(200).json(allContent.map((content) => this.contentReturn(content)));
    }

    /**
     * Used to get content by ID.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getContentById(req: Request, res: Response): Promise<void> {
        // Check the content ID
        const contentIdUnknown = req.params?.contentId as unknown;
        if (!this.checkUUID(contentIdUnknown)) {
            res.status(400).json({ message: "Invalid content ID" });
            return;
        }

        const contentId = contentIdUnknown as string;
        const content = await this.contentRepo.findOne({ where: { contentId: contentId }, relations: ["course"] });
        if (!content) {
            res.status(404).json({ message: "Content not found" });
            return;
        }

        // Return the content
        res.status(200).json(this.contentReturn(content));
    }

    /**
     * Used to create content.
     * @param req - The request object.
     * @param res - The response object.
     */
    async createContent(req: Request, res: Response): Promise<void> {
        // Check the course ID
        const courseIdUnknown = req.params?.courseId as unknown;
        if (!this.checkUUID(courseIdUnknown)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }
        
        // Check if the course exists
        const courseId = courseIdUnknown as string;
        const course = await this.courseRepo.findOne({ where: { courseId: courseId } });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Check course structure
        const unknownContent = req.body as unknown;
        if (!this.checkContentStructure(unknownContent, false)) {
            res.status(400).json({ message: "Invalid content structure" });
            return;
        }

        const contentData = unknownContent as Content;

        // Create the content
        const content = this.contentRepo.create({
            name: contentData.name,
            description: contentData.description,
            viewable: contentData.viewable,
            course: course
        });
        await this.contentRepo.save(content);

        // Return the created content
        res.status(201).json(this.contentReturn(content));
    }

    /**
     * Used to create sub-content.
     * @param req - The request object.
     * @param res - The response object.
    */
    async createSubContent(req: Request, res: Response): Promise<void> {
        // Check the parent content ID
        const parentIdUnknown = req.params?.parentId as unknown;
        if (!this.checkUUID(parentIdUnknown)) {
            res.status(400).json({ message: "Invalid content ID" });
            return;
        }

        const parentId = parentIdUnknown as string;
        const parent = await this.contentRepo.findOne({ where: { contentId: parentId } });
        if (!parent) {
            res.status(404).json({ message: "Content not found" });
            return;
        }

        const course = parent.course;

        // Check the structure
        const unknownContent = req.body as unknown;
        if (!this.checkContentStructure(unknownContent, false)) {
            res.status(400).json({ message: "Invalid content structure" });
            return;
        }

        const contentData = unknownContent as Content;

        // Create the sub-content
        const subContent = this.contentRepo.create({
            name: contentData.name,
            description: contentData.description,
            viewable: contentData.viewable,
            parent: parent,
            course: course
        });
        await this.contentRepo.save(subContent);

        // Return the created sub-content
        res.status(201).json(this.contentReturn(subContent));
    }

    /**
     * Used to update content by ID.
     * @param req - The request object.
     * @param res - The response object.
     */
    async updateContent(req: Request, res: Response): Promise<void> {
        // Check the content ID
        const contentIdUnknown = req.params?.contentId as unknown;
        if (!this.checkUUID(contentIdUnknown)) {
            res.status(400).json({ message: "Invalid content ID" });
            return;
        }

        const contentId = contentIdUnknown as string;
        const content = await this.contentRepo.findOne({ where: { contentId: contentId }, relations: ["course"] });
        if (!content) {
            res.status(404).json({ message: "Content not found" });
            return;
        }

        // Check the structure
        const unknownContent = req.body as unknown;
        if (!this.checkContentStructure(unknownContent, true)) {
            res.status(400).json({ message: "Invalid content structure" });
            return;
        }
        const contentData = unknownContent as Partial<Content>;

        // Update the content
        content.name = contentData.name ?? content.name;
        content.description = contentData.description ?? content.description;
        content.parent = contentData.parent ?? content.parent;
        await this.contentRepo.save(content);

        // Return the updated content
        res.status(200).json(this.contentReturn(content));
    }

    /**
     * Used to delete content by ID.
     * @param req - The request object
     * @param res - The response object
     */
    async deleteContent(req: Request, res: Response): Promise<void> {
        // Check the content ID
        const contentIdUnknown = req.params?.contentId as unknown;
        if (!this.checkUUID(contentIdUnknown)) {
            res.status(400).json({ message: "Invalid content ID" });
            return;
        }
        
        const contentId = contentIdUnknown as string;
        const content = await this.contentRepo.findOne({ where: { contentId: contentId } });
        if (!content) {
            res.status(404).json({ message: "Content not found" });
            return;
        }

        // Delete the content
        await this.contentRepo.remove(content);

        // Return success
        res.status(200).json({ message: "Content deleted" });
    }


    // ---- TOOLS ----

    /**
     * Formats content for return
     * @param content - The content to format
     * @returns The formatted content
     */
    private contentReturn(content: Content): ContentReturn {
        return {
            contentId: content.contentId,
            courseId: content.course?.courseId,
            parentId: content.parent?.contentId,
            name: content.name,
            description: content.description,
            viewable: content.viewable,
            dateCreated: content.dateCreated,
            dateUpdated: content.dateUpdated,
        };
    }

    /**
     * Checks if the UUID is valid
     * @param id - The  UUID
     * @returns The UUID if valid, undefined otherwise
     */
    private checkUUID(id: unknown): string | void {
        if (typeof id !== "string") return;

        // Trim the string
        const userID = id.trim();

        // Check if the ID has content
        if (userID === "") return;
        
        // Check if the ID is a valid UUID
        if (!RegExp(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).test(userID)) return;
        
        // Return the ID
        return userID;
    }

    /**
     * Check if the content structure is valid
     * @param content - The content to check
     * @param _updating - Whether we are updating or creating
     * @returns Whether the structure is valid or not
     */
    private checkContentStructure(content: unknown, _updating: boolean): boolean {
        if (typeof content !== "object" || content === null) return false;

        // Check if the content has extra keys
        const contentKeys = ["name", "description", "viewable"];
        for (const key of Object.keys(content)) {
            if (!contentKeys.includes(key)) return false;
        }

        // Make a Content that is partial 
        const contentTyped = content as Partial<Content>;

        // -- Required --
        if (typeof contentTyped.name === "string") {
            if (contentTyped.name.trim() === "") return false;
        } else if (typeof contentTyped.name !== "undefined" && _updating) return false;
        else if (!_updating) return false;

        if (typeof contentTyped.viewable !== "boolean") {
            if (typeof contentTyped.viewable !== "undefined" && _updating) return false;
            else if (!_updating) return false;
        };

        // -- Optional --
        if (typeof contentTyped.description === "string") {
            if (contentTyped.description.trim() === "") return false;
        } else if (typeof contentTyped.description !== "undefined" && _updating) return false;

        // All checks passed
        return true;
    }
}