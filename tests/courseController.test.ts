import { TestDataSource } from "./test-data-source.js";
import { CourseController } from "../src/Controllers/CourseController.js";
import { Role } from "../src/Database/entities/Role.js";

describe("CourseController test:", () => {
    let controller: CourseController;
    let role: Role;

    beforeAll(async () => {
        await TestDataSource.initialize();
        controller = new CourseController(TestDataSource);

        // Create a role for the user to use
        role = await TestDataSource.getRepository(Role).save({ name: "teacher" });
    });

    beforeEach(async () => {
        // Clear UsersToCourses, User, and Course repositories before each test
        await TestDataSource.getRepository("UsersToCourses").clear();
        await TestDataSource.getRepository("User").clear();
        await TestDataSource.getRepository("Assignments").clear();
        await TestDataSource.getRepository("Course").clear();
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });

    describe("Get all courses", () => {
        it("Should return an empty array when there are no courses", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.getAllCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it("Should return all courses", async () => {
            // Add some courses
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{
                courseId: course.courseId,
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            }]);
        });
    });

    describe("Create a course", () => {
        it("Should not create a course with invalid structure", async () => {
            const req: any = { 
                body: {
                    invalid: "data"
                } 
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course without a name", async () => {
            const req: any = { 
                body: {
                    courseCode: "tes-st01",
                    isOpen: true,
                    startDate: "2024-01-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course with an invalid name", async () => {
            const req: any = { 
                body: {
                    name: 12345,
                    courseCode: "tes-st01",
                    isOpen: true,
                    startDate: "2024-01-01",
                } 
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course without a course code", async () => {
            const req: any = { 
                body: {
                    name: "testCourse",
                    isOpen: true,
                    startDate: "2024-01-01",
                } 
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course with an invalid course code", async () => {
            const req: any = { 
                body: {
                    name: "testCourse",
                    courseCode: 12345,
                    isOpen: true,
                    startDate: "2024-01-01",
                } 
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course without the isOpen field", async () => {
            const req: any = { 
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    startDate: "2024-01-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course with an invalid isOpen field", async () => {
            const req: any = { 
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: "true",
                    startDate: "2024-01-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course without a start date", async () => {
            const req: any = { 
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course with an invalid start date", async () => {
            const req: any = { 
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    startDate: "invalid-date",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course with a invalid description", async () => {
            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    description: 12345,
                    startDate: "2024-01-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course with an invalid end date", async () => {
            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    startDate: "2024-01-01",
                    endDate: "invalid-date",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course with an end date before the start date", async () => {
            const user = await TestDataSource.getRepository("User").save({
                name: "TestUser",
                email: "test@example.com",
                password: "password",
                idNumber: "123456789",
                role: await TestDataSource.getRepository("Role").findOneBy({ name: "teacher" }),
            });

            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    startDate: "2024-01-01",
                    endDate: "2024-01-01",
                },
                session: { passport: { user: user.userId } }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid dates" });
        });

        it("Should create a course with valid data", async () => {
            const user = await TestDataSource.getRepository("User").save({
                name: "TestUser",
                email: "test@example.com",
                password: "password",
                idNumber: "123456789",
                role: role,
            });

            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    startDate: "2024-01-01",
                },
                session: { passport: { user: user.userId } }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ 
                courseId: expect.any(String),
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: null,
                startDate: "2024-01-01",
                endDate: null,
            });
        });

        it("Should create a course with a valid description", async () => {
            const user = await TestDataSource.getRepository("User").save({
                name: "TestUser",
                email: "test@example.com",
                password: "password",
                idNumber: "123456789",
                role: role,
            });
            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    description: "A test course",
                    startDate: "2024-01-01",
                },
                session: { passport: { user: user.userId } }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ 
                courseId: expect.any(String),
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: null,
            });
        });

        it("Should create a course without an end date", async () => {
            const user = await TestDataSource.getRepository("User").save({
                name: "TestUser",
                email: "test@example.com",
                password: "password",
                idNumber: "123456789",
                role: role,
            });
            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    startDate: "2024-01-01",
                },
                session: { passport: { user: user.userId } }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ 
                courseId: expect.any(String),
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: null,
                startDate: "2024-01-01",
                endDate: null,
            });
        });
    });

    describe("Get a course", () => {
        it("Should not get a course with an invalid ID", async () => {
            const req: any = {
                params: {
                    courseId: "invalid-uuid"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course ID" });
        });

        it("Should not get a course with a non-existent ID", async () => {
            const req: any = {
                params: {
                    courseId: "123e4567-e89b-12d3-a456-426614174999"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Course not found" });
        });

        it("Should get a course with a valid ID", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ ...course });
        });
    });

    describe("Update a course", () => {
        it("Should not update a course with an invalid ID", async () => {
            const req: any = {
                params: {
                    courseId: "invalid-uuid"
                },
                body: {}
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course ID" });
        });

        it("Should not update a course with a non-existent ID", async () => {
            const req: any = {
                params: {
                    courseId: "123e4567-e89b-12d3-a456-426614174999"
                },
                body: {}
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Course not found" });
        });

        it("Should not update a course with an invalid structure", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId
                },
                body: {
                    invalid: "data"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not update a course with an invalid name", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });

            const req: any = {
                params: {
                    courseId: course.courseId
                },
                body: {
                    name: 12345,
                    courseCode: "upd-st01",
                    isOpen: false,
                    description: "An updated test course",
                    startDate: "2024-02-01",
                    endDate: "2024-07-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not update a course with an invalid course code", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId
                },
                body: {
                    name: "updatedCourse",
                    courseCode: 12345,
                    isOpen: false,
                    description: "An updated test course",
                    startDate: "2024-02-01",
                    endDate: "2024-07-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not update a course with an invalid isOpen field", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId
                },
                body: {
                    name: "updatedCourse",
                    courseCode: "upd-st01",
                    isOpen: "false",
                    description: "An updated test course",
                    startDate: "2024-02-01",
                    endDate: "2024-07-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not update a course with an invalid description", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId
                },
                body: {
                    name: "updatedCourse",
                    courseCode: "upd-st01",
                    isOpen: false,
                    description: 12345,
                    startDate: "2024-02-01",
                    endDate: "2024-07-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not update a course with an invalid start date", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId
                },
                body: {
                    name: "updatedCourse",
                    courseCode: "upd-st01",
                    isOpen: false,
                    description: "An updated test course",
                    startDate: "invalid-date",
                    endDate: "2024-07-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not update a course with an invalid end date", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId
                },
                body: {
                    name: "updatedCourse",
                    courseCode: "upd-st01",
                    isOpen: false,
                    description: "An updated test course",
                    startDate: "2024-02-01",
                    endDate: "invalid-date",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not update a course with an end date before the start date", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });

            const req: any = {
                params: {
                    courseId: course.courseId
                },
                body: {
                    name: "updatedCourse",
                    courseCode: "upd-st01",
                    isOpen: false,
                    description: "An updated test course",
                    startDate: "2024-02-01",
                    endDate: "2024-01-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should update a course with no new start date or end date", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId
                },
                body: {
                    isOpen: false,
                    description: "An updated test course",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                courseId: course.courseId,
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: false,
                description: "An updated test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
        });

        it("Should update a course with no new end date", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId
                },
                body: {
                    isOpen: false,
                    description: "An updated test course",
                    startDate: "2024-02-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                courseId: course.courseId,
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: false,
                description: "An updated test course",
                startDate: "2024-02-01",
                endDate: null,
            });
        });

        it("Should update a course with no new isOpen or description", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId
                },
                body: {
                    startDate: "2024-02-01",
                    endDate: "2024-07-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                courseId: course.courseId,
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-02-01",
                endDate: "2024-07-01",
            });
        });

        it("Should update a course with a valid ID", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });

            const req: any = {
                params: {
                    courseId: course.courseId
                },
                body: {
                    isOpen: false,
                    description: "An updated test course",
                    startDate: "2024-02-01",
                    endDate: "2024-07-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                courseId: course.courseId,
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: false,
                description: "An updated test course",
                startDate: "2024-02-01",
                endDate: "2024-07-01",
            });
        });
    });

    describe("Delete a course", () => {
        it("Should not delete a course with an invalid ID", async () => {
            const req: any = {
                params: {
                    courseId: "invalid-uuid"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course ID" });
        });

        it("Should not delete a course with a non-existent ID", async () => {
            const req: any = {
                params: {
                    courseId: "123e4567-e89b-12d3-a456-426614174999"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Course not found" });
        });

        it("Should delete a course with a valid ID", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.json).toHaveBeenCalledWith({ message: "Course deleted" });
        });

        // Add tests to make sure when a course is deleted
        // all the related assignments, user connections, etc
        // are also deleted
    });

    describe("Enroll a user in a course", () => {
        it("Should not enroll a user with an invalid course ID", async () => {
            const req: any = {
                params: {
                    courseId: "invalid-uuid"
                },
                body: {
                    userId: "123e4567-e89b-12d3-a456-426614174000"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.enrollUserInCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course ID" });
        });

        it("Should not enroll a user with a non-existent course ID", async () => {
            const req: any = {
                params: {
                    courseId: "123e4567-e89b-12d3-a456-426614174999"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.enrollUserInCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Course not found" });
        });

        it("Should not enroll a user with an invalid user ID", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId,
                    userId: "invalid-uuid"
                },
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.enrollUserInCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
        });

        it("Should not enroll a user with a non-existent user ID", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const req: any = {
                params: {
                    courseId: course.courseId,
                    userId: "123e4567-e89b-12d3-a456-426614174999"
                },
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.enrollUserInCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it("Should enroll a user with valid IDs", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const user = await TestDataSource.getRepository("User").save({
                name: "TestUser",
                email: "testuser@example.com",
                password: "password",
                idNumber: "987654321",
                role: await TestDataSource.getRepository("Role").findOneBy({ name: "student" }),
            });
            const req: any = {
                params: {
                    courseId: course.courseId,
                    userId: user.userId
                },
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.enrollUserInCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ message: "User enrolled in course" });
        });

        it("Should not enroll a user in a course they are already enrolled in", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const user = await TestDataSource.getRepository("User").save({
                name: "TestUser",
                email: "testuser@example.com",
                password: "password",
                idNumber: "987654321",
                role: await TestDataSource.getRepository("Role").findOneBy({ name: "student" }),
            });
            await TestDataSource.getRepository("UsersToCourses").save({
                user: user,
                course: course,
            });
            const req: any = {
                params: {
                    courseId: course.courseId,
                    userId: user.userId
                },
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.enrollUserInCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: "User is already enrolled in this course" });
        });
    });

    describe("Get assignments for a course", () => {
        it("Should not get assignments with no course ID", async () => {
            const req: any = {
                params: {}
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourseAssignments(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course ID" });
        });

        it("Should not get assignments with an invalid course ID", async () => {
            const req: any = {
                params: {
                    courseId: "invalid-uuid"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourseAssignments(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course ID" });
        });

        it("Should not get assignments with a non-existent course ID", async () => {
            const req: any = {
                params: {
                    courseId: "123e4567-e89b-12d3-a456-426614174999"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourseAssignments(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Course not found" });
        });

        it("Should get assignments with a valid course ID", async () => {
            const course = await TestDataSource.getRepository("Course").save({
                name: "testCourse",
                courseCode: "tes-st01",
                isOpen: true,
                description: "A test course",
                startDate: "2024-01-01",
                endDate: "2024-06-01",
            });
            const assignment1 = await TestDataSource.getRepository("Assignments").save({
                name: "Assignment 1",
                description: "First assignment",
                dueDate: "2024-02-01",
                course: course,
            });
            const assignment2 = await TestDataSource.getRepository("Assignments").save({
                name: "Assignment 2",
                description: "Second assignment",
                dueDate: "2024-03-01",
                course: course,
            });

            const req: any = {
                params: {
                    courseId: course.courseId
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourseAssignments(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                {
                    assignmentId: assignment1.assignmentId,
                    name: assignment1.name,
                    description: assignment1.description,
                    dueDate: assignment1.dueDate,
                },
                {
                    assignmentId: assignment2.assignmentId,
                    name: assignment2.name,
                    description: assignment2.description,
                    dueDate: assignment2.dueDate,
                }
            ]);
        });
    });

    describe("Get content for a course", () => {
        it.each([
            { name: "fail when no courseId is provided",    courseId: undefined,                                status: 400, returnValue: { message: "Invalid course ID" } },
            { name: "fail when courseId is empty",          courseId: "  ",                                     status: 400, returnValue: { message: "Invalid course ID" } },
            { name: "fail when courseId is a number",       courseId: 123,                                      status: 400, returnValue: { message: "Invalid course ID" } },
            { name: "fail when courseId is invalid",        courseId: "invalid-id",                             status: 400, returnValue: { message: "Invalid course ID" } },
            { name: "fail when courseId is doesn't exist",  courseId: "123e4567-e89b-12d3-a456-426614174999",   status: 404, returnValue: { message: "Course not found" } },

            { name: "pass when courseId is valid",          courseId: async (): Promise<string> => {
                const course = await TestDataSource.getRepository("Course").save({
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    description: "A test course",
                    startDate: "3000-01-01",
                    endDate: "3000-06-01",
                });
                return course.courseId;
            }, status: 200, returnValue: [] }
        ])("should $name", async ({name: _name, courseId, status, returnValue}) => {
            if (typeof courseId === "function") {
                courseId = await courseId();
            }
            const req: any = { params: {courseId: courseId}};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.getCourseContentForACourse(req, res);

            expect(res.status).toHaveBeenCalledWith(status);
            expect(res.json).toHaveBeenCalledWith(returnValue);
        });
    });

    describe("checkCourseStructure function testing", () =>{
        it.each([
            {name: "Fails if courseData is null", courseData: null, creation: false, updating: false, expected: false},
            {name: "Fails if courseData is string", courseData: "invalid", creation: false, updating: false, expected: false},
            {name: "Fails if courseData is a number", courseData: 123, creation: false, updating: false, expected: false},
            {name: "Fails if extra key in courseData", courseData: { extraKey: "value" }, creation: false, updating: false, expected: false},

            // Creation mode specific failures
            { name: "Creation fails when missing name", courseData: { courseCode: "cc", isOpen: true, startDate: "2024-01-01" }, creation: true, updating: false, expected: false },
            { name: "Creation fails when name empty", courseData: { name: "", courseCode: "cc", isOpen: true, startDate: "2024-01-01" }, creation: true, updating: false, expected: false },
            { name: "Creation fails when missing courseCode", courseData: { name: "C", isOpen: true, startDate: "2024-01-01" }, creation: true, updating: false, expected: false },
            { name: "Creation fails when courseCode empty", courseData: { name: "C", courseCode: "", isOpen: true, startDate: "2024-01-01" }, creation: true, updating: false, expected: false },
            { name: "Creation fails when missing isOpen", courseData: { name: "C", courseCode: "cc", startDate: "2024-01-01" }, creation: true, updating: false, expected: false },
            { name: "Creation fails when isOpen wrong type", courseData: { name: "C", courseCode: "cc", isOpen: "true", startDate: "2024-01-01" }, creation: true, updating: false, expected: false },
            { name: "Creation fails when missing startDate", courseData: { name: "C", courseCode: "cc", isOpen: true }, creation: true, updating: false, expected: false },
            { name: "Creation fails when invalid startDate", courseData: { name: "C", courseCode: "cc", isOpen: true, startDate: "not-a-date" }, creation: true, updating: false, expected: false },
            { name: "Creation fails when endDate not string", courseData: { name: "C", courseCode: "cc", isOpen: true, startDate: "2024-01-01", endDate: 123 }, creation: true, updating: false, expected: false },
            { name: "Creation fails when endDate not valid", courseData: { name: "C", courseCode: "cc", isOpen: true, startDate: "2024-01-01", endDate: "not-a-date" }, creation: true, updating: false, expected: false },
            { name: "Creation fails when description empty string", courseData: { name: "C", courseCode: "cc", isOpen: true, description: "", startDate: "2024-01-01" }, creation: true, updating: false, expected: false },
            { name: "Creation passes with minimal valid fields", courseData: { name: "C", courseCode: "cc", isOpen: true, startDate: "2024-01-01" }, creation: true, updating: false, expected: true },

            // Updating mode specific checks
            { name: "Updating fails when no fields provided", courseData: {}, creation: false, updating: true, expected: false },
            { name: "Updating fails when startDate not string", courseData: { startDate: 123 }, creation: false, updating: true, expected: false },
            { name: "Updating fails when startDate not valid", courseData: { startDate: "not-a-date" }, creation: false, updating: true, expected: false },
            { name: "Updating fails when endDate not string", courseData: { endDate: 123 }, creation: false, updating: true, expected: false },
            { name: "Updating fails when endDate not valid", courseData: { endDate: "not-a-date" }, creation: false, updating: true, expected: false },
            { name: "Updating fails when isOpen not boolean", courseData: { isOpen: "true" }, creation: false, updating: true, expected: false },
            { name: "Updating passes when only isOpen provided", courseData: { isOpen: false }, creation: false, updating: true, expected: true },
            { name: "Updating passes when only description provided", courseData: { description: "updated" }, creation: false, updating: true, expected: true },
            { name: "Updating fails when name provided but wrong type", courseData: { name: 123 }, creation: false, updating: true, expected: false },
            { name: "Updating fails when endDate provided but invalid", courseData: { endDate: "not-a-date" }, creation: false, updating: true, expected: false },
            { name: "Updating passes when startDate provided and valid", courseData: { startDate: "2024-05-01" }, creation: false, updating: true, expected: true },
            { name: "Updating passes when endDate provided and valid", courseData: { endDate: "2024-08-01" }, creation: false, updating: true, expected: true },

        ])("$name", async ({ name: _name, courseData, creation, updating, expected }) => {
            const result = controller["checkCourseStructure"](courseData, creation, updating);
            expect(result).toBe(expected);
        });
    });

    describe("checkDates function tests", () => {
        it.each([
            { name: "endDate null => true", start: "2024-01-01", end: null, expected: true },
            { name: "endDate after start => true", start: "2024-01-01", end: "2024-02-01", expected: true },
            { name: "endDate equal to start => false", start: "2024-01-01", end: "2024-01-01", expected: false },
            { name: "endDate before start => false", start: "2024-02-01", end: "2024-01-01", expected: false },
        ])("$name", ({ start, end, expected }) => {
            const result = controller["checkDates"](start, end as string | null);
            expect(result).toBe(expected);
        });
    });

    describe("courseReturn function tests", () => {
        it.each([
            {
                name: "missing optional fields => nulls",
                course: {
                    courseId: "cid-1",
                    name: "Course 1",
                    courseCode: "C101",
                    isOpen: true,
                    startDate: "2024-01-01",
                },
                expected: {
                    courseId: "cid-1",
                    name: "Course 1",
                    courseCode: "C101",
                    isOpen: true,
                    description: null,
                    startDate: "2024-01-01",
                    endDate: null,
                }
            },
            {
                name: "optional fields present => preserved",
                course: {
                    courseId: "cid-2",
                    name: "Course 2",
                    courseCode: "C102",
                    isOpen: false,
                    description: "A description",
                    startDate: "2024-03-01",
                    endDate: "2024-06-01",
                },
                expected: {
                    courseId: "cid-2",
                    name: "Course 2",
                    courseCode: "C102",
                    isOpen: false,
                    description: "A description",
                    startDate: "2024-03-01",
                    endDate: "2024-06-01",
                }
            }
        ])("$name", ({ course, expected }) => {
            const result = controller["courseReturn"](course as any);
            expect(result).toEqual(expected);
        });
    });
});
