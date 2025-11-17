import { TestDataSource } from "./test-data-source.js";
import { AssignmentController } from "../src/Controllers/AssignmentController.js";
import type { Course } from "../src/Database/entities/Course.js";
import type { User } from "../src/Database/entities/User.js";

describe("AssignmentController test:", () => {
    let controller: AssignmentController;
    let course: Course;
    let user: User;

    beforeAll(async () => {
        await TestDataSource.initialize();
        controller = new AssignmentController(TestDataSource);

        // Create a course for the assignments to use
        const courseData = {
            name: "Test Course",
            courseCode: "TEST101",
            isOpen: true,
            description: "This is a test course",
            startDate: "2025-01-01",
            endDate: "2025-12-31",
        };
        course = await TestDataSource.getRepository("Course").save(courseData) as any;

        // Create a role for the user to use
        await TestDataSource.getRepository("Role").save({ name: "student" });

        // Create a user for the submissions to use
        const userData = {
            name: "Test User",
            email: "testuser@example.com",
            password: "password",
            idNumber: "123456",
            role: await TestDataSource.getRepository("Role").findOneBy({ name: "student" }),
        };
        user = await TestDataSource.getRepository("User").save(userData) as any;
    });

    beforeEach(async () => {
        // Clear assignments before each test
        await TestDataSource.getRepository("AssignmentSubmissions").clear();
        await TestDataSource.getRepository("Assignments").clear();
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });

    describe("Get all assignments", () => {
        it("Should have implemented the method getAllAssignments", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllAssignments(req, res);
            
            expect(res.status).not.toHaveBeenCalledWith(501);
        });

        it("Should return an empty array when there are no assignments", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllAssignments(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it("Should return one assignment when there is one assignment", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });

            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllAssignments(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([assignment]);
        });

        it("Should return multiple assignments when there are multiple assignments", async () => {
            const assignment1 = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const assignment2 = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment 2",
                description: "This is another test assignment",
                dueDate: "2025-07-01",
                course: course,
            });

            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllAssignments(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([assignment1, assignment2]);
        });
    });

    describe("Creating a new assignment", () => {
        it("Should have implemented the method createAssignment", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);
            expect(res.status).not.toHaveBeenCalledWith(501);
        });

        it("Should not create an assignment with an invalid structure", async () => {
            const req: any = {
                body: {
                    smth: "invalid"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not create an assignment with an empty structure", async () => {
            const req: any = {
                body: {}
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not create an assignment with a invalid name", async () => {
            const req: any = {
                body: {
                    name: 123,
                    description: "This is a test assignment",
                    dueDate: "2025-06-01",
                    courseId: course.courseId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not create an assignment with an empty name", async () => {
            const req: any = {
                body: {
                    name: "   ",
                    description: "This is a test assignment",
                    dueDate: "2025-06-01",
                    courseId: course.courseId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not create an assignment with no name", async () => {
            const req: any = {
                body: {
                    description: "This is a test assignment",
                    dueDate: "2025-06-01",
                    courseId: course.courseId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not create an assignment with a invalid description", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    description: 123,
                    dueDate: "2025-06-01",
                    courseId: course.courseId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not create an assignment with no description", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    dueDate: "2025-06-01",
                    courseId: course.courseId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not create an assignment with an empty description", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    description: "   ",
                    dueDate: "2025-06-01",
                    courseId: course.courseId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not create an assignment with a invalid due date", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    description: "This is a test assignment",
                    dueDate: 123,
                    courseId: course.courseId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not create an assignment with no due date", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    description: "This is a test assignment",
                    courseId: course.courseId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not create an assignment with a past due date", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    description: "This is a test assignment",
                    dueDate: "2020-06-01",
                    courseId: course.courseId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid due date" });
        });

        it("Should not create an assignment with a wrong due date", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    description: "This is a test assignment",
                    dueDate: "not-a-date",
                    courseId: course.courseId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not create an assignment with a invalid class ID", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    description: "This is a test assignment",
                    dueDate: "2025-06-01",
                    courseId: 123,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course ID" });
        });

        it("Should not create an assignment with no class ID", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    description: "This is a test assignment",
                    dueDate: "2025-06-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course ID" });
        });

        it("Should not create an assignment with a non-existent class ID", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    description: "This is a test assignment",
                    dueDate: "2025-06-01",
                    courseId: "123e4567-e89b-12d3-a456-426614174000",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Course not found" });
        });

        it("Should not create an assignment with an empty class ID", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    description: "This is a test assignment",
                    dueDate: "2025-06-01",
                    courseId: "   ",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course ID" });
        });

        it("Should not create an assignment with an incomplete class ID", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    description: "This is a test assignment",
                    dueDate: "2025-06-01",
                    courseId: "123e4567-e89b-12d3-42661417",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course ID" });
        });

        it("Should create an assignment with valid data", async () => {
            const req: any = {
                body: {
                    name: "Test Assignment",
                    description: "This is a test assignment",
                    dueDate: "3030-01-01",
                    courseId: course.courseId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                assignmentId: expect.any(String),
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "3030-01-01",
                courseId: course.courseId,
            });
        });
    });

    describe("Getting an assignment", () => {
        it("Should have implemented the method getAssignment", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAssignment(req, res);

            expect(res.status).not.toHaveBeenCalledWith(501);
        });

        it("Should not get an assignment with an invalid ID", async () => {
            const req: any = {
                params: {
                    assignmentId: 123,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment ID" });
        });

        it("Should not get an assignment with a non-existent ID", async () => {
            const req: any = {
                params: {
                    assignmentId: "123e4567-e89b-12d3-a456-426614174000",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Assignment not found" });
        });

        it("Should get an assignment with a valid ID", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });

            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                assignmentId: assignment.assignmentId,
                name: assignment.name,
                description: assignment.description,
                dueDate: assignment.dueDate,
                courseId: course.courseId,
            });
        });
    });

    describe("Updating an assignment", () => {
        it("Should have implemented the method updateAssignment", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateAssignment(req, res);

            expect(res.status).not.toHaveBeenCalledWith(501);
        });

        it("Should not update an assignment with an invalid ID", async () => {
            const req: any = {
                params: {
                    assignmentId: 123,
                },
                body: {
                    name: "Updated Assignment",
                    description: "This is an updated test assignment",
                    dueDate: "2025-07-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment ID" });
        });

        it("Should not update an assignment with a non-existent ID", async () => {
            const req: any = {
                params: {
                    assignmentId: "123e4567-e89b-12d3-a456-426614174000",
                },
                body: {
                    name: "Updated Assignment",
                    description: "This is an updated test assignment",
                    dueDate: "2025-07-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Assignment not found" });
        });

        it("Should not update an assignment with a invalid structure", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: { smth: "invalid" }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not update an assignment with a invalid name", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    name: 123,
                    description: "This is a test assignment",
                    dueDate: "2025-06-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not update an assignment with a invalid description", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });

            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    name: "Test Assignment",
                    description: 123,
                    dueDate: "2025-06-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not update an assignment with a invalid due date", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    name: "Test Assignment",
                    description: "This is a test assignment",
                    dueDate: 123,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment structure" });
        });

        it("Should not update an assignment with a past due date", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    name: "Test Assignment",
                    description: "This is a test assignment",
                    dueDate: "2020-06-01",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid due date" });
        });

        it("Should not update an assignment with no fields to update", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {}
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                name: assignment.name,
                description: assignment.description,
                dueDate: assignment.dueDate,
                courseId: course.courseId,
                assignmentId: assignment.assignmentId,
            });
        });

        it("Should update an assignment with valid data", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    name: "Updated Assignment",
                    description: "This is an updated test assignment",
                    dueDate: "3030-06-02",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                assignmentId: assignment.assignmentId,
                name: "Updated Assignment",
                description: "This is an updated test assignment",
                dueDate: "3030-06-02",
                courseId: course.courseId,
            });
        });
    });

    describe("Deleting an assignment", () => {
        it("Should have implemented the method deleteAssignment", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteAssignment(req, res);
            
            expect(res.status).not.toHaveBeenCalledWith(501);
        });

        it("Should not delete an assignment with an invalid ID", async () => {
            const req: any = {
                params: {
                    assignmentId: 123,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment ID" });
        });

        it("Should not delete an assignment with a non-existent ID", async () => {
            const req: any = {
                params: {
                    assignmentId: "123e4567-e89b-12d3-a456-426614174000",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Assignment not found" });
        });

        it("Should delete an assignment with a valid ID", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });

            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Assignment deleted" });
        });
    });

    describe("Getting submissions for an assignment", () => {
        it("Should have implemented the method getSubmissionsForAssignment", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getSubmissionsForAssignment(req, res);

            expect(res.status).not.toHaveBeenCalledWith(501);
        });

        it("Should not get submissions with an invalid assignment ID", async () => {
            const req: any = {
                params: {
                    assignmentId: 123,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getSubmissionsForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment ID" });
        });

        it("Should not get submissions with a non-existent assignment ID", async () => {
            const req: any = {
                params: {
                    assignmentId: "123e4567-e89b-12d3-a456-426614174000",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getSubmissionsForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Assignment not found" });
        });

        it("Should get submissions when no submissions exist", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getSubmissionsForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it("Should get submissions when multiple submissions exist", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const submission = await TestDataSource.getRepository("AssignmentSubmissions").save({
                timeSubmitted: "2025-09-01",
                comment: "This is a test submission",
                assignment: assignment,
                user: user,
            });

            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getSubmissionsForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{
                submissionId: submission.assignmentSubmissionId,
                comment: submission.comment,
                timeSubmitted: submission.timeSubmitted,
                assignmentId: assignment.assignmentId,
                userId: user.userId,
            }]);
        });
    });

    describe("Creating a submission for an assignment", () => {
        it("Should have implemented the method createSubmissionForAssignment", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);
            expect(res.status).not.toHaveBeenCalledWith(501);
        });

        it("Should not create a submission with an invalid assignment ID", async () => {
            const req: any = {
                params: {
                    assignmentId: 123,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid assignment ID" });
        });

        it("Should not create a submission with a non-existent assignment ID", async () => {
            const req: any = {
                params: {
                    assignmentId: "123e4567-e89b-12d3-a456-426614174000",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Assignment not found" });
        });

        it("Should not create a submission with no body", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid submission structure" });
        });

        it("Should not create a submission with an invalid structure", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    smth: "invalid"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid submission structure" });
        });

        it("Should not create a submission with no timeSubmitted", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    userId: user.userId,
                    comment: "This is a test submission",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid submission structure" });
        });

        it("Should not create a submission with an invalid timeSubmitted", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    timeSubmitted: 123,
                    userId: user.userId,
                    comment: "This is a test submission",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid submission structure" });
        });

        it("Should not create a submission with a wrong timeSubmitted", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    timeSubmitted: "not-a-date",
                    userId: user.userId,
                    comment: "This is a test submission",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid submission structure" });
        });

        it("Should not create a submission with no user ID", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    timeSubmitted: "2025-05-01",
                    comment: "This is a test submission",
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
        });

        it("Should not create a submission with an invalid user ID", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    timeSubmitted: "2025-05-01",
                    userId: 123,
                    comment: "This is a test submission",
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
        });

        it("Should not create a submission with a non-existent user ID", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    timeSubmitted: "2025-05-01",
                    userId: "123e4567-e89b-12d3-a456-426614174000",
                    comment: "This is a test submission",
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it("Should not create a submission with an empty comment", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    timeSubmitted: "2025-05-01",
                    userId: user.userId,
                    comment: "   ",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid submission structure" });
        });

        it("Should create a submission without a comment", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    timeSubmitted: "2025-05-01",
                    userId: user.userId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                submissionId: expect.any(String),
                comment: null,
                timeSubmitted: "2025-05-01",
                assignmentId: assignment.assignmentId,
                userId: user.userId,
            });
        });

        it("Should create a submission with valid data", async () => {
            const assignment = await TestDataSource.getRepository("Assignments").save({
                name: "Test Assignment",
                description: "This is a test assignment",
                dueDate: "2025-06-01",
                course: course,
            });
            const req: any = {
                params: {
                    assignmentId: assignment.assignmentId,
                },
                body: {
                    timeSubmitted: "2025-05-01",
                    userId: user.userId,
                    comment: "This is a test submission",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.createSubmissionForAssignment(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                submissionId: expect.any(String),
                comment: "This is a test submission",
                timeSubmitted: "2025-05-01",
                assignmentId: assignment.assignmentId,
                userId: user.userId,
            });
        });

        // Not needed in MVP
        // it("Should create multiple submissions for the same assignment from different users", async () => {});

        // it("Should create submissions for the same user until max is reached on an assignment", async () => {});

        // it("Should not create submissions for the same user after max is reached on an assignment", async () => {});
    });
});
