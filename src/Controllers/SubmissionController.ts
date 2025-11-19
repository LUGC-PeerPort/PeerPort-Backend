import type { DataSource, Repository } from "typeorm";
import { AssignmentSubmissions } from "../Database/entities/AssignmentSubmissions";
import type { Request, Response } from "express";
import { User } from "../Database/entities/User";
import { Course } from "../Database/entities/Course";

/**
 * Used to manage assignment submissions.
 */
export class SubmissionController {
    private submissionRepo: Repository<AssignmentSubmissions>;
    private userRepo: Repository<User>;
    private courseRepo: Repository<Course>;
    
    /**
     * Constructor for SubmissionController.
     * @param dataSource - The TypeORM DataSource.
     * */
    constructor(dataSource: DataSource) {
        this.submissionRepo = dataSource.getRepository(AssignmentSubmissions);
        this.userRepo = dataSource.getRepository(User);
        this.courseRepo = dataSource.getRepository(Course);
    }

    /**
     * Used to get all submissions.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getAllSubmissions(req: Request, res: Response): Promise<void> {
        try {
            const submissions = await this.submissionRepo.find({
                relations: ["user", "assignment"],
            });
            const formattedSubmissions = submissions.map((s) => ({
                comment: s.comment,
                timeSubmitted: s.timeSubmitted,
                userId: s.user.userId,
                assignmentId: s.assignment.assignmentId,
                submissionId: s.assignmentSubmissionId,
            }));
            res.status(200).json(formattedSubmissions);
            return;
        } catch (error) {
            console.error("Error fetching submissions:", error);
            res.status(500).json({ message: "Internal server error" });
        }   
    }

    /**
    * Used to get a submission by ID.
    * @param req - The request object.
    * @param res - The response object.
    */
    async getSubmission(req: Request, res: Response): Promise<void> {
        const submissionId = this.checkUUID(req.params.submissionId);
        if (!submissionId) {
            res.status(400).json({ message: "Invalid submission ID" });
            return;
        }
        try {
            const submission = await this.submissionRepo.findOne({
                where: { assignmentSubmissionId: submissionId },
                relations: ["user", "assignment"],
            });
            if (!submission) {
                res.status(404).json({ message: "Submission not found" });
                return;
            }
            res.status(200).json({
                comment: submission.comment,
                timeSubmitted: submission.timeSubmitted,
                userId: submission.user.userId,
                assignmentId: submission.assignment.assignmentId,
                submissionId: submission.assignmentSubmissionId,
            });
        } catch (error) {
            console.error("Error fetching submission:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    /**
    * Used to delete a submission by ID.
    * @param req - The request object
    * @param res - The response object
    */
    async deleteSubmission(req: Request, res: Response): Promise<void> {
        //Students should not be able to delete a submission. Leaving the function here in case we need it later.
        //as well as there will be errors if it is removed now. which I will not be able to fix until I pull from main
        res.status(501).json({ message: "Not implemented" });
    }
    /**
     * Checks if the UUID is valid
     * @param id - The UUID
     * @returns The UUID if valid, undefined otherwise
     */
    //copied from the AssignmentController checkUUID function
    private checkUUID(id: unknown): string | void {
        if (typeof id !== "string") return;
        // Trim the string
        const assSubID = id.trim();

        // Check if the ID has content
        if (assSubID === "") return;

        // Check if the ID is a valid UUID
        if (
            !RegExp(
                /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
            ).test(assSubID)
        )
            return;

        // Return the ID
        return assSubID;
    }
}