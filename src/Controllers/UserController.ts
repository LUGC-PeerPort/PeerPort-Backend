import type { Repository } from "typeorm";
import { User } from "../Database/entities/User.js";
import type { Request, Response } from "express";
import { Class } from "../Database/entities/Course.js";
import type { DataSource } from "typeorm";

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
    constructor(appDataSource: DataSource) {
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
            console.log("invalid user structure", userStructureUnknown);
            res.status(400).json({ message: "Invalid user structure" });
            return;
        }

        // Convert to User type
        const userStructure = userStructureUnknown as User;

        if (userStructure.profilePictureUrl === "") {
            userStructure.profilePictureUrl = undefined;
        }

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
        res.status(200).json(user);
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
        if (!this.checkUserStructure(userStructureUnknown, true)) {
            console.log("invalid user structure");
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
        res.status(200).json(result);
    }
    
    /**
     * Deletes a user profile
     * @param req - The Request object
     * @param res - The Response object
     */
    async deleteProfile(req: Request, res: Response): Promise<void> {
        const userID = await this.checkUserId(req.params.id);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        
        // Delete the user
        await this.userRepo.delete(userID);
        res.status(204).json({ message: "User deleted successfully" });
    }


    // /api/v1/users/:id/courses
    /**
     * Gets all courses a user is in
     * @param req - The Request object
     * @param res - The Response object
     */
    async getCourses(req: Request, res: Response): Promise<void> {
        const userID = await this.checkUserId(req.params.id);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        // Get the profile from the database
        const classes = await this.userRepo
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.classes", "class")
            .leftJoinAndSelect("class.classEntity", "course")
            .where("user.userId = :id", { id: userID })
            .getOne();
            
        if (!classes) {
            res.status(404).json({ message: "Classes not found" });
            return;
        }

        res.json(classes.classes);
    }

    /**
     * Gets a specific course a user is in
     * @param req - The Request object
     * @param res - The Response object
     */
    async getCourse(req: Request, res: Response): Promise<void> {
        const userID = await this.checkUserId(req.params.id);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        const courseID = await this.checkCourseId(req.params.courseId);
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
     * @param updating (Optional) - Whether the user to make the parameters optional
     * @returns true if the user structure is valid, false otherwise
     */
    // eslint-disable-next-line complexity
    private checkUserStructure(user: unknown, updating?: boolean): boolean {
        if (typeof user !== "object" || user === null) return false;

        const userKeys = ["name", "email", "password", "profilePictureUrl", "idNumber"];
        for (const key of Object.keys(user)) {
            if (!userKeys.includes(key)) return false;
        }

        const userTyped = user as Partial<User>;
        updating = updating ?? false;
        let failedFlag = false;
        let updated = false;

        // -- Required --
        if (typeof userTyped.name === "string") {
            if (userTyped.name.trim().length < 2) failedFlag = true;
            else updated = true;
        } else if (typeof userTyped.name !== "undefined" && !updating) failedFlag = true;
        else if (!updating) failedFlag = true;

        if (typeof userTyped.email === "string") {
            if (!RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).test(userTyped.email.trim())) failedFlag = true;
            else updated = true;
        } else if (typeof userTyped.email !== "undefined" && !updating) failedFlag = true;
        else if (!updating) failedFlag = true;

        if (typeof userTyped.password === "string") {
            if (userTyped.password.trim() === "" || userTyped.password.trim().length < 8) failedFlag = true;
            else updated = true;
        } else if (typeof userTyped.password !== "undefined" && !updating) failedFlag = true;
        else if (!updating) failedFlag = true;

        if (typeof userTyped.idNumber === "string") {
            if (userTyped.idNumber.trim() === "") failedFlag = true;
            else updated = true;
        } else if (typeof userTyped.idNumber !== "undefined" && !updating) failedFlag = true;
        else if (!updating) failedFlag = true;
        
        // -- Optional --
        if (typeof userTyped.profilePictureUrl === "string") {
            if (userTyped.profilePictureUrl.trim() !== "" && userTyped.profilePictureUrl.trim().length < 2) failedFlag = true;
            else updated = true;
        }

        if (failedFlag) return false;
        else if (updating && !updated) return false;
        else return true;
    }

    /**
     * Checks if the userID is valid as is in use
     * @param id - The users UUID
     * @returns The UUID if valid, undefined otherwise
     */
    private checkUserId(id: string): string | void {
        const userID = id.trim();

        // Check if the ID has content
        if (userID == "") return;
        
        // Check if the ID is a valid UUID
        if (!RegExp(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).test(userID)) return;
        
        // Return the ID
        return userID;
    }

    /**
     * Checks if the courseID is valid or in use
     * @param id - The UUID of the course
     * @returns The UUID if valid, undefined otherwise
     */
    private async checkCourseId(id: string): Promise<string | void> {
        const courseID = id.trim();
        if (courseID.length < 10) return;

        // Check if a course has that ID
        const course = await this.courseRepo.findOneBy({ classId: courseID });
        if (!course) return;
        return courseID;
    }
}