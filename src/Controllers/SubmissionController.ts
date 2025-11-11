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
     */
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
        try{
            const submissions = await this.submissionRepo.find(
                { relations: ["assignment", "student"] }
            );
            res.status(200).json(submissions);
            return;
        }        
        catch (error) {
            console.error("Error fetching submissions:", error);
            res.status(500).json({ message: "Internal server error" }
            );
        }
        res.status(501).json({ message: "Not implemented" });
    }

    /**
     * Used to get a submission by ID.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getSubmission(req: Request, res: Response): Promise<void> {

    }

    /**
     * Used to delete a submission by ID.
     * @param req - The request object
     * @param res - The response object
     */
    async deleteSubmission(req: Request, res: Response): Promise<void> {
    }

}