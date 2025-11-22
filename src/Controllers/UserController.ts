import type { Repository } from "typeorm";
import { User } from "../Database/entities/User.js";
import type { Request, Response } from "express";
import type { Course } from "../Database/entities/Course.js";
import type { DataSource } from "typeorm";
import type { CourseReturn } from "./CourseController.js";
import type { UsersToCourses } from "../Database/entities/UsersToCourses.js";
import { Role } from "../Database/entities/Role.js";
import { checkIfUserRelatedToUser, checkUUID } from "./Tools.js";

export interface UserReturn {
    userId: string | undefined;
    name: string;
    email: string;
    profilePictureUrl: string | null;
    idNumber: string;
    role: {
        name: string;
    } | undefined;
    courses: (CourseReturn & { enrolledOn: Date | string })[] | [] | undefined;
}

/**
 * Used to handle user related requests
 */
export class UserController {
    private userRepo: Repository<User>;
    private roleRepo: Repository<Role>;

    /**
	 * Creates an instance of UserController.
	 * @param appDataSource - The TypeORM DataSource
	 */
    constructor(appDataSource: DataSource) {
        this.userRepo = appDataSource.getRepository(User);
        this.roleRepo = appDataSource.getRepository(Role);
    }


    /**
     * Get current User
     * @param req - The Request object
     * @param res - The Response object
     */
    async getCurrentUser(req: Request, res: Response): Promise<void> {
        // Get user ID from request (assuming it's set by authentication middleware)
        if(!req.session) {
            res.status(401).json({message: "Unauthorized"});
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if(!(req.session as any).passport) {
            res.status(401).json({message: "Unauthorized"});
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userID = (req.session as any).passport.user;

        if (!userID) {
            res.status(401).json({message: "Unauthorized"});
            return;
        }

        // Check if the user exists
        const user = await this.userRepo.findOne( {
            where: { userId: userID },
            relations: ["role"],
        }
        );
        if (!user) {
            res.status(401).json({message: "Unauthorized"});
            return;
        }

        res.status(200).json({userId: userID, roleId: user.role.roleId});
    }


    /**
	 * Gets all the users
	 * @param req - The Request object
	 * @param res - The Response object
	 */
    async getAllUsers(req: Request, res: Response): Promise<void> {
        const users = await this.userRepo.find();

        // Generate the return value
        const usersReturn = users.map((user) => {
            const userData = this.userReturn(user);
            delete userData.courses;
            delete userData.role;
            return userData;
        });
        res.status(200).json(usersReturn);
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

        // add the student role to the newly created user
        const studentRole = await this.roleRepo.findOneBy({ name: "student" });
        if (studentRole) {
            result.role = studentRole;
            await this.userRepo.save(result);
        }

        // Convert to return type
        const userReturn = this.userReturn(result);

        // Respond with the created user
        res.status(201).json(userReturn);
    }


    // /api/v1/users/:id
    /**
     * Gets a users profile
     * @param req - The Request object
     * @param res - The Response object
     */
    async getProfile(req: Request, res: Response): Promise<void> {
        const userID = checkUUID(req.params.userId);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        // Make sure the user is getting their own profile
        if (!await checkIfUserRelatedToUser(req, res, this.userRepo)) {
            return;
        }

        // Get the profile from the database
        const user = await this.userRepo
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.role", "role")
            .leftJoinAndSelect("user.courses", "class")
            .leftJoinAndSelect("class.course", "course")
            .where("user.userId = :id", { id: userID })
            .getOne();
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Make the return object
        const userReturn = this.userReturn(user);

        res.status(200).json(userReturn);
    }

    /**
     * Updates a user profile
     * @param req - The Request object
     * @param res - The Response object
     */
    async updateProfile(req: Request, res: Response): Promise<void> {
        const userID = checkUUID(req.params.userId);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        // Make sure the user is updating their own profile
        if (!await checkIfUserRelatedToUser(req, res, this.userRepo)) {
            return;
        }

        // Check user structure
        const userStructureUnknown = req.body as unknown;
        if (!this.checkUserStructure(userStructureUnknown, true)) {
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
        user.profilePictureUrl = userStructure.profilePictureUrl ?? user.profilePictureUrl;

        const result = await this.userRepo.save(user);

        // Parse the user return to the appropriate value
        const userResult = this.userReturn(result);
        res.status(200).json(userResult);
    }

    /**
     * Deletes a user profile
     * @param req - The Request object
     * @param res - The Response object
     */
    async deleteProfile(req: Request, res: Response): Promise<void> {
        const userID = checkUUID(req.params.userId);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        // Make sure the user is deleting their own profile
        if (!await checkIfUserRelatedToUser(req, res, this.userRepo)) {
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
        const userID = checkUUID(req.params.userId);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        
        // Make sure the user is getting their own courses
        if (!await checkIfUserRelatedToUser(req, res, this.userRepo)) {
            return;
        }

        // Get the profile from the database
        const userData = await this.userRepo
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.courses", "class")
            .leftJoinAndSelect("class.course", "course")
            .where("user.userId = :id", { id: userID })
            .getOne();

        if (!userData) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Parse the return and only get the courses
        const courses = userData.courses?.map((cls: UsersToCourses) => {
            return this.courseReturn({ ...cls.course, enrolledOn: cls.enrolledOn } as Course & {enrolledOn: string});
        }) ?? [];

        res.status(200).json(courses);
    }

    /**
     * Gets a specific course a user is in
     * @param req - The Request object
     * @param res - The Response object
     */
    async getCourse(req: Request, res: Response): Promise<void> {
        // Check the user ID
        const userID = checkUUID(req.params.userId);
        if (userID == undefined) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        // Check if the user exists
        const user = await this.userRepo.findOneBy({ userId: userID });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Make sure the user is getting their own course
        if (!await checkIfUserRelatedToUser(req, res, this.userRepo)) {
            return;
        }

        const courseID = checkUUID(req.params.courseId);
        if (courseID == undefined) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Get the course from the user
        const userData = await this.userRepo
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.courses", "class")
            .leftJoinAndSelect("class.course", "course")
            .where("user.userId = :userId", { userId: userID })
            .andWhere("class.courseId = :courseId", { courseId: courseID })
            .getOne();
        if (!userData || !userData.courses || userData.courses.length === 0) {
            res.status(404).json({ message: "Course not found for user" });
            return;
        }

        // This shouldn't happen as it is a case dealt with in the 
        // courseController enrollUserInCourse function
        // if (userData.courses.length > 1) {
        //     console.log("Warning: User is enrolled in the same course multiple times");
        // }

        // Parse the course to the return type
        const courseData = this.courseReturn({ ...userData.courses[0].course, enrolledOn: userData.courses[0].enrolledOn } as Course & {enrolledOn: string});
        res.status(200).json(courseData);
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

        const userKeys = ["name", "email", "profilePictureUrl", "idNumber"];
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
        } else if (typeof userTyped.name !== "undefined" && updating) failedFlag = true;
        else if (!updating) failedFlag = true;

        if (typeof userTyped.email === "string") {
            if (!RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).test(userTyped.email.trim())) failedFlag = true;
            else updated = true;
        } else if (typeof userTyped.email !== "undefined" && updating) failedFlag = true;
        else if (!updating) failedFlag = true;

        if (typeof userTyped.idNumber === "string") {
            if (userTyped.idNumber.trim() === "") failedFlag = true;
            else updated = true;
        } else if (typeof userTyped.idNumber !== "undefined" && updating) failedFlag = true;
        else if (!updating) failedFlag = true;

        // -- Optional --
        if (typeof userTyped.profilePictureUrl === "string") {
            if (userTyped.profilePictureUrl.trim().length < 2) failedFlag = true;
            else updated = true;
        } else if (typeof userTyped.profilePictureUrl !== "undefined" && updating) failedFlag = true;
        else if (!updating && typeof userTyped.profilePictureUrl !== "undefined") failedFlag = true;

        if (failedFlag) return false;
        else if (updating && !updated) return false;
        else return true;
    }

    /**
     * Parses the user data and make it an acceptable return value
     * @param userData - The user data from the database
     * @returns The user data acceptable for a return
     */
    private userReturn(userData: User & { courses?: UsersToCourses[]; role?: Role }): UserReturn {
        return {
            userId: userData.userId,
            name: userData.name,
            email: userData.email,
            profilePictureUrl: userData.profilePictureUrl ?? null,
            idNumber: userData.idNumber,
            role: userData.role
                ? {
                    name: userData.role.name,
                }
                : undefined,
            courses: userData.courses
                ? userData.courses.map((cls: UsersToCourses) => ({
                    enrolledOn: cls.enrolledOn,
                    courseId: cls.course.courseId,
                    name: cls.course.name,
                    courseCode: cls.course.courseCode,
                    isOpen: cls.course.isOpen,
                    description: cls.course.description ?? null,
                    startDate: cls.course.startDate ?? null,
                    endDate: cls.course.endDate ?? null,
                }))
                : [],
        };
    }

    /**
     * Parses the course data and make it an acceptable return value
     * @param courseData - The course data from the database
     * @returns The course data acceptable for a return
     */
    private courseReturn(courseData: Course & {enrolledOn: string }): CourseReturn & {enrolledOn: string} {
        return {
            courseId: courseData.courseId,
            name: courseData.name,
            courseCode: courseData.courseCode,
            isOpen: courseData.isOpen,
            description: courseData.description ?? null,
            startDate: courseData.startDate,
            endDate: courseData.endDate ?? null,
            enrolledOn: courseData.enrolledOn,
        };
    }
}