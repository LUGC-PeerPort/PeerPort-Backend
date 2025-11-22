import type { Request, Response } from "express";
import type { Repository } from "typeorm";
import type { User } from "../../src/Database/entities/User.js";
import type { UsersToCourses } from "../../src/Database/entities/UsersToCourses.js";

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
    return true;
}
