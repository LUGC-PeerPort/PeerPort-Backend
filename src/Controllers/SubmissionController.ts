import type { DataSource, Repository } from "typeorm";
import { AssignmentSubmissions } from "../Database/entities/AssignmentSubmissions";

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
}