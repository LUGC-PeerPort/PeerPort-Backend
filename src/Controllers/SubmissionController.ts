import type { DataSource, Repository } from "typeorm";
import { AssignmentSubmissions } from "../Database/entities/AssignmentSubmissions";
import type { Request, Response } from "express";

/**
 * Used to manage assignment submissions.
 */
export class SubmissionController {
    private submissionRepo: Repository<AssignmentSubmissions>;

    /**
     * Constructor for SubmissionController.
     * @param dataSource - The TypeORM DataSource.
     */
    constructor(dataSource: DataSource) {
        this.submissionRepo = dataSource.getRepository(AssignmentSubmissions);
    }

    /**
     * Used to get all submissions.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getAllSubmissions(req: Request, res: Response): Promise<void> {
        res.status(501).send("Not implemented");
    }

    /**
     * Used to get a submission by ID.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getSubmission(req: Request, res: Response): Promise<void> {
        res.status(501).send("Not implemented");
    }

    /**
     * Used to delete a submission by ID.
     * @param req - The requst object
     * @param res - The response object
     */
    async deleteSubmission(req: Request, res: Response): Promise<void> {
        res.status(501).send("Not implemented");
    }

}