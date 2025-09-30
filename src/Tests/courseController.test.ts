import { TestDataSource } from "./test-data-source.js";
import { CourseController } from "../Controllers/CourseController.js";

describe("CourseController test:", () => {
    let controller: CourseController;

    beforeAll(async () => {
        await TestDataSource.initialize();
        controller = new CourseController(TestDataSource);

        // Create a role for the user to use
        await TestDataSource.getRepository("Role").save({ name: "student" });
    });

    beforeEach(async () => {
        // Clear UsersToCourses, User, and Course repositories before each test
        await TestDataSource.getRepository("UsersToCourses").clear();
        await TestDataSource.getRepository("User").clear();
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
                    userId: "123e4567-e89b-12d3-a456-426614174000"
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
                    userId: "123e4567-e89b-12d3-a456-426614174000"
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
                    userId: "123e4567-e89b-12d3-a456-426614174000"
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
                    userId: "123e4567-e89b-12d3-a456-426614174000"
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
                    userId: "123e4567-e89b-12d3-a456-426614174000"
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
                    userId: "123e4567-e89b-12d3-a456-426614174000"
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
                    userId: "123e4567-e89b-12d3-a456-426614174000"
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
                    userId: "123e4567-e89b-12d3-a456-426614174000"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course without a user ID", async () => {
            const req: any = {
                body: {
                    name: "testCourse",
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
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
        });

        it("Should not create a course with an invalid user ID", async () => {
            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    startDate: "2024-01-01",
                    userId: "invalid-uuid"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should not create a course with a non-existent user ID", async () => {
            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    startDate: "2024-01-01",
                    userId: "123e4567-e89b-12d3-a456-426614174999"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it("Should not create a course with a invalid description", async () => {
            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    description: 12345,
                    startDate: "2024-01-01",
                    userId: "123e4567-e89b-12d3-a456-426614174000"
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
                    userId: "123e4567-e89b-12d3-a456-426614174000"
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
            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    startDate: "2024-01-01",
                    endDate: "2024-01-01",
                    userId: "123e4567-e89b-12d3-a456-426614174000"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course structure" });
        });

        it("Should create a course with valid data", async () => {
            const user = await TestDataSource.getRepository("User").save({
                name: "TestUser",
                email: "test@example.com",
                password: "password",
                idNumber: "123456789",
                role: await TestDataSource.getRepository("Role").findOneBy({ name: "student" }),
            });

            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    startDate: "2024-01-01",
                    userId: `${user.userId}`
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ 
                classId: expect.any(String),
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
                role: await TestDataSource.getRepository("Role").findOneBy({ name: "student" }),
            });
            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    description: "A test course",
                    startDate: "2024-01-01",
                    userId: `${user.userId}`
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ 
                classId: expect.any(String),
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
                role: await TestDataSource.getRepository("Role").findOneBy({ name: "student" }),
            });
            const req: any = {
                body: {
                    name: "testCourse",
                    courseCode: "tes-st01",
                    isOpen: true,
                    startDate: "2024-01-01",
                    userId: `${user.userId}`
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ 
                classId: expect.any(String),
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
});
