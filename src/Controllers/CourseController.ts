import type { DataSource, Repository } from "typeorm";
import type { Request, Response } from "express";
import { Course } from "../Database/entities/Course.js";
import { User } from "../Database/entities/User.js";
import { UsersToCourses } from "../Database/entities/UsersToCourses.js";

export interface CourseReturn {
    courseId: string;
    name: string;
    courseCode: string;
    isOpen: boolean;
    description: string | null;
    startDate: Date | string | null;
    endDate: Date | string | null;
};


/**
 * The controller for handling course-related operations
 */
export class CourseController {
    private courseRepo: Repository<Course>;
    private userRepo: Repository<User>;
    private usersToCoursesRepo: Repository<UsersToCourses>;

    /**
     * Create an instance of the CourseController
     * @param appDataSource - The TypeORM DataSource
     */
    constructor(appDataSource: DataSource) {
        this.courseRepo = appDataSource.getRepository(Course);
        this.userRepo = appDataSource.getRepository(User);
        this.usersToCoursesRepo = appDataSource.getRepository(UsersToCourses);
    }

    /**
     * Gets all the courses
     * @param req - The Request object
     * @param res - The Response object
     */
    async getAllCourses(req: Request, res: Response): Promise<void> {
        const courses = await this.courseRepo.find();
        const courseReturns = courses.map(course => this.courseReturn(course));
        res.status(200).json(courseReturns);
    }

    /**
     * Creates a new course
     * @param req - The Request object
     * @param res - The Response object
     */
    async createCourse(req: Request, res: Response): Promise<void> {
        // Check course structure
        const courseUnknown = req.body as unknown;
        if (!this.checkCourseStructure(courseUnknown)) {
            res.status(400).json({ message: "Invalid course structure" });
            return;
        }

        // Convert to Course type
        const courseStructure = courseUnknown as Course;
        const userId = (courseUnknown as any).userId;
        if (typeof userId !== "string" || userId.trim() === "") {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        
        // Check if the user exists
        const user = await this.userRepo.findOneBy({ userId: userId });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Create and save the course
        const newCourse = this.courseRepo.create(courseStructure);
        const courseResult = await this.courseRepo.save(newCourse);

        // Add connection to user
        const usersToCourses = this.usersToCoursesRepo.create({
            user: user,
            course: courseResult
        });
        await this.usersToCoursesRepo.save(usersToCourses);

        // Connect the user to the course
        const courseReturn = this.courseReturn(courseResult);
        res.status(201).json(courseReturn);
    }

    // /api/v1/courses/:id
    /**
     * Gets a course by ID
     * @param req - The Request object
     * @param res - The Response object
     */
    async getCourse(req: Request, res: Response): Promise<void> {
        // Check the course ID
        const courseId = req.params.id;
        if (!this.checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Get the course from the database
        const course = await this.courseRepo.findOneBy({ courseId: courseId });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Parse the course
        const courseReturn = this.courseReturn(course);
        res.status(200).json(courseReturn);
    }

    async updateCourse(req: Request, res: Response): Promise<void> {
        // Check the course ID
        const courseId = req.params.id;
        if (!this.checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Check if course exists
        const course = await this.courseRepo.findOneBy({ courseId: courseId });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Check course structure
        const courseUnknown = req.body as unknown;
        if (!this.checkCourseStructure(courseUnknown)) {
            res.status(400).json({ message: "Invalid course structure" });
            return;
        }

        // Save the course
        const courseStructure = courseUnknown as Course;
        
        course.name = courseStructure.name ?? course.name;
        course.courseCode = courseStructure.courseCode ?? course.courseCode;
        course.isOpen = courseStructure.isOpen ?? course.isOpen;
        course.description = courseStructure.description ?? course.description;
        course.startDate = courseStructure.startDate ?? course.startDate;
        course.endDate = courseStructure.endDate ?? course.endDate;

        await this.courseRepo.save(course);
        res.status(200).json(this.courseReturn(course));
    }

    async deleteCourse(req: Request, res: Response): Promise<void> {
        // Check the course ID
        const courseId = req.params.id;
        if (!this.checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Check if the course exists
        const course = await this.courseRepo.findOneBy({ courseId: courseId });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Delete the course
        await this.courseRepo.remove(course);
        res.status(204).json({ message: "Course deleted" });
    }


    // ----- TOOLS -----
    
    /**
     * Checks if the course structure is valid or not
     * @param course - The course structure to check
     * @param _creation - Whether the check is for creation or not
     * @returns Whether the structure is valid or not
     */
    private checkCourseStructure(course: unknown, _creation: boolean=false): boolean {
        if (typeof course !== "object" || course === null) return false;

        // Check if the course has any extra keys
        const courseKeys = ["name", "courseCode", "isOpen", "description", "startDate", "endDate"];
        for (const key of Object.keys(course)) {
            if (key !in courseKeys && !(key === "userId" && _creation)) return false;
        }

        // Make a Course object that is partial (all fields optional)
        const courseTyped = course as Partial<Course>;

        // -- Required --
        if (typeof courseTyped.name !== "string" || courseTyped.name.trim() === "") return false;
        
        if (typeof courseTyped.courseCode !== "string" || courseTyped.courseCode.trim() === "") return false;
        
        if (typeof courseTyped.isOpen !== "boolean") return false;
        
        if (typeof courseTyped.startDate !in ["string", "date"]) return false;
        
        // -- Nullable --
        if (courseTyped.description && (typeof courseTyped.description !== "string" || courseTyped.description.trim() === "")) return false;

        if (courseTyped.endDate && (typeof courseTyped.endDate !in ["string", "date"])) return false;

        return true;
    }

    /**
     * Checks if the UUID is valid
     * @param id - The  UUID
     * @returns The UUID if valid, undefined otherwise
     */
    private checkUUID(id: string): string | void {
        if (id == undefined) return;

        // Trim the string
        const userID = id.trim();

        // Check if the ID has content
        if (userID == "") return;
        
        // Check if the ID is a valid UUID
        if (!RegExp(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).test(userID)) return;
        
        // Return the ID
        return userID;
    }

    /**
     * Parses the course data and make it an acceptable return value
     * @param courseData - The course data from the database
     * @returns The course data acceptable for a return
     */
    private courseReturn(courseData: Course): CourseReturn {
        return {
            courseId: courseData.courseId,
            name: courseData.name,
            courseCode: courseData.courseCode,
            isOpen: courseData.isOpen,
            description: courseData.description ?? null,
            startDate: courseData.startDate,
            endDate: courseData.endDate ?? null,
        };
    }
}
