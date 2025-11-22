import type { DataSource, Repository } from "typeorm";
import { Assignments } from "../Database/entities/Assignments.js";
import type { Request, Response } from "express";
import { AssignmentSubmissions } from "../Database/entities/AssignmentSubmissions.js";
import { User } from "../Database/entities/User.js";
import { Course } from "../Database/entities/Course.js";
import { Files } from "../Database/entities/Files.js";
import { checkUUID } from "./Tools.js";
import { uploader } from "../app.js";
import * as fs from "fs";
import multer from "multer";
import type { Session } from "express-session";

export interface AssignmentReturnWithoutCourseId {
    assignmentId: string;
    name: string;
    description: string;
    dueDate: Date | string;
}

export interface AssignmentReturn {
    assignmentId: string;
    name: string;
    description: string;
    dueDate: Date | string;
    courseId: string;
}

export interface AssignmentSubmissionReturn {
    assignmentId: string;
    userId: string;
    submissionId: string;
    comment: string;
    timeSubmitted: Date | string;
}


/**
 * Used to manage assignments.
 */
export class AssignmentController {
    private assignmentRepo: Repository<Assignments>;
    private assignmentSubmissionsRepo: Repository<AssignmentSubmissions>;
    private userRepo: Repository<User>;
    private courseRepo: Repository<Course>;
    private fileRepo: Repository<Files>;

    /**
     * Constructor for AssignmentController.
     * @param dataSource - The TypeORM DataSource.
     */
    constructor(dataSource: DataSource) {
        this.assignmentRepo = dataSource.getRepository(Assignments);
        this.assignmentSubmissionsRepo = dataSource.getRepository(AssignmentSubmissions);
        this.userRepo = dataSource.getRepository(User);
        this.courseRepo = dataSource.getRepository(Course);
        this.fileRepo = dataSource.getRepository(Files);
    }

    /**
     * Used to get all assignments.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getAllAssignments(req: Request, res: Response): Promise<void> {
        const assignments = await this.assignmentRepo.find({
            relations: ["course"],
        });

        const assignmentResponses = assignments.map(assignment => this.convertToAssignmentReturn(assignment, assignment.course.courseId));
        res.status(200).json(assignmentResponses);
    }

    /**
     * Used to create a new assignment.
     * @param req - The request object.
     * @param res - The response object.
     */
    async createAssignment(req: Request, res: Response): Promise<void> {
        // Check assignment structure
        const assignmentUnknown = req.body as unknown;
        if(!this.isValidAssBody(assignmentUnknown, true)) {
            res.status(400).json({ message: "Invalid assignment structure" });
            return;
        }

        // Convert to assignment structure
        const courseId = (assignmentUnknown as Assignments & {courseId: string}).courseId;
        const assignmentStructure = assignmentUnknown as Assignments;
        
        // Check courseId
        if (!checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Get course
        const course = await this.courseRepo.findOne({ where: { courseId } });
        if(!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Check dates
        const dueDateParsed = Date.parse(assignmentStructure.dueDate);
        if(dueDateParsed < Date.now()) {
            res.status(400).json({ message: "Invalid due date" });
            return;
        }

        // Create and save the assignment
        const newAssignment = this.assignmentRepo.create({
            ...assignmentStructure,
            course: course,
        });
        const savedAssignment = await this.assignmentRepo.save(newAssignment);

        res.status(201).json(this.convertToAssignmentReturn(savedAssignment, courseId));
    }

    /**
     * Used to get a single assignment by ID.
     * @param req - The request object
     * @param res - The response object
     */
    async getAssignment(req: Request, res: Response): Promise<void> {
        const assignmentId: unknown = req.params?.assignmentId;
        if(!checkUUID(assignmentId)) {
            res.status(400).json({message: "Invalid assignment ID"});
            return;
        }

        const assignment = await this.assignmentRepo.findOne({
            where: {assignmentId: assignmentId as string},
            relations: ["course"],
        });
        if(!assignment) {
            res.status(404).json({message: "Assignment not found"});
            return;
        }
        const assignmentReturn = this.convertToAssignmentReturn(
            assignment, 
            assignment.course.courseId
        );
        res.status(200).json(assignmentReturn);
    }

    /**
     * Used to update an assignment by ID.
     * @param req - The request object
     * @param res - The response object
     */
    async updateAssignment(req: Request, res: Response): Promise<void> {
    
        // Validate assignment ID
        const assignmentId: unknown = req.params?.assignmentId;
        if (!checkUUID(req.params?.assignmentId)) {
            res.status(400).json({message: "Invalid assignment ID"});
            return;
        }

        // Check if the assignment exists
        const assignment = await this.assignmentRepo.findOne({
            where: {assignmentId: assignmentId as string},
            relations: ["course"],
        });
        if (!assignment) {
            res.status(404).json({message: "Assignment not found"});
            return;
        }

        // Get the updated fields
        const assignmentUnknown: unknown = req.body;
        if (!this.isValidAssBody(assignmentUnknown, false, true)) {
            res.status(400).json({ message: "Invalid assignment structure" });
            return;
        }

        // Convert to assignment structure
        const assignmentTyped = assignmentUnknown as Assignments;
        if (Date.parse(assignmentTyped.dueDate) < Date.now()) {
            res.status(400).json({ message: "Invalid due date" });
            return;
        }

        // Update assignment fields
        assignment.name = assignmentTyped.name ?? assignment.name;
        assignment.description = assignmentTyped.description ?? assignment.description;
        assignment.dueDate = assignmentTyped.dueDate ?? assignment.dueDate;

        // Save updated assignment
        await this.assignmentRepo.save(assignment);
        const assignmentReturn = this.convertToAssignmentReturn(
            assignment, 
            assignment.course.courseId
        );
        res.status(200).json(assignmentReturn);
    }

    /**
     * Used to delete an assignment by ID.
     * @param req - The request object
     * @param res - The response object
     */
    async deleteAssignment(req: Request, res: Response): Promise<void> {
        // Get the assignment ID
        const assignmentId: unknown = req.params?.assignmentId;
        if (!checkUUID(assignmentId)) {
            res.status(400).json({message: "Invalid assignment ID"});
            return;
        }

        // Find the assignment
        const assignment = await this.assignmentRepo.findOne({ where: { assignmentId: assignmentId as string }, relations: ["course", "assignmentSubmissions", "files"] });
        if (!assignment) {
            res.status(404).json({ message: "Assignment not found" });
            return;
        }

        // Delete the assignment
        await this.assignmentRepo.remove(assignment);
        res.status(200).json({ message: "Assignment deleted" });
    }

    /**
     * Used to get all submissions for a specific assignment.
     * @param req - The request object
     * @param res - The response object
     */
    async getSubmissionsForAssignment(req: Request, res: Response): Promise<void> {
        // Get the assignment ID
        const assignmentId: unknown = req.params?.assignmentId;
        if (!checkUUID(assignmentId)) {
            res.status(400).json({ message: "Invalid assignment ID" });
            return;
        }

        // Check if assignment exists
        const assignment = await this.assignmentRepo.findOne({ 
            where: { assignmentId: assignmentId as string }
        });
        if (!assignment) {
            res.status(404).json({ message: "Assignment not found" });
            return;
        }

        // Get submissions for the assignment
        const submissions = await this.assignmentSubmissionsRepo.find({ 
            where: { assignment: { assignmentId: assignmentId as string } },
            relations: ["assignment", "user"],
        });

        // Convert submissions to return format
        const submissionResponses = submissions.map(submission => this.convertToAssignmentSubmissionReturn(submission));
        res.status(200).json(submissionResponses);
    }

    /**
     * Used to create a submission for a specific assignment.
     * @param req - The request object
     * @param res - The response object
     */
    async createSubmissionForAssignment(req: Request, res: Response): Promise<void> {
        try {
            await new Promise<void>((resolve, reject) => {
                uploader.array("files")(req, res, async (err: unknown) => {
                    if (err) {
                        if (err instanceof multer.MulterError) {
                            if (err.code === "LIMIT_FILE_SIZE") {
                                // File too large
                                res.status(400).json({ message: "One or more files exceed the size limit of 10MB." });

                                // resolve so we can handle cleanup after the await
                                return reject("file size limit exceeded");
                            }
                        }
                        // Multer error occurred
                        console.error(`\x1b[31m[ERROR] Multer error: ${err}\x1b[0m`);
                        return reject(err);
                    }
                    resolve();
                });
            });
        } catch (err) {
            if (err === "file size limit exceeded") {
                console.error("\x1b[33m[WARNING] A file exceeded the size limit of 10MB.\x1b[0m");
                // Files already handled in the multer error case
                this.removeFiles(req);
                return;
            } else {
                // Unexpected upload error
                console.error(`\x1b[31m[ERROR] Upload failed: ${err}\x1b[0m`);
                res.status(500).json({ message: "File upload failed." });
                this.removeFiles(req);
                return;
            }
        }

        // Get assignmentId
        const assignmentId: unknown = req.params?.assignmentId;
        if (!checkUUID(assignmentId)) {
            res.status(400).json({ message: "Invalid assignment ID" });
            this.removeFiles(req);
            return;
        }

        const assignment = await this.assignmentRepo.findOne({ where: { assignmentId: assignmentId as string } });
        if (!assignment) {
            res.status(404).json({ message: "Assignment not found" });
            this.removeFiles(req);
            return;
        }

        // Check the validity of the submission body
        const submissionUnknown = req.body as unknown;
        if (!this.isValidAssSubmissionBody(submissionUnknown)) {
            res.status(400).json({ message: "Invalid submission structure" });
            this.removeFiles(req);
            return;
        }

        if (typeof req.files == "undefined" && typeof req.body.content === "undefined") {
            res.status(400).json({ message: "Invalid submission structure" });
            return;
        }

        const submissionTyped = submissionUnknown as AssignmentSubmissions;

        // Get userId
        const session = (req as Request & { session?: Session & { passport?: { user: string } } }).session;
        if (!session || session.passport === undefined || session.passport.user === undefined) {
            res.status(401).json({ message: "Unauthorized: User not logged in." });
            this.removeFiles(req);
            return;
        }
        const userId = session.passport.user;
        if (!checkUUID(userId)) {
            res.status(400).json({ message: "Invalid user ID" });
            this.removeFiles(req);
            return;
        }

        const user = await this.userRepo.findOne({ where: { userId: userId as string }});
        if (!user) {
            res.status(404).json({message: "User not found"});
            this.removeFiles(req);
            return;
        }

        // Create submission
        const submission = await this.assignmentSubmissionsRepo.create({
            ...submissionTyped,
            assignment: assignment,
            user: user,
        });
        await this.assignmentSubmissionsRepo.save(submission);

        // Handle the files
        const files = (req.files as Express.Multer.File[]) || [];
        for (const file of files) {
            const fileEntry = this.fileRepo.create({
                fileName: file.originalname,
                location: file.path,
                submission: submission,
            });
            await this.fileRepo.save(fileEntry); //save files to db
        }

        // Save submission
        const submissionResponse = this.convertToAssignmentSubmissionReturn(submission);
        res.status(201).json(submissionResponse);
    }



    /**
     * -------- TOOLS --------
     */

    /**
     * Remove uploaded files from the request
     * @param req - The request object
     * @returns Nothing
     */
    private removeFiles(req: Request): void {
        if (req.files === undefined) return;
        const files = req.files as Express.Multer.File[] | undefined;
        if (files) {
            for (const file of files) {
                fs.unlink(file.path, (err) => {
                    if (err) {
                        console.error(`\x1b[31m[ERROR] Removing file ${file.path} failed: ${err}\x1b[0m`);
                    }
                });
            }
        }
    }

    /**
     * Helper for assignment request body validation
     * @param assignment - The request body / assignment to validate
     * @param _creation - Whether this is for creation (allows courseId)
     * @param _updating - Whether we are checking the structure for updating
     * @returns boolean - Whether the body is valid
     */
    // eslint-disable-next-line complexity
    private isValidAssBody(assignment: unknown, _creation: boolean=false, _updating: boolean=false): boolean {
        if (typeof assignment !== "object" || assignment === null) return false;

        const requiredFields = ["name", "description", "dueDate"];
        for (const key of Object.keys(assignment)) {
            if (!requiredFields.includes(key) && !(key === "courseId" && _creation)) {
                return false;
            }
        }

        // Make a assignment object that is partial
        const assignmentTyped = assignment as Partial<{
            name: string; 
            description: string;
            dueDate: string;
            courseId: string;
        }>;

        if (typeof assignmentTyped.name === "string") {
            if (assignmentTyped.name.trim() === "") return false;
        } else if (typeof assignmentTyped.name !== "undefined" && _updating) return false;
        else if (!_updating) return false;

        if (typeof assignmentTyped.description === "string") {
            if (assignmentTyped.description.trim() === "") return false;
        } else if (typeof assignmentTyped.description !== "undefined" && _updating) return false;
        else if (!_updating) return false;

        if (typeof assignmentTyped.dueDate === "string") {
            const date = Date.parse(assignmentTyped.dueDate);
            if (isNaN(date)) return false;
        } else if (typeof assignmentTyped.dueDate !== "undefined" && _updating) return false;
        else if (!_updating) return false;

        return true;
    }

    /**
     * Helper for assignment submission request body validation
     * @param submission - The request body / submission to validate
     * @returns boolean - Whether the body is valid
     */
    private isValidAssSubmissionBody(submission: unknown): boolean {
        if (typeof submission !== "object" || submission === null) return false;

        const allowedFields = ["comment"];
        for (const key of Object.keys(submission)) {
            if (!allowedFields.includes(key)) {
                return false;
            }
        }

        // Make a submission object that is partial
        const submissionTyped = submission as Partial<{
            comment: string; 
            timeSubmitted: string;
            userId: string;
        }>;

        // Optional comment
        if (typeof submissionTyped.comment === "string") {
            if (submissionTyped.comment.trim() === "") return false;
        }

        return true;
    }

    /**
     * Used to convert an assignment to an AssignmentReturn object
     * @param assignment Assignment object
     * @param courseId Course Id the assignment is linked to default is null
     * @returns The return to be sent to the user
     */
    private convertToAssignmentReturn(assignment: Assignments, courseId: string): AssignmentReturn {
        // Course ID is present return AssignmentReturn
        return {
            assignmentId: assignment.assignmentId,
            name: assignment.name,
            description: assignment.description,
            dueDate: assignment.dueDate,
            courseId: courseId
        };
    }

    /**
     * Used to convert an assignment submission to an AssignmentSubmissionReturn object
     * @param submission AssignmentSubmission object
     * @returns The return to be sent to the user
     */
    private convertToAssignmentSubmissionReturn(submission: AssignmentSubmissions): AssignmentSubmissionReturn {
        return {
            assignmentId: submission.assignment.assignmentId,
            userId: submission.user.userId,
            submissionId: submission.assignmentSubmissionId,
            comment: submission.comment,
            timeSubmitted: submission.timeSubmitted,
        };
    }
}