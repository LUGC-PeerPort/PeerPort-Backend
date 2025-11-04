import type { DataSource, Repository } from "typeorm";
import type { Request, Response } from "express";
import { Grade } from "../Database/entities/Grade.js";

/**
 * Used to manage grades.
 */
export class GradeController {
    private gradeRepo: Repository<Grade>;

    /**
     * Constructor for GradeController.
     * @param dataSource - The TypeORM DataSource.
     */
    constructor(dataSource: DataSource) {
        this.gradeRepo = dataSource.getRepository(Grade);
    }

    /**
     * Used to get all grades.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getAllGrades(req: Request, res: Response): Promise<void> {
        res.status(501).json({ message: "Not implemented" });
    }

    /**
     * Used to get a grade by ID.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getGrade(req: Request, res: Response): Promise<void> {
        res.status(501).json({ message: "Not implemented" });
    }

    /**
     * Used to create a new grade.
     * @param req - The request object.
     * @param res - The response object.
     */
    async createGrade(req: Request, res: Response): Promise<void> {
        res.status(501).json({ message: "Not implemented" });
    }

    /**
     * Used to update a grade
     * @param req - The request object.
     * @param res - The response object.
     */
    async updateGrade(req: Request, res: Response): Promise<void> {
        res.status(501).json({ message: "Not implemented" });
    }

    /**
     * Used to delete a grade by ID.
     * @param req - The request object
     * @param res - The response object
     */
    async deleteGrade(req: Request, res: Response): Promise<void> {
        res.status(501).json({ message: "Not implemented" });
    }

    /**
     * Used to get all grades for a user
     * @param req - The request object
     * @param res - The response object
     */
    async getAllGradesForUser(req: Request, res: Response): Promise<void> {
        res.status(501).json({ message: "Not implemented" });
    }
    
    /**
     * Used to get all grades from a course
     * @param req - The request object
     * @param res - The response object
     */
    async getAllGradesForCourse(req: Request, res: Response): Promise<void> {
        res.status(501).json({ message: "Not implemented" });
    }

    /**
     * Used to get all grades for a user from a specific course
     * @param req - The request object
     * @param res - The response object
     */
    async getAllGradesForUserInCourse(req: Request, res: Response): Promise<void> {
        res.status(501).json({ message: "Not implemented" });
    }

    /**
     * Used to get the calculated grade in a course for a user
     * @param req - The request object
     * @param res - The response object
     */
    async getCalculatedGradeForUserInCourse(req: Request, res: Response): Promise<void> {
        res.status(501).json({ message: "Not implemented" });
    }

    /**
     * Used to get the average grade for a course
     * @param req - The request object
     * @param res - The response object
     */
    async getAverageGradeForCourse(req: Request, res: Response): Promise<void> {
        res.status(501).json({ message: "Not implemented" });
    }


    /**
     * ------------------------ Hooks ------------------------
     */

    /**
     * Called after a grade is created.
     * @param grade - The created grade.
     */
    private async afterGradeCreated(grade: Grade): Promise<void> {}

    /**
     * Called after a grade is updated.
     * @param grade - The updated grade.
     */
    private async afterGradeUpdated(grade: Grade): Promise<void> {}

    /**
     * Called after a grade is deleted.
     * @param gradeId - The ID of the deleted grade.
     */
    private async afterGradeDeleted(gradeId: string): Promise<void> {}


    /**
     * ------------------------ Tools ------------------------
     */

    /**
     * Checks if the UUID is valid
     * @param id - The  UUID
     * @returns The UUID if valid, undefined otherwise
     */
    private checkUUID(id: unknown): string | void {
        if (typeof id !== "string") return;

        // Trim the string
        const assSubID = id.trim();

        // Check if the ID has content
        if (assSubID == "") return;
        
        // Check if the ID is a valid UUID
        if (!RegExp(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).test(assSubID)) return;
        
        // Return the ID
        return assSubID;
    }

}