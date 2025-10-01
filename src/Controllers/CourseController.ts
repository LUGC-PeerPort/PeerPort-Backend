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
        if (!this.checkCourseStructure(courseUnknown, true)) {
            res.status(400).json({ message: "Invalid course structure" });
            return;
        }

        // Convert to Course type
        const userId = (courseUnknown as Course & { userId: string }).userId;
        const courseStructure = courseUnknown as Course;

        // Check dates
        const startDate = courseStructure.startDate;
        const endDate = courseStructure.endDate ?? null;
        if (!this.checkDates(startDate, endDate)) {
            res.status(400).json({ message: "Invalid course structure" });
            return;
        }

        // Check if the user ID is valid
        if (!this.checkUUID(userId)) {
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

    // /api/v1/courses/:courseId
    /**
     * Gets a course by ID
     * @param req - The Request object
     * @param res - The Response object
     */
    async getCourse(req: Request, res: Response): Promise<void> {
        // Check the course ID
        const courseId = req.params.courseId;
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

    /**
     * Updates a course by ID
     * @param req - The Request object
     * @param res - The Response object
     */
    async updateCourse(req: Request, res: Response): Promise<void> {
        // Check the course ID
        const courseId = req.params.courseId;
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
        if (!this.checkCourseStructure(courseUnknown, false, true)) {
            res.status(400).json({ message: "Invalid course structure" });
            return;
        }

        // Save the course
        const courseStructure = courseUnknown as Course;

        // Check dates
        const startDate = courseStructure.startDate ?? course.startDate;
        const endDate = courseStructure.endDate ?? course.endDate ?? null;
        if (!this.checkDates(startDate, endDate)) {
            res.status(400).json({ message: "Invalid course structure" });
            return;
        }

        course.name = courseStructure.name ?? course.name;
        course.courseCode = courseStructure.courseCode ?? course.courseCode;
        course.isOpen = courseStructure.isOpen ?? course.isOpen;
        course.description = courseStructure.description ?? course.description;
        course.startDate = courseStructure.startDate ?? course.startDate;
        course.endDate = courseStructure.endDate ?? course.endDate;

        await this.courseRepo.save(course);
        res.status(200).json(this.courseReturn(course));
    }

    /**
     * Deletes a course by ID
     * @param req - The Request object
     * @param res - The Response object
     */
    async deleteCourse(req: Request, res: Response): Promise<void> {
        // Check the course ID
        const courseId = req.params.courseId;
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

    // /api/v1/courses/:courseId/enroll/:userId
    /**
     * Enrolls a user in a course
     * @param req - The Request object
     * @param res - The Response object
     */
    async enrollUserInCourse(req: Request, res: Response): Promise<void> {
        // Check course ID
        const courseId = req.params.courseId;
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

        // Check user ID
        const userId = req.params.userId;
        if (!this.checkUUID(userId)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        // Check if user exists
        const user = await this.userRepo.findOneBy({ userId: userId });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Enroll user in course
        // Check if the user is already enrolled
        const existingEnrollment = await this.usersToCoursesRepo.findOneBy({ user: { userId: userId }, course: { courseId: courseId } });
        if (existingEnrollment) {
            res.status(409).json({ message: "User is already enrolled in this course" });
            return;
        }

        // Enroll user in course
        const userToCourse = this.usersToCoursesRepo.create({ user: user, course: course });
        await this.usersToCoursesRepo.save(userToCourse);

        // Send response
        res.status(201).json({ message: "User enrolled in course" });
    }


    // ----- TOOLS -----
    
    /**
     * Checks if the course structure is valid or not
     * @param course - The course structure to check
     * @param _creation - Whether the check is for creation or not
     * @param _updating - Whether the check is for updating or not
     * @returns Whether the structure is valid or not
     */
    // eslint-disable-next-line complexity
    private checkCourseStructure(course: unknown, _creation: boolean=false, _updating: boolean=false): boolean {
        if (typeof course !== "object" || course === null) return false;

        // Check if the course has any extra keys
        const courseKeys = ["name", "courseCode", "isOpen", "description", "startDate", "endDate"];
        for (const key of Object.keys(course)) {
            if (key !in courseKeys && !(key === "userId" && _creation)) return false;
        }

        // Make a Course object that is partial (all fields optional)
        const courseTyped = course as Partial<Course>;

        let failedFlag = false;
        let updated = false;

        // -- Required --
        if (typeof courseTyped.name === "string") {
            if (courseTyped.name.trim() === "") failedFlag = true;
            else updated = true;
        } else if (typeof courseTyped.name !== "undefined" && _updating) failedFlag = true;
        else if (!_updating) failedFlag = true;
        
        if (typeof courseTyped.courseCode === "string") {
            if (courseTyped.courseCode.trim() === "") failedFlag = true;
            else updated = true;
        } else if (typeof courseTyped.courseCode !== "undefined" && _updating) failedFlag = true;
        else if (!_updating) failedFlag = true;

        if (typeof courseTyped.isOpen === "boolean") {
            updated = true;
        } else if (typeof courseTyped.isOpen !== "undefined" && _updating) failedFlag = true;
        else if (!_updating) failedFlag = true;
        
        if (typeof courseTyped.startDate === "string") {
            if (courseTyped.startDate.trim() === "" || isNaN(Date.parse(courseTyped.startDate))) failedFlag = true;
            else updated = true;
        } else if (typeof courseTyped.startDate !== "undefined" && _updating) failedFlag = true;
        else if (!_updating) failedFlag = true;
        
        // -- Optional --
        if (typeof courseTyped.description === "string") {
            if (courseTyped.description.trim() === "") failedFlag = true;
            else updated = true;
        } else if (typeof courseTyped.description !== "undefined" && (_updating || _creation)) failedFlag = true;
    
        if (typeof courseTyped.endDate === "string") {
            if (courseTyped.endDate.trim() === "" || isNaN(Date.parse(courseTyped.endDate))) failedFlag = true;
            else updated = true;
        } else if (typeof courseTyped.endDate !== "undefined" && (_updating || _creation)) failedFlag = true;
        
        if (failedFlag) return false;
        if (_updating && !updated) return false;
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
     * Used to check 2 dates aginst each other to see if one is before the other
     * @param startDate - The start date
     * @param endDate - The end date
     * @returns Whether the dates are valid or not
     */
    private checkDates(startDate: string, endDate: string | null): boolean {
        const start = new Date(startDate);
        if (endDate === null) return true;

        const end = new Date(endDate);
        if (end <= start) {
            return false;
        }
        return true;
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
