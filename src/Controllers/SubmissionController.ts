import type { DataSource, Repository } from "typeorm";
import type { Request, Response } from "express";
import { AssignmentSubmissions } from "../Database/entities/AssignmentSubmissions.js";
import { checkIfUserRelatedToUser, checkUUID } from "./Tools.js";
import { UsersToCourses } from "../Database/entities/UsersToCourses.js";
import { User } from "../Database/entities/User.js";

/**
 * Used to manage assignment submissions.
 */
export class SubmissionController {
    private submissionRepo: Repository<AssignmentSubmissions>;
    private userRepo: Repository<User>;
    private userToCourseRepo: Repository<UsersToCourses>;
    
    /**
     * Constructor for SubmissionController.
     * @param dataSource - The TypeORM DataSource.
     * */
    constructor(dataSource: DataSource) {
        this.submissionRepo = dataSource.getRepository(AssignmentSubmissions);
        this.userRepo = dataSource.getRepository(User);
        this.userToCourseRepo = dataSource.getRepository(UsersToCourses);
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
        const submissionId = checkUUID(req.params.submissionId);
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

            // Check that the user is apart of the course
            const tempReq = req;
            tempReq.params = { userId: submission.user.userId };
            if (!await checkIfUserRelatedToUser(tempReq, res, this.userRepo)) {
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
}