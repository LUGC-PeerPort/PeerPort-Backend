import type { DataSource, Repository } from "typeorm";
import type { Request, Response } from "express";
import { Course } from "../Database/entities/Course.js";
import { User } from "../Database/entities/User.js";
import { UsersToCourses } from "../Database/entities/UsersToCourses.js";
import { Assignments } from "../Database/entities/Assignments.js";
import type { AssignmentReturnWithoutCourseId } from "./AssignmentController.js";
import { checkIfUserRelatedToCourse, checkUUID } from "./Tools.js";
import { Content } from "../Database/entities/Content.js";
import { formatContentListToTree } from "./ContentController.js";
import type { Session } from "express-session";

export interface CourseReturn {
    courseId: string;
    name: string;
    courseCode: string;
    isOpen: boolean;
    description: string | undefined;
    startDate: Date | string;
    endDate: Date | string | undefined;
};



/**
 * The controller for handling course-related operations
 */
export class CourseController {
    private courseRepo: Repository<Course>;
    private userRepo: Repository<User>;
    private usersToCoursesRepo: Repository<UsersToCourses>;
    private assignmentsRepo: Repository<Assignments>;
    private contentRepo: Repository<Content>;

    /**
     * Create an instance of the CourseController
     * @param appDataSource - The TypeORM DataSource
     */
    constructor(appDataSource: DataSource) {
        this.courseRepo = appDataSource.getRepository(Course);
        this.userRepo = appDataSource.getRepository(User);
        this.usersToCoursesRepo = appDataSource.getRepository(UsersToCourses);
        this.assignmentsRepo = appDataSource.getRepository(Assignments);
        this.contentRepo = appDataSource.getRepository(Content);
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
        const session = (req as Request & { session?: Session & { passport?: { user: string } } }).session;
        /* istanbul ignore next */
        if (!session || session.passport === undefined || session.passport.user === undefined) {
            res.status(401).json({ message: "Unauthorized: User not logged in." });
            return;
        }
        const userId = session.passport.user;
        const courseStructure = courseUnknown as Course;

        // Check dates
        const startDate = courseStructure.startDate;
        const endDate = courseStructure.endDate ?? null;
        if (!this.checkDates(startDate, endDate)) {
            res.status(400).json({ message: "Invalid dates" });
            return;
        }
        
        // Check if the user exists
        const user = await this.userRepo.findOne({where: { userId: userId }, relations: ["role"] });
        /* istanbul ignore next */
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Check if the user is a teacher or admin
        /* istanbul ignore next */
        if (user.role.name !== "teacher" && user.role.name !== "admin") {
            res.status(403).json({ message: "Forbidden: User does not have permission to create a course." });
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
        if (!checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Get the course from the database
        const course = await this.courseRepo.findOneBy({ courseId: courseId });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Check if the user is related to the course
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToCourse(req, res, this.userRepo, this.usersToCoursesRepo)) {
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
        if (!checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Check if course exists
        const course = await this.courseRepo.findOneBy({ courseId: courseId });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Check if the user is related to the course
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToCourse(req, res, this.userRepo, this.usersToCoursesRepo)) {
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
        if (!checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Check if the course exists
        const course = await this.courseRepo.findOneBy({ courseId: courseId });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Check if the user is related to the course
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToCourse(req, res, this.userRepo, this.usersToCoursesRepo)) {
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
        if (!checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }
        
        // Check if course exists
        const course = await this.courseRepo.findOneBy({ courseId: courseId });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Check if the user assigning the enrollment is related to the course
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToCourse(req, res, this.userRepo, this.usersToCoursesRepo)) {
            return;
        }

        // Check user ID
        const userId = req.params.userId;
        if (!checkUUID(userId)) {
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

    // /api/v1/courses/:courseId/assignments
    /**
     * Retrieves all assignments for a specific course
     * @param req - The Request object
     * @param res - The Response object
     * @returns A list of assignments for the course
     */
    async getCourseAssignments(req: Request, res: Response): Promise<void> {
        // Check course ID
        const courseId = req.params.courseId;
        if (!checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Check if course exists
        const course = await this.courseRepo.findOneBy({ courseId: courseId });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Check if the user is related to the course
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToCourse(req, res, this.userRepo, this.usersToCoursesRepo)) {
            return;
        }

        // Get assignments
        const assignments = await this.assignmentsRepo.find({
            where: { course: { courseId: courseId } },
        });

        // Parse assignments
        const assignmentReturns = assignments.map(assignment => this.assignmentReturn(assignment));
        res.status(200).json(assignmentReturns);
    }

    // /api/v1/courses/:courseId/content
    /**
     * Gets all the content for a specific course
     * @param req - The request object
     * @param res - The response object
     * @returns The content for the course
     */
    async getCourseContentForACourse(req: Request, res: Response): Promise<void> {
        // Check course ID
        const courseIdUnknown = req.params?.courseId as unknown;
        if (!checkUUID(courseIdUnknown)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }
        const courseId = courseIdUnknown as string;

        // Check if course exists
        const course = await this.courseRepo.findOneBy({ courseId: courseId });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Check if the user is related to the course
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToCourse(req, res, this.userRepo, this.usersToCoursesRepo)) {
            return;
        }

        // Get content
        const contentItems = await this.contentRepo.find({where: { course: { courseId: courseId } }, relations: ["parent", "course"] });

        // Make any content that has a parentId, into a subContent of that content
        const contentItemsList = formatContentListToTree(contentItems);

        // Return content
        res.status(200).json(contentItemsList);
    }

    // /api/v1/courses/:courseId/classList
    /**
     * Retrieves the classlist for a specific course
     * @param req - The request object
     * @param res - The response object
     * @returns The classlist for a course
     */
    async getCourseClassList(req: Request, res: Response): Promise<void> {
        // Check course ID
        const courseId = req.params.courseId;
        if (!checkUUID(courseId)) {
            res.status(400).json({ message: "Invalid course ID" });
            return;
        }

        // Check if course exists
        const course = await this.courseRepo.findOneBy({ courseId: courseId });
        if (!course) {
            res.status(404).json({ message: "Course not found" });
            return;
        }

        // Check if the user is related to the course
        /* istanbul ignore next */
        if (!await checkIfUserRelatedToCourse(req, res, this.userRepo, this.usersToCoursesRepo)) {
            return;
        }

        // Get all users related to the course
        const users = await this.usersToCoursesRepo.find({  where: { course: { courseId: courseId } }, relations: ["user", "user.role"] });
        const classList = users.map(link => {
            return {
                userId: link.user.userId,
                name: link.user.name,
                email: link.user.email,
                profilePictureUrl: link.user.profilePictureUrl,
                idNumber: link.user.idNumber,
                role: link.user.role.name,
            };
        });
        res.status(200).json(classList);
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
    private checkCourseStructure(course: unknown, _creation?: boolean, _updating?: boolean): boolean {
        if (typeof course !== "object" || course === null) return false;

        // Set default values for optional parameters
        _creation = _creation ?? false;
        _updating = _updating ?? false;

        // Check if the course has any extra keys
        const courseKeys = ["name", "courseCode", "isOpen", "description", "startDate", "endDate"];
        for (const key of Object.keys(course)) {
            if (!courseKeys.includes(key)) return false;
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
     * Used to check 2 dates against each other to see if one is before the other
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
            description: courseData.description ?? undefined,
            startDate: courseData.startDate,
            endDate: courseData.endDate ?? undefined,
        };
    }

    /**
     * Parses the assignment data and make it an acceptable return value
     * @param assignmentData - The assignment data from the database
     * @returns The assignment data acceptable for a return
     */
    private assignmentReturn(assignmentData: Assignments): AssignmentReturnWithoutCourseId {
        return {
            assignmentId: assignmentData.assignmentId,
            name: assignmentData.name,
            description: assignmentData.description,
            dueDate: assignmentData.dueDate,
        };
    }
}
