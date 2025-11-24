import type { Request, Response } from "express";
import type { Repository } from "typeorm";
import type { User } from "../../src/Database/entities/User.js";
import type { UsersToCourses } from "../../src/Database/entities/UsersToCourses.js";
import type { Grade } from "../../src/Database/entities/Grade.js";
import type { Content } from "../../src/Database/entities/Content.js";
import type { Assignments } from "../../src/Database/entities/Assignments.js";
import { Files } from "../../src/Database/entities/Files.js";
import { AssignmentSubmissions } from "../../src/Database/entities/AssignmentSubmissions.js";

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
 * Check the file upload and handle errors
 * @param req - The request object
 * @param res - The response object
 * @returns If the checks passed
 */
export async function handleFileUpload(req: Request, res: Response): Promise<boolean> {
    return true;
}

/**
 * Save files locally and in the database
 * @param req - The request object
 * @param saveData - The object containing which data to save
 * @param fileRepo - The file DB
 */
export async function saveFiles(req: Request, saveData: { submission: AssignmentSubmissions } | { content: Content } | { assignment: Assignments }, fileRepo: Repository<Files>): Promise<void> {
    return;
}

/**
 * Remove uploaded files from the request
 * @param req - The request object
 * @returns Nothing
 */
export function removeFiles(req: Request): void {
    return;
}


/**
 * Get the files and parse them into a usable format
 * @param files - A list of file objects
 * @returns A parsed list of file objects or an empty list
 */
export function loadFiles(files: Files[] | undefined): { fileId: string; fileName: string; file: string; }[] | [] {
    if (!files || files.length === 0) return [];
    
    // Process the files into a string
    const loadedFiles: { fileId: string; fileName: string; file: string; }[] = [];
    for (const file of files) {
        loadedFiles.push({
            fileId: file.fileId,
            fileName: file.fileName,
            file: ""
        });
    }

    // Return the files
    return loadedFiles;
}

/**
 * Checks if the user is a teacher or an admin
 * @param req - The request object
 * @param userRepo - The user DB
 * @returns Whether the user is a teacher or an admin
 */
export async function isUserTeacherOrAdmin(req: Request, userRepo: Repository<User>): Promise<boolean> {
    return true;
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
export async function checkIfUserRelatedToUser(req: Request, res: Response, userRepo: Repository<User>): Promise<boolean> {
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
    return true;
}