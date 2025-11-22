import type { Session } from "express-session";
import type { Request, Response } from "express";
import type { Repository } from "typeorm";
import type { User } from "../Database/entities/User.js";
import type { UsersToCourses } from "../Database/entities/UsersToCourses.js";
import type { Grade } from "../Database/entities/Grade.js";
import type { Content } from "../Database/entities/Content.js";
import type { Assignments } from "../Database/entities/Assignments.js";

/**
 * Checks if the UUID is valid
 * @param id - The  UUID
 * @returns The UUID if valid, undefined otherwise
 */
export function checkUUID(id: unknown): string | void {
    if (typeof id !== "string") return;

    // Trim the string
    const newId = id.trim();

    // Check if the ID has content
    if (newId === "") return;
    
    // Check if the ID is a valid UUID
    if (!RegExp(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).test(newId)) return;
    
    // Return the ID
    return newId;
}

/**
 * Checks if the user is related to the course that is given in the params
 * @param req - The request object
 * @param res - The response object
 * @param userRepo - The user DB
 * @param usersToCoursesRepo - The users to courses DB
 * @returns Whether the user is related to the course
 */
export async function checkIfUserRelatedToCourse(req: Request, res: Response, userRepo: Repository<User>, usersToCoursesRepo: Repository<UsersToCourses>): Promise<boolean> {
    // Check if the user is related to this course
    const session = (req as Request & { session?: Session & { passport?: { user: string } } }).session;
    if (!session || session.passport === undefined || session.passport.user === undefined) {
        res.status(401).json({ message: "Unauthorized: User not logged in." });
        return false;
    }
    const userId = session.passport.user;

    // Get the user
    const user = await userRepo.findOne({ where: { userId: userId }, relations: ["role"] });
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return false;
    }

    // Check if the user is connected to the course
    const courseConnection = await usersToCoursesRepo.findOne({
        where: {
            user: { userId: userId },
            course: { courseId: req.params.courseId }
        }
    });
    if (!courseConnection) {
        // Check if the user is an admin
        if (!isAdmin(user)) {
            res.status(403).json({ message: "Forbidden: User not enrolled in this course." });
            return false;
        }
    }
    return true;
}


/**
 * Checks if the logged-in user is accessing their own user profile or is an admin.
 * @param req - The Request object
 * @param res - The Response object
 * @param userRepo - The user DB
 * @returns Whether the user is allowed to access the user profile
 */
export async function checkIfUserRelatedToUser(req: Request, res: Response, userRepo: Repository<User>): Promise<boolean> {
    // Check if the user is editing their own profile
    const session = (req as Request & { session?: Session & { passport?: { user: string } } }).session;
    if (!session || session.passport === undefined || session.passport.user === undefined) {
        res.status(401).json({ message: "Unauthorized: User not logged in." });
        return false;
    }
    const userId = session.passport.user;

    // Get the user
    const user = await userRepo.findOne({ where: { userId: userId }, relations: ["role"] });
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return false;
    }

    if (userId !== req.params.userId) {
        // Check if the user is an admin
        if (!isAdmin(user)) {
            res.status(403).json({ message: "Forbidden: Cannot access other user's details." });
            return false;
        }
    }
    return true;
}

/**
 * Checks whether the user is related to the grade that is given in the params
 * @param req - The request object
 * @param res - The response object
 * @param userRepo - The user DB
 * @param gradesRepo - The grade DB
 * @returns Whether the user is related to the grade
 */
export async function checkIfUserRelatedToGrades(req: Request, res: Response, userRepo: Repository<User>, gradesRepo: Repository<Grade>): Promise<boolean> {
    // Check if the user is related to this grade
    const session = (req as Request & { session?: Session & { passport?: { user: string } } }).session;
    if (!session || session.passport === undefined || session.passport.user === undefined) {
        res.status(401).json({ message: "Unauthorized: User not logged in." });
        return false;
    }
    const userId = session.passport.user;

    // Get the user
    const user = await userRepo.findOne({ where: { userId: userId }, relations: ["role"] });
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return false;
    }

    // Get the grade
    const grade = await gradesRepo.findOne({ where: { gradeId: req.params.gradeId }, relations: ["user"] });
    if (!grade) {
        res.status(404).json({ message: "Grade not found" });
        return false;
    }

    // Check if the user is connected to the grade
    if (grade.user.userId !== userId) {
        // Check if the user is an admin
        if (!isAdmin(user)) {
            res.status(403).json({ message: "Forbidden: Cannot access other user's grade" });
            return false;
        }
    }
    return true;
}

/**
 * Checks whether the user is related to the content that is given
 * @param req - The request object
 * @param res - The response object
 * @param userRepo - The user DB
 * @param userToCourse - The user to course DB
 * @param content - The content to check
 * @returns Whether the user is related to the content
 */
export async function checkIfUserRelatedToContent(req: Request, res: Response, userRepo: Repository<User>, userToCourse: Repository<UsersToCourses>, content: Content): Promise<boolean> {
    // Check if the user is related to this content
    const session = (req as Request & { session?: Session & { passport?: { user: string } } }).session;
    if (!session || session.passport === undefined || session.passport.user === undefined) {
        res.status(401).json({ message: "Unauthorized: User not logged in." });
        return false;
    }
    const userId = session.passport.user;

    // Get the user
    const user = await userRepo.findOne({ where: { userId: userId }, relations: ["role"] });
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return false;
    }

    // Check if the user is connected to the content's course
    const courseConnection = await userToCourse.findOne({
        where: {
            user: { userId: userId },
            course: { courseId: content.course!.courseId }
        }
    });

    if (!courseConnection) {
        // Check if the user is an admin
        if (!isAdmin(user)) {
            res.status(403).json({ message: "Forbidden: User does not have access to this content." });
            return false;
        }
    }
    return true;
}

/**
 * Whether the user is related to the assignment
 * @param req - The Request object
 * @param res - The Response object
 * @param userRepo - The user DB
 * @param userToCourseRepo - The user to course DB
 * @param assignmentRepo - The assignment DB
 * @returns Whether the user is related to the assignment
 */
export async function checkIfUserRelatedToAssignment(req: Request, res: Response, userRepo: Repository<User>, userToCourseRepo: Repository<UsersToCourses>, assignmentRepo: Repository<Assignments>): Promise<boolean> {
    // Check if the user is related to this assignment
    const session = (req as Request & { session?: Session & { passport?: { user: string } } }).session;
    if (!session || session.passport === undefined || session.passport.user === undefined) {
        res.status(401).json({ message: "Unauthorized: User not logged in." });
        return false;
    }
    const userId = session.passport.user;

    // Get the user
    const user = await userRepo.findOne({ where: { userId: userId }, relations: ["role"] });
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return false;
    }

    // Get the assignment
    const assignment = await assignmentRepo.findOne({ where: { assignmentId: req.params.assignmentId }, relations: ["course"] });
    if (!assignment) {
        res.status(404).json({ message: "Assignment not found" });
        return false;
    }

    // Check if the user is connected to the assignment's course
    const courseConnection = await userToCourseRepo.findOne({
        where: {
            user: { userId: userId },
            course: { courseId: assignment.course.courseId }
        }
    });
    if (!courseConnection) {
        // Check if the user is an admin
        if (!isAdmin(user)) {
            res.status(403).json({ message: "Forbidden: User does not have access to this assignment." });
            return false;
        }
    }
    return true;
}

/**
 * Checks if the user is an admin
 * @param user - The user to check
 * @returns Whether the user is an admin
 */
function isAdmin(user: User): boolean {
    // Check if user is an admin or not
    if (typeof user.role === "undefined" || (user.role.name !== "admin" && user.role.name !== "teacher")) {
        return false;
    }
    return true;
}