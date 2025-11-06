import type { DataSource, Repository } from "typeorm";
import type { Request, Response } from "express";
import { Grade } from "../Database/entities/Grade.js";
import { User } from "../Database/entities/User.js";
import { Course } from "../Database/entities/Course.js";
import { AssignmentSubmissions } from "../Database/entities/AssignmentSubmissions.js";

/**
 * Used to manage grades.
 */
export class GradeController {
    private gradeRepo: Repository<Grade>;
    private userRepo: Repository<User>;
    private courseRepo: Repository<Course>;
    private assignmentSubmissionRepo: Repository<AssignmentSubmissions>;

    /**
     * Constructor for GradeController.
     * @param dataSource - The TypeORM DataSource.
     */
    constructor(dataSource: DataSource) {
        this.gradeRepo = dataSource.getRepository(Grade);
        this.userRepo = dataSource.getRepository(User);
        this.courseRepo = dataSource.getRepository(Course);
        this.assignmentSubmissionRepo = dataSource.getRepository(AssignmentSubmissions);
    }

    /**
     * Used to get all grades.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getAllGrades(req: Request, res: Response): Promise<void> {
        // Get all grades
        const grades = await this.gradeRepo.find({ relations: ["user", "course", "assignmentSubmission"] });

        // Map grades to user appropriate objects
        const userGrades = grades.map(grade => this.gradeReturn(grade));

        // Return the grades
        res.status(200).json(userGrades);
    }

    /**
     * Used to get a grade by ID.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getGrade(req: Request, res: Response): Promise<void> {
        // Check the grade ID
        const gradeId = req.params?.gradeId as unknown;
        if (!this.checkUUID(gradeId)) {
            res.status(400).json({ message: "Invalid grade ID" });
            return;
        }

        // Get the grade
        const grade = await this.gradeRepo.findOne({ where: { gradeId: gradeId as string }, relations: ["user", "course", "assignmentSubmission"] });
        if (!grade) {
            res.status(404).json({ message: "Grade not found" });
            return;
        }

        // Return the grade
        const gradeReturn = this.gradeReturn(grade);
        res.status(200).json(gradeReturn);
    }

    // /api/grades/:userId/:courseId/:assignmentSubmissionId
    // /api/grades/:userId/:courseId
    /**
     * Used to create a new grade.
     * @param req - The request object.
     * @param res - The response object.
     */
    async createGrade(req: Request, res: Response): Promise<void> {
        // Get the grade structure
        const gradeUnknown = req.body as unknown;
        const userIdUnknown = req.params?.userId as unknown;
        const courseIdUnknown = req.params?.courseId as unknown;
        const assignmentSubmissionIdUnknown = req.params?.assignmentSubmissionId as unknown;

        // Validate the userId
        if (!this.checkUUID(userIdUnknown)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        // Check if the user exists
        const user = await this.userRepo.findOne({ where: { userId: userIdUnknown as string } });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Validate the courseId
        if (!this.checkUUID(courseIdUnknown)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Check if the course exists
        const course = await this.courseRepo.findOne({ where: { courseId: courseIdUnknown as string } });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Validate the assignmentSubmissionId if provided
        let assignmentSubmission = undefined;
        if (typeof assignmentSubmissionIdUnknown !== "undefined") {
            if (!this.checkUUID(assignmentSubmissionIdUnknown)) {
                res.status(400).json({ message: "Invalid assignment submission ID" });
                return;
            }

            // Check if the assignment submission exists
            assignmentSubmission = await this.assignmentSubmissionRepo.findOne({ where: { assignmentSubmissionId: assignmentSubmissionIdUnknown as string } });
            if (!assignmentSubmission) {
                res.status(404).json({ message: "Assignment submission not found" });
                return;
            }
        }


        // Validate the grade structure
        if (!this.isValidGradeStructure(gradeUnknown)) {
            res.status(400).json({ message: "Invalid grade structure" });
            return;
        }

        // Make the grade object typed
        const gradeTyped = gradeUnknown as Grade;

        // Check the maxScore
        if (gradeTyped.maxScore < gradeTyped.minScore) {
            res.status(400).json({ message: "Invalid max score" });
            return;
        }

        // Check the achievedScore
        if (typeof gradeTyped.achievedScore === "number") {
            if (gradeTyped.achievedScore < gradeTyped.minScore || gradeTyped.achievedScore > gradeTyped.maxScore) {
                res.status(400).json({ message: "Invalid achieved score" });
                return;
            }
        }

        // Create the grade
        const newGrade = this.gradeRepo.create({
            minScore: gradeTyped.minScore,
            maxScore: gradeTyped.maxScore,
            achievedScore: gradeTyped.achievedScore || undefined,
            weight: gradeTyped.weight,
            user: user,
            course: course,
            assignmentSubmission: assignmentSubmission || undefined,
        });

        // Save the grade
        await this.gradeRepo.save(newGrade);

        // Return the grade
        res.status(201).json(this.gradeReturn(newGrade));

        // Call the hook
        this.afterGradeCreated(newGrade);
    }

    // /api/grades/:gradeId
    /**
     * Used to update a grade
     * @param req - The request object.
     * @param res - The response object.
     */
    async updateGrade(req: Request, res: Response): Promise<void> {
        // Check the grade ID
        const gradeId = req.params.gradeId as unknown;
        if (!this.checkUUID(gradeId)) {
            res.status(400).json({ message: "Invalid grade ID" });
            return;
        }
        
        // Find the grade
        const grade = await this.gradeRepo.findOne({ where: { gradeId: gradeId as string }, relations: ["user", "course", "assignmentSubmission"] });
        if (!grade) {
            res.status(404).json({ message: "Grade not found" });
            return;
        }

        // Get the grade structure
        const gradeUnknown = req.body as unknown;
        
        // Validate the grade structure
        if (!this.isValidGradeStructure(gradeUnknown, true)) {
            res.status(400).json({ message: "Invalid grade structure" });
            return;
        }

        // Make the grade object typed
        const gradeTyped = gradeUnknown as Partial<Grade>;

        const minScore = grade.minScore ?? gradeTyped.minScore;
        const maxScore = grade.maxScore ?? gradeTyped.maxScore;
        const achievedScore = grade.achievedScore ?? gradeTyped.achievedScore;

        // Check if the maxScore is below minScore 
        if (maxScore < minScore) {
            res.status(400).json({ message: "Invalid max score" });
            return;
        }

        // Check if the achievedScore is above maxScore or below minScore
        if (typeof achievedScore === "number") {
            if (achievedScore < minScore || achievedScore > maxScore) {
                res.status(400).json({ message: "Invalid achieved score" });
                return;
            }
        }

        // Update the grade
        grade.minScore = minScore;
        grade.maxScore = maxScore;
        grade.achievedScore = achievedScore;
        grade.weight = gradeTyped.weight ?? grade.weight;

        // Save the grade
        await this.gradeRepo.save(grade);

        // Return the grade
        res.status(200).json(this.gradeReturn(grade));

        // Call the hook
        this.afterGradeUpdated(grade);
    }

    /**
     * Used to delete a grade by ID.
     * @param req - The request object
     * @param res - The response object
     */
    async deleteGrade(req: Request, res: Response): Promise<void> {
        // Check the grade ID
        const gradeId = req.params.gradeId as unknown;
        if (!this.checkUUID(gradeId)) {
            res.status(400).json({ message: "Invalid grade ID" });
            return;
        }

        // Find the grade
        const grade = await this.gradeRepo.findOne({ where: { gradeId: gradeId as string }, relations: ["user", "course", "assignmentSubmission"] });
        if (!grade) {
            res.status(404).json({ message: "Grade not found" });
            return;
        }

        // Delete the grade
        await this.gradeRepo.remove(grade);

        // Return success
        res.status(200).json({ message: "Grade deleted" });

        // Call the hook
        this.afterGradeDeleted(gradeId as string);
    }

    // /api/grades/user/:userId
    /**
     * Used to get all grades for a user
     * @param req - The request object
     * @param res - The response object
     */
    async getAllGradesForUser(req: Request, res: Response): Promise<void> {
        // Check the user ID
        const userId = req.params.userId as unknown;
        if (!this.checkUUID(userId)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        // Check if the user exists
        const user = await this.userRepo.findOne({ where: { userId: userId as string } });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Get all grades for the user
        const grades = await this.gradeRepo.find({ where: { user: user }, relations: ["course", "assignmentSubmission"] });

        // Map grades to user appropriate objects
        const userGrades = grades.map(grade => this.gradeReturn(grade));

        // Return the grades
        res.status(200).json(userGrades);
    }
    
    // /api/grades/course/:courseId
    /**
     * Used to get all grades from a course
     * @param req - The request object
     * @param res - The response object
     */
    async getAllGradesForCourse(req: Request, res: Response): Promise<void> {
        // Check the course ID
        const courseId = req.params.courseId as unknown;
        if (!this.checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Check if the course exists
        const course = await this.courseRepo.findOne({ where: { courseId: courseId as string } });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Get all grades for the course
        const grades = await this.gradeRepo.find({ where: { course: course }, relations: ["user", "assignmentSubmission"] });

        // Map grades to user appropriate objects
        const courseGrades = grades.map(grade => this.gradeReturn(grade));

        // Return the grades
        res.status(200).json(courseGrades);
    }

    // /api/grades/user/:userId/course/:courseId
    /**
     * Used to get all grades for a user from a specific course
     * @param req - The request object
     * @param res - The response object
     */
    async getAllGradesForUserInCourse(req: Request, res: Response): Promise<void> {
        // Check the user ID
        const userId = req.params.userId as unknown;
        if (!this.checkUUID(userId)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        
        // Check if the user exists
        const user = await this.userRepo.findOne({ where: { userId: userId as string } });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Check the course ID
        const courseId = req.params.courseId as unknown;
        if (!this.checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Check if the course exists
        const course = await this.courseRepo.findOne({ where: { courseId: courseId as string } });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Get all grades for the user in the course
        const grades = await this.gradeRepo.find({ where: { user: user, course: course }, relations: ["assignmentSubmission"] });

        // Map grades to user appropriate objects
        const userCourseGrades = grades.map(grade => this.gradeReturn(grade));

        // Return the grades
        res.status(200).json(userCourseGrades);
    }

    // /api/grades/calculated/user/:userId/course/:courseId
    /**
     * Used to get the calculated grade in a course for a user
     * @param req - The request object
     * @param res - The response object
     */
    async getCalculatedGradeForUserInCourse(req: Request, res: Response): Promise<void> {
        // Check the user ID
        const userId = req.params.userId as unknown;
        if (!this.checkUUID(userId)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        // Check if the user exists
        const user = await this.userRepo.findOne({ where: { userId: userId as string } });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Check the course ID
        const courseId = req.params.courseId as unknown;
        if (!this.checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Check if the course exists
        const course = await this.courseRepo.findOne({ where: { courseId: courseId as string } });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Get the user's grades in the course
        const userGrades = await this.gradeRepo.find({ where: { user: user, course: course }, relations: ["assignmentSubmission"] });

        // Get the calculated grade
        // total weight = weight1 + weight2 + ...
        // weightedSum = weight1 * score1 + weight2 * score2 + ...
        // calculatedGrade = (weightedSum / totalWeight) * 100
        let totalWeight = 0;
        let weightedScoreSum = 0;
        for (const grade of userGrades) {
            const weight = grade.weight;
            const score = grade.achievedScore / grade.maxScore;
            weightedScoreSum += score * weight;
            totalWeight += weight;
        }

        // Get the final calculated grade (rounded to 2 decimal places)
        const calculatedGrade = totalWeight > 0 ? parseFloat(((weightedScoreSum / totalWeight) * 100).toFixed(2)) : 0;

        // Return the grades
        res.status(200).json({ grade: calculatedGrade });
    }

    // /api/grades/average/course/:courseId
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

    /**
     * Checks if the grade structure is valid
     * @param grade - The grade object
     * @param _updating - Whether this is for updating
     * @returns True if the grade structure is valid, false otherwise
     */
    //eslint-disable-next-line complexity
    private isValidGradeStructure(grade: unknown, _updating?: boolean): boolean {
        // Check if grade is an object
        if (typeof grade !== "object" || grade === null) return false;

        // Set default values
        _updating ||= false;

        // Check if the grade object has the required properties
        const requiredProperties = ["minScore", "maxScore", "achievedScore", "weight"];
        for (const key of Object.keys(grade)) {
            if (!requiredProperties.includes(key)) {
                return false;
            }
        }

        // Make a grade object that is partial (all fields optional)
        const gradeTyped = grade as Partial<Grade>;

        let failedFlag = false;
        let updated = false;

        // -- Required --
        if (typeof gradeTyped.minScore === "number") {
            if (gradeTyped.minScore < 0) failedFlag = true;
            else updated = true;
        } else if (typeof gradeTyped.minScore !== "undefined" && _updating) failedFlag = true;
        else if (!_updating) failedFlag = true;

        if (typeof gradeTyped.maxScore === "number") {
            if (gradeTyped.maxScore <= 0) failedFlag = true;
            else updated = true;
        } else if (typeof gradeTyped.maxScore !== "undefined" && _updating) failedFlag = true;
        else if (!_updating) failedFlag = true;

        if (typeof gradeTyped.weight === "number") {
            if (gradeTyped.weight < 0) failedFlag = true;
            else updated = true;
        } else if (typeof gradeTyped.weight !== "undefined" && _updating) failedFlag = true;
        else if (!_updating) failedFlag = true;

        // -- Optional --
        if (typeof gradeTyped.achievedScore === "number") {
            if (gradeTyped.achievedScore < 0) failedFlag = true;
            else updated = true;
        } else if (typeof gradeTyped.achievedScore !== "undefined" && _updating) failedFlag = true;

        // Check the results
        if (failedFlag) return false;
        if (!updated && _updating) return false;

        // Passes all checks
        return true;
    }

    /**
     * Returns a user appropriate grade object
     * @param grade - The grade
     * @returns The user appropriate grade object
     */
    private gradeReturn(grade: Grade): object {
        return {
            gradeId: grade.gradeId,
            userId: grade.user.userId,
            courseId: grade.course.courseId,
            assignmentSubmissionId: grade.assignmentSubmission?.assignmentSubmissionId ?? undefined,
            achievedScore: grade.achievedScore,
            weight: grade.weight,
            minScore: grade.minScore,
            maxScore: grade.maxScore,
        };
    }

}