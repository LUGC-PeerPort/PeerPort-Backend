import type { DataSource, Repository } from "typeorm";
import { Assignments } from "../Database/entities/Assignments";
import type { Request, Response } from "express";

/**
 * Used to manage assignments.
 */
export class AssignmentController {
    private assignmentRepo: Repository<Assignments>;

    /**
     * Constructor for AssignmentController.
     * @param dataSource - The TypeORM DataSource.
     */
    constructor(dataSource: DataSource) {
        this.assignmentRepo = dataSource.getRepository(Assignments);
    }

    async getAllAssignments(req: Request, res: Response): Promise<void> {}

    async createAssignment(req: Request, res: Response): Promise<void> {}

    async getAssignment(req: Request, res: Response): Promise<void> {}

    async updateAssignment(req: Request, res: Response): Promise<void> {}

    async deleteAssignment(req: Request, res: Response): Promise<void> {}

    async getSubmissionsForAssignment(req: Request, res: Response): Promise<void> {}

    async createSubmissionForAssignment(req: Request, res: Response): Promise<void> {}
}