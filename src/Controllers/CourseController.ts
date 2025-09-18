import type { DataSource, Repository } from "typeorm";
import type { Request, Response } from "express";
import { Class } from "../Database/entities/Course.js";
import { User } from "../Database/entities/User.js";
import { UsersToClasses } from "../Database/entities/UsersToCourses.js";


/**
 *
 */
export class CourseController {
    private courseRepo: Repository<Class>;
    private userRepo: Repository<User>;
    private usersToClassesRepo: Repository<UsersToClasses>;

    /**
     * Create an instance of the CourseController
     * @param appDataSource - The TypeORM DataSource
     */
    constructor(appDataSource: DataSource) {
        this.courseRepo = appDataSource.getRepository(Class);
        this.userRepo = appDataSource.getRepository(User);
        this.usersToClassesRepo = appDataSource.getRepository(UsersToClasses);
    }

    /**
     * Gets all the courses
     * @param req - The Request object
     * @param res - The Response object
     */
    async getAllCourses(req: Request, res: Response): Promise<void> {
        const courses = await this.courseRepo.find();
        res.json(courses);
    }

    /**
     * Creates a new course
     * @param req - The Request object
     * @param res - The Response object
     */
    async createCourse(req: Request, res: Response): Promise<void> {
        // Check course structure
        const rawCourse = req.body as unknown;
        if (typeof rawCourse !== "object" || rawCourse === null) {
            res.status(400).json({ message: "Invalid request structure" });
            return;
        }
        if (!("course" in rawCourse) || !this.checkCourseStructure(rawCourse.course)) {
            res.status(400).json({ message: "Invalid course structure" });
            return;
        }

        // Check if the user was given
        if (!("userId" in rawCourse) || typeof rawCourse.userId !== "string" || rawCourse.userId.trim() === "") {
            res.status(400).json({ message: "User ID is required to create a course" });
            return;
        }
        
        // Check if the user exists
        const userId = rawCourse.userId;
        const user = await this.userRepo.findOneBy({ userId: userId });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Convert to Course type
        const course = rawCourse.course as Class;

        // Create and save the course
        const newCourse = this.courseRepo.create(course);
        const result = await this.courseRepo.save(newCourse);

        // Add connection to user
        const usersToClasses = this.usersToClassesRepo.create({
            user: user,
            classEntity: result
        });
        await this.usersToClassesRepo.save(usersToClasses);

        // Connect the user to the course
        res.status(201).json(result);
    }

    // /api/v1/courses/:id
    /**
     * Gets a course by ID
     * @param req - The Request object
     * @param res - The Response object
     */
    async getCourse(req: Request, res: Response): Promise<void> {
        // Check the course ID
        const rawCourseId = req.params.id;
        if (!this.checkCourseId(rawCourseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Get the course from the database
        const courseID = req.params.id;
        const course = await this.courseRepo.findOneBy({ classId: courseID });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }
        res.status(200).json(course);
    }


    // ----- TOOLS -----
    
    /**
     * Checks if the course structure is valid or not
     * @param course - The course structure to check
     * @returns Whether the structure is valid or not
     */
    private checkCourseStructure(course: unknown): boolean {
        if (typeof course !== "object" || course === null) return false;

        // Check if the course has any extra keys
        const courseKeys = ["name", "courseCode", "isOpen", "description", "startDate", "endDate"];
        for (const key of Object.keys(course)) {
            if ((key !in courseKeys)) return false;
        }
        // Make a Course object that is partial (all fields optional)
        const courseTyped = course as Partial<Class>;

        // -- Required --
        if (typeof courseTyped.name !== "string" || courseTyped.name.trim() === "") return false;
        
        if (typeof courseTyped.courseCode !== "string" || courseTyped.courseCode.trim() === "") return false;
        
        if (typeof courseTyped.isOpen !== "boolean") return false;
        
        if (typeof courseTyped.startDate !== "string" || isNaN(Date.parse(courseTyped.startDate))) return false;
        
        // -- Nullable --
        if (courseTyped.description !== undefined && (typeof courseTyped.description !== "string" || courseTyped.description.trim() === "")) return false;

        if (courseTyped.endDate !== undefined && (typeof courseTyped.endDate !== "string" || isNaN(Date.parse(courseTyped.endDate)))) return false;

        return true;
    }

    /**
     * Checks the validity of the course ID
     * @param id - The course ID to check
     * @returns Whether the course ID is valid or not
     */
    private async checkCourseId(id: string): Promise<boolean> {
        if (typeof id !== "string" || id.trim() === "") return false;

        const course = await this.courseRepo.findOneBy({ classId: id });
        if (!course) return false;
        return true;
    }
}
