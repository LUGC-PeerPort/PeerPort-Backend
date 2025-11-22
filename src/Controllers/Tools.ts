import type { Session } from "express-session";
import type { Request, Response } from "express";
import type { Repository } from "typeorm";
import type { User } from "../Database/entities/User.js";
import type { UsersToCourses } from "../Database/entities/UsersToCourses.js";

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
 * Checks if the user is allowed to edit/get from the user profile
 * @param req - The Request object
 * @param res - The Response object
 * @param userRepo - The user DB
 * @returns Whether the user is allowed to edit the user profile
 */
export async function checkIfUserEditUser(req: Request, res: Response, userRepo: Repository<User>): Promise<boolean> {
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
            res.status(403).json({ message: "Forbidden: Cannot edit other user's profile" });
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
    if (typeof user.role === "undefined" || user.role.name !== "admin") {
        return false;
    }
    return true;
}