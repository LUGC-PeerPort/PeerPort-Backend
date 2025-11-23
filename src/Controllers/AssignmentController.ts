import type { DataSource, Repository } from "typeorm";
import { Assignments } from "../Database/entities/Assignments.js";
import type { Request, Response } from "express";
import { AssignmentSubmissions } from "../Database/entities/AssignmentSubmissions.js";
import { User } from "../Database/entities/User.js";
import { Course } from "../Database/entities/Course.js";
import { Files } from "../Database/entities/Files.js";
import { checkIfUserRelatedToAssignment, checkIfUserRelatedToCourse, checkUUID, handleFileUpload, loadFiles, removeFiles, saveFiles } from "./Tools.js";
import type { Session } from "express-session";
import { UsersToCourses } from "../Database/entities/UsersToCourses.js";

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
    files: {
        fileId: string;
        fileName: string;
        file: string;
    }[] | [];
}

export interface AssignmentSubmissionReturn {
    assignmentId: string;
    userId: string;
    submissionId: string;
    comment: string;
    timeSubmitted: Date | string;
    files: {
        fileId: string;
        fileName: string;
        file: string;
    }[] | [];
}


/**
 * Used to manage assignments.
 */
export class AssignmentController {
    private assignmentRepo: Repository<Assignments>;
    private assignmentSubmissionsRepo: Repository<AssignmentSubmissions>;
    private userRepo: Repository<User>;
    private userToCourseRepo: Repository<UsersToCourses>;
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
        this.userToCourseRepo = dataSource.getRepository(UsersToCourses);
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
            relations: ["course", "files"],
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
        // Handle file upload errors
        if (!await handleFileUpload(req, res)) {
            return;
        }

        // Check assignment structure
        const assignmentUnknown = req.body as unknown;
        if(!this.isValidAssBody(assignmentUnknown, true)) {
            res.status(400).json({ message: "Invalid assignment structure" });
            removeFiles(req);
            return;
        }

        // Convert to assignment structure
        const courseId = (assignmentUnknown as Assignments & {courseId: string}).courseId;
        const assignmentStructure = assignmentUnknown as Assignments;
        
        // Check courseId
        if (!checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            removeFiles(req);
            return;
        }

        // Get course
        const course = await this.courseRepo.findOne({ where: { courseId } });
        if(!course) {
            res.status(404).json({ message: "Course not found" });
            removeFiles(req);
            return;
        }

        // Check dates
        const dueDateParsed = Date.parse(assignmentStructure.dueDate);
        if(dueDateParsed < Date.now()) {
            res.status(400).json({ message: "Invalid due date" });
            removeFiles(req);
            return;
        }

        // Check if the user is related to the course
        const tempReq = req;
        tempReq.params = { courseId: courseId };
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToCourse(tempReq, res, this.userRepo, this.userToCourseRepo)) {
            removeFiles(req);
            return;
        }

        // Create and save the assignment
        const assignment = this.assignmentRepo.create({
            ...assignmentStructure,
            course: course,
        });
        await this.assignmentRepo.save(assignment);
        
        // Create the file links
        await saveFiles(req, { assignment: assignment }, this.fileRepo);

        // Return the created assignment
        res.status(201).json(this.convertToAssignmentReturn(assignment, courseId));
    }

    /**
     * Used to get a single assignment by ID.
     * @param req - The request object
     * @param res - The response object
     */
    async getAssignment(req: Request, res: Response): Promise<void> {
        // Check the assignment ID
        const assignmentId: unknown = req.params?.assignmentId;
        if(!checkUUID(assignmentId)) {
            res.status(400).json({message: "Invalid assignment ID"});
            return;
        }

        // Get the assignment
        const assignment = await this.assignmentRepo.findOne({
            where: {assignmentId: assignmentId as string},
            relations: ["course", "files"],
        });
        if(!assignment) {
            res.status(404).json({message: "Assignment not found"});
            return;
        }

        // Check if the user is related to the assignment
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToAssignment(req, res, this.userRepo, this.userToCourseRepo, this.assignmentRepo)) {
            return;
        }

        // Return the assignment
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
        // Handle file upload errors
        if (!await handleFileUpload(req, res)) {
            return;
        }

        // Validate assignment ID
        const assignmentId: unknown = req.params?.assignmentId;
        if (!checkUUID(req.params?.assignmentId)) {
            res.status(400).json({message: "Invalid assignment ID"});
            removeFiles(req);
            return;
        }

        // Check if the assignment exists
        const assignment = await this.assignmentRepo.findOne({
            where: {assignmentId: assignmentId as string},
            relations: ["course", "files"],
        });
        if (!assignment) {
            res.status(404).json({message: "Assignment not found"});
            removeFiles(req);
            return;
        }

        // Check if the user is related to the assignment
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToAssignment(req, res, this.userRepo, this.userToCourseRepo, this.assignmentRepo)) {
            removeFiles(req);
            return;
        }

        // Get the updated fields
        const assignmentUnknown: unknown = req.body;
        if (!this.isValidAssBody(assignmentUnknown, false, true)) {
            res.status(400).json({ message: "Invalid assignment structure" });
            removeFiles(req);
            return;
        }

        // Convert to assignment structure
        const assignmentTyped = assignmentUnknown as Assignments;
        if (Date.parse(assignmentTyped.dueDate) < Date.now()) {
            res.status(400).json({ message: "Invalid due date" });
            removeFiles(req);
            return;
        }

        // Update assignment fields
        assignment.name = assignmentTyped.name ?? assignment.name;
        assignment.description = assignmentTyped.description ?? assignment.description;
        assignment.dueDate = assignmentTyped.dueDate ?? assignment.dueDate;
        
        // Handle files by deleting all related ones and re-adding them and the new ones
        for (const file of assignment.files) {
            await this.fileRepo.remove(file);
        }
        await saveFiles(req, { assignment: assignment }, this.fileRepo);

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

        // Check if the user is related to the assignment
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToAssignment(req, res, this.userRepo, this.userToCourseRepo, this.assignmentRepo)) {
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

        // Check if the user is related to the assignment
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToAssignment(req, res, this.userRepo, this.userToCourseRepo, this.assignmentRepo)) {
            return;
        }

        // Get submissions for the assignment
        const submissions = await this.assignmentSubmissionsRepo.find({ 
            where: { assignment: { assignmentId: assignmentId as string } },
            relations: ["assignment", "user", "files"],
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
        // Check if the file upload had errors
        if (!await handleFileUpload(req, res)) {
            return;
        }

        // Get assignmentId
        const assignmentId: unknown = req.params?.assignmentId;
        if (!checkUUID(assignmentId)) {
            res.status(400).json({ message: "Invalid assignment ID" });
            removeFiles(req);
            return;
        }

        const assignment = await this.assignmentRepo.findOne({ where: { assignmentId: assignmentId as string } });
        if (!assignment) {
            res.status(404).json({ message: "Assignment not found" });
            removeFiles(req);
            return;
        }

        // Check if the user is related to the assignment
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToAssignment(req, res, this.userRepo, this.userToCourseRepo, this.assignmentRepo)) {
            removeFiles(req);
            return;
        }

        // Check the validity of the submission body
        const submissionUnknown = req.body as unknown;
        if (!this.isValidAssSubmissionBody(submissionUnknown)) {
            res.status(400).json({ message: "Invalid submission structure" });
            removeFiles(req);
            return;
        }

        /* istanbul ignore next */
        const filesCheck = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
        if (filesCheck.length === 0 && (typeof req.body.comment === "undefined" || req.body.comment.trim() === "")) {
            res.status(400).json({ message: "Invalid submission structure" });
            removeFiles(req);
            return;
        }

        const submissionTyped = submissionUnknown as AssignmentSubmissions;

        // Get userId
        const session = (req as Request & { session?: Session & { passport?: { user: string } } }).session;
        /* istanbul ignore next */
        if (!session || session.passport === undefined || session.passport.user === undefined) {
            res.status(401).json({ message: "Unauthorized: User not logged in." });
            removeFiles(req);
            return;
        }

        // These are already checked in the auth middleware
        const userId = session.passport.user;
        const user = await this.userRepo.findOne({ where: { userId: userId as string }});

        // Create submission
        const submission = await this.assignmentSubmissionsRepo.create({
            ...submissionTyped,
            assignment: assignment,
            user: user!,
        });
        await this.assignmentSubmissionsRepo.save(submission);

        // Handle the files
        await saveFiles(req, { submission: submission }, this.fileRepo);

        // Save submission
        const submissionResponse = this.convertToAssignmentSubmissionReturn(submission);
        res.status(201).json(submissionResponse);
    }



    /**
     * -------- TOOLS --------
     */

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
            courseId: courseId,
            files: loadFiles(assignment.files),
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
            files: loadFiles(submission.files),
        };
    }
}