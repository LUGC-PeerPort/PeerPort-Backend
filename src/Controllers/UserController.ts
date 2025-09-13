import type { Repository } from "typeorm";
import { User } from "../Database/entities/User.js";
import type { Request, Response } from "express";
import { Class } from "../Database/entities/Class.js";
import type { AppDataSource } from "../Database/DB.js";

/**
 * Used to handle user related requests
 */
export class UserController {
    private userRepo: Repository<User>;
    private courseRepo: Repository<Class>;

    /**
	 * Creates an instance of UserController.
	 * @param UserRepo - The user repository from TypeORM
	 * @param ClassRepo
	 * @param appDataSource
	 */
    constructor(appDataSource: typeof AppDataSource) {
        this.userRepo = appDataSource.getRepository(User);
        this.courseRepo = appDataSource.getRepository(Class);
    }


    /**
	 * Gets all the users
	 * @param req - The Request object
	 * @param res - The Response object
	 */
    async getAllUsers(req: Request, res: Response): Promise<void> {
        const users = await this.userRepo.find();
        res.json(users);
    }

    /**
	 * Create a new user
	 * @param req - The Request object
	 * @param res - The Response object
	 */
    async create(req: Request, res: Response): Promise<void> {
        // Check user structure
        const userStructureUnknown = req.body as unknown;
        if (!this.checkUserStructure(userStructureUnknown)) {
            res.status(400).json({ message: "Invalid user structure" });
            return;
        }

        // Convert to User type
        const userStructure = userStructureUnknown as User;

        // Check if email already exists
        const existingUser = await this.userRepo.findOneBy({ email: userStructure.email });
        if (existingUser) {
            res.status(409).json({ message: "Email already in use" });
            return;
        }

        // Create and save the user
        const user = this.userRepo.create(userStructure);
        const result = await this.userRepo.save(user);

        // Respond with the created user
        res.status(201).json(result);
    }


    // /api/v1/users/:id
    /**
     * Gets a users profile
     * @param req - The Request object
     * @param res - The Response object
     */
    async getProfile(req: Request, res: Response): Promise<void> {
        const userID = this.checkUserId(req.params.id);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        // Get the profile from the database
        const user = await this.userRepo.findOneBy({ userId: userID });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    }

    /**
     * Updates a user profile
     * @param req - The Request object
     * @param res - The Response object
     */
    async updateProfile(req: Request, res: Response): Promise<void> {
        const userID = this.checkUserId(req.params.id);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        // Check user structure
        const userStructureUnknown = req.body as unknown;
        if (!this.checkUserStructure(userStructureUnknown)) {
            res.status(400).json({ message: "Invalid user structure" });
            return;
        }

        // Convert to User type
        const userStructure = userStructureUnknown as User;

        // Get the profile from the database
        const user = await this.userRepo.findOneBy({ userId: userID });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Update the user
        user.name = userStructure.name ?? user.name;
        user.email = userStructure.email ?? user.email;
        user.password = userStructure.password ?? user.password;
        user.profilePictureUrl = userStructure.profilePictureUrl ?? user.profilePictureUrl;

        const result = await this.userRepo.save(user);
        res.json(result);
    }
    
    /**
     * Deletes a user profile
     * @param req - The Request object
     * @param res - The Response object
     */
    async deleteProfile(req: Request, res: Response): Promise<void> {
        const userID = this.checkUserId(req.params.id);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        
        // Delete the user
        this.userRepo.delete(userID);
        res.status(204).send();
    }


    // /api/v1/users/:id/courses
    /**
     * Gets all courses a user is in
     * @param req - The Request object
     * @param res - The Response object
     */
    async getCourses(req: Request, res: Response): Promise<void> {
        const userID = this.checkUserId(req.params.id);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        // Get the profile from the database
        const user = await this.userRepo
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.classes", "class")
            .where("user.userId = :id", { id: userID })
            .getOne();
        
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.json(user.classes);
    }

    /**
     * Gets a specific course a user is in
     * @param req - The Request object
     * @param res - The Response object
     */
    async getCourse(req: Request, res: Response): Promise<void> {
        const userID = this.checkUserId(req.params.id);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        const courseID = this.checkCourseId(req.params.courseId);
        if (courseID == undefined) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Get the course from the DB
        const course = await this.courseRepo.findOneBy({ classId: courseID });
        res.json(course);
    }

    

    //----- TOOLS -----//
    /**
     * Checks the validity of the user structure
     * @param user - The user object to check
     * @returns true if the user structure is valid, false otherwise
     */
    private checkUserStructure(user: unknown): boolean {
        if (typeof user !== "object" || user === null) return false;

        if ("name" in user && typeof user.name === "string" && user.name.trim() !== "") {
            if (user.name.length < 2) return false;
        }
        if ("email" in user && typeof user.email === "string" && user.email.trim() !== "") {
            if (!RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).test(user.email)) return false;
        }
        if ("password" in user && (typeof user.password !== "string" || user.password.trim() === "")) return false;
        if ("profilePic" in user && (typeof user.profilePic !== "string" || user.profilePic.trim() === "")) return false;

        return true;
    }

    /**
     * Checks if the userID is valid as is in use
     * @param id - The users UUID
     * @returns The UUID if valid, undefined otherwise
     */
    private checkUserId(id: string): string | void {
        const userID = id.trim();
        if (userID.length < 10) return;

        // Check if a user had that ID
        const user = this.userRepo.findOneBy({ userId: userID });
        if (!user) return;
        return userID;
    }

    /**
     * Checks if the courseID is valid or in use
     * @param id - The UUID of the course
     * @returns The UUID if valid, undefined otherwise
     */
    private checkCourseId(id: string): string | void {
        const courseID = id.trim();
        if (courseID.length < 10) return;

        // Check if a course has that ID
        const course = this.courseRepo.findOneBy({ classId: courseID });
        if (!course) return;
        return courseID;
    }
}