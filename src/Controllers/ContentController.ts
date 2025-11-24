import type { DataSource, Repository } from "typeorm";
import type { Request, Response } from "express";
import { Content } from "../Database/entities/Content.js";
import { Course } from "../Database/entities/Course.js";
import { checkIfUserRelatedToContent, checkIfUserRelatedToCourse, checkUUID, handleFileUpload, loadFiles, removeFiles, saveFiles } from "./Tools.js";
import { User } from "../Database/entities/User.js";
import { UsersToCourses } from "../Database/entities/UsersToCourses.js";
import { Files } from "../Database/entities/Files.js";


export interface ContentReturn {
    contentId: string;
    courseId?: string;
    parentId?: string;
    name: string;
    description?: string;
    viewable: boolean;
    dateCreated: Date;
    dateUpdated: Date;
    files: {
        fileId: string;
        fileName: string;
        file: string;
    }[] | [];
    subContent: ContentReturn[];
}


/**
 * Used to manage content.
 */
export class ContentController {
    private contentRepo: Repository<Content>;
    private courseRepo: Repository<Course>;
    private userRepo: Repository<User>;
    private userToCourseRepo: Repository<UsersToCourses>;
    private fileRepo: Repository<Files>;


    /**
     * Constructor for ContentController.
     * @param dataSource - The TypeORM DataSource.
     */
    constructor(dataSource: DataSource) {
        this.contentRepo = dataSource.getRepository(Content);
        this.courseRepo = dataSource.getRepository(Course);
        this.userRepo = dataSource.getRepository(User);
        this.userToCourseRepo = dataSource.getRepository(UsersToCourses);
        this.fileRepo = dataSource.getRepository(Files);
    }

    /**
     * Used to get all content.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getAllContent(req: Request, res: Response): Promise<void> {
        const allContent = await this.contentRepo.find({ relations: ["course", "parent", "files"] });

        res.status(200).json(formatContentListToTree(allContent));
    }

    /**
     * Used to get content by ID.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getContentById(req: Request, res: Response): Promise<void> {
        // Check the content ID
        const contentIdUnknown = req.params?.contentId as unknown;
        if (!checkUUID(contentIdUnknown)) {
            res.status(400).json({ message: "Invalid content ID" });
            return;
        }

        const contentId = contentIdUnknown as string;
        const content = await this.contentRepo.findOne({ where: { contentId: contentId }, relations: ["course", "parent", "files"] });
        if (!content) {
            res.status(404).json({ message: "Content not found" });
            return;
        }

        // Check if the user is related to the course
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToContent(req, res, this.userRepo, this.userToCourseRepo, content)) {
            return;
        }

        // Return the content
        res.status(200).json(contentReturn(content));
    }

    /**
     * Used to create content.
     * @param req - The request object.
     * @param res - The response object.
     */
    async createContent(req: Request, res: Response): Promise<void> {
        // Handle file upload errors
        /* istanbul ignore next */
        if (!await handleFileUpload(req, res)) {
            return;
        }

        // Check the course ID
        const courseIdUnknown = req.params?.courseId as unknown;
        if (!checkUUID(courseIdUnknown)) {
            res.status(400).json({ message: "Invalid course ID" });
            removeFiles(req);
            return;
        }
        
        // Check if the course exists
        const courseId = courseIdUnknown as string;
        const course = await this.courseRepo.findOne({ where: { courseId: courseId } });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            removeFiles(req);
            return;
        }

        // Check if the user is related to the course
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToCourse(req, res, this.userRepo, this.userToCourseRepo)) {
            removeFiles(req);
            return;
        }

        // Check content structure
        const unknownContent = req.body as unknown;
        if (!this.checkContentStructure(unknownContent, false)) {
            res.status(400).json({ message: "Invalid content structure" });
            removeFiles(req);
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
        
        // Handle file upload
        await saveFiles(req, { content: content }, this.fileRepo);

        // Return the created content
        res.status(201).json(contentReturn(content));
    }

    /**
     * Used to create sub-content.
     * @param req - The request object.
     * @param res - The response object.
    */
    async createSubContent(req: Request, res: Response): Promise<void> {
        // Handle file upload errors
        /* istanbul ignore next */
        if (!await handleFileUpload(req, res)) {
            return;
        }

        // Check the parent content ID
        const parentIdUnknown = req.params?.parentId as unknown;
        if (!checkUUID(parentIdUnknown)) {
            res.status(400).json({ message: "Invalid content ID" });
            removeFiles(req);
            return;
        }

        const parentId = parentIdUnknown as string;
        const parent = await this.contentRepo.findOne({ where: { contentId: parentId }, relations: ["course", "parent"] });
        if (!parent) {
            res.status(404).json({ message: "Content not found" });
            removeFiles(req);
            return;
        }

        const course = parent.course!;

        // Check if the user is related to the course
        const tempReq = req;
        tempReq.params = { courseId: course.courseId };
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToCourse(tempReq, res, this.userRepo, this.userToCourseRepo)) {
            removeFiles(req);
            return;
        }

        // Check the structure
        const unknownContent = req.body as unknown;
        try {(unknownContent as Content).viewable = Boolean((unknownContent as Content).viewable);} catch {/* ignore */}
        if (!this.checkContentStructure(unknownContent, false)) {
            res.status(400).json({ message: `Invalid content structure ${JSON.stringify(unknownContent)}` });
            removeFiles(req);
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

        // Handle file upload
        await saveFiles(req, { content: subContent }, this.fileRepo);

        // Return the created sub-content
        res.status(201).json(contentReturn(subContent));
    }

    /**
     * Used to update content by ID.
     * @param req - The request object.
     * @param res - The response object.
     */
    async updateContent(req: Request, res: Response): Promise<void> {
        // Handle file upload errors
        /* istanbul ignore next */
        if (!await handleFileUpload(req, res)) {
            return;
        }

        // Check the content ID
        const contentIdUnknown = req.params?.contentId as unknown;
        if (!checkUUID(contentIdUnknown)) {
            res.status(400).json({ message: "Invalid content ID" });
            removeFiles(req);
            return;
        }

        const contentId = contentIdUnknown as string;
        const content = await this.contentRepo.findOne({ where: { contentId: contentId }, relations: ["course", "parent", "files"] });
        if (!content) {
            res.status(404).json({ message: "Content not found" });
            removeFiles(req);
            return;
        }

        // Check if the user is related to the content
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToContent(req, res, this.userRepo, this.userToCourseRepo, content)) {
            removeFiles(req);
            return;
        }

        // Check the structure
        const unknownContent = req.body as unknown;
        if (!this.checkContentStructure(unknownContent, true)) {
            res.status(400).json({ message: "Invalid content structure" });
            removeFiles(req);
            return;
        }
        const contentData = unknownContent as Partial<Content>;

        // Update the content
        content.name = contentData.name ?? content.name;
        content.description = contentData.description ?? content.description;
        content.parent = contentData.parent ?? content.parent;

        // Handle files by deleting all related ones and re-adding them and the new ones
        /* istanbul ignore next */
        for (const file of content.files) {
            await this.fileRepo.remove(file);
        }
        await saveFiles(req, { content: content }, this.fileRepo);

        await this.contentRepo.save(content);

        // Return the updated content
        res.status(200).json(contentReturn(content));
    }

    /**
     * Used to delete content by ID.
     * @param req - The request object
     * @param res - The response object
     */
    async deleteContent(req: Request, res: Response): Promise<void> {
        // Check the content ID
        const contentIdUnknown = req.params?.contentId as unknown;
        if (!checkUUID(contentIdUnknown)) {
            res.status(400).json({ message: "Invalid content ID" });
            return;
        }
        
        const contentId = contentIdUnknown as string;
        const content = await this.contentRepo.findOne({ where: { contentId: contentId }, relations: ["course"] });
        if (!content) {
            res.status(404).json({ message: "Content not found" });
            return;
        }

        // Check if the user is related to the content
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToContent(req, res, this.userRepo, this.userToCourseRepo, content)) {
            return;
        }

        // Delete the content
        await this.contentRepo.remove(content);

        // Return success
        res.status(200).json({ message: "Content deleted" });
    }


    // ---- TOOLS ----
    /**
     * Check if the content structure is valid
     * @param content - The content to check
     * @param _updating - Whether we are updating or creating
     * @returns Whether the structure is valid or not
     */
    private checkContentStructure(content: unknown, _updating: boolean): boolean {
        if (typeof content !== "object" || content === null) return false;

        // Check if the content has extra keys
        const contentKeys = ["name", "description", "viewable", "files"];
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

        if (typeof contentTyped.viewable !== "boolean" && typeof contentTyped.viewable !== "string") {
            if (typeof contentTyped.viewable !== "undefined" && _updating) return false;
            else if (!_updating) return false;
        }

        // -- Optional --
        if (typeof contentTyped.description === "string") {
            if (contentTyped.description.trim() === "") return false;
        } else if (typeof contentTyped.description !== "undefined" && _updating) return false;

        // All checks passed
        return true;
    }
}

/**
 * Formats content for return
 * @param content - The content to format
 * @returns The formatted content
 */
export function contentReturn(content: Content): ContentReturn {
    return {
        contentId: content.contentId,
        courseId: content.course?.courseId,
        parentId: content.parent?.contentId,
        name: content.name,
        description: content.description,
        viewable: content.viewable,
        dateCreated: content.dateCreated,
        dateUpdated: content.dateUpdated,
        files: loadFiles(content.files),
        subContent: [],
    };
}

/**
 * Formats a list of content into a tree structure based on parent-child relationships
 * @param contentList - The flat list of content items
 * @returns The tree-structured list of content items
 */
export function formatContentListToTree(contentList: Content[]): ContentReturn[] {
    const contentMap: { [key: string]: ContentReturn } = {};
    const tree: ContentReturn[] = [];

    // First, map all content items by their ID
    for (const content of contentList) {
        contentMap[content.contentId] = contentReturn(content);
    }

    // Then, build the tree structure
    for (const content of contentList) {
        const contentId = content.contentId;
        const parentId = content.parent?.contentId;
        if (parentId && contentMap[parentId]) {
            // If the content has a parent, add it to the parent's subContent
            /* istanbul ignore next */
            if (!contentMap[parentId].subContent) {
                contentMap[parentId].subContent = [];
            }
            contentMap[parentId].subContent!.push(contentMap[contentId]);
        } else {
            // If no parent, it's a root content item
            tree.push(contentMap[contentId]);
        }
    }

    return tree;
}