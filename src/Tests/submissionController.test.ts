import { TestDataSource } from "./test-data-source.js";
import { SubmissionController } from "../Controllers/SubmissionController.js";
import type { Course } from "../Database/entities/Course.js";
import type { User } from "../Database/entities/User.js";
import type { Assignments } from "../Database/entities/Assignments.js";

describe("SubmissionController test:", () => {
    let controller: SubmissionController;
    let course: Course;
    let user: User;
    let assignment: Assignments;

    beforeAll(async () => {
        await TestDataSource.initialize();
        controller = new SubmissionController(TestDataSource);

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

        // Create an assignment for the submissions to use
        const assignmentData = {
            name: "Test Assignment",
            description: "This is a test assignment",
            dueDate: "2025-06-01",
            course: course,
        };
        assignment = await TestDataSource.getRepository("Assignments").save(assignmentData) as any;

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
        await TestDataSource.getRepository("Assignments").clear();
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });

    let getAllSubmissionsImplemented: boolean;
    describe("Get all submissions", () => {
        beforeAll(async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllSubmissions(req, res);
            if (res.status.mock.calls[0][0] === 501) {
                getAllSubmissionsImplemented = false;
            } else {
                getAllSubmissionsImplemented = true;
            }
        });
        it("Should have implemented the method getAllSubmissions", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllSubmissions(req, res);
            expect(res.status).not.toHaveBeenCalledWith(501);
        });
        (getAllSubmissionsImplemented ? it : it.skip)("Should return an empty array when there are no submissions", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllSubmissions(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        (getAllSubmissionsImplemented ? it : it.skip)("Should return a single submission when it exists", async () => {
            const submission = TestDataSource.getRepository("AssignmentSubmissions").create({
                comment: "This is a test submission",
                timeSubmitted: new Date().toISOString(),
                user: user,
                assignment: assignment,
            });
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllSubmissions(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{
                comment: submission.comment,
                timeSubmitted: submission.timeSubmitted,
                userId: user.userId,
                assignmentId: assignment.assignmentId,
                submissionId: submission.assignmentSubmissionId,
            }]);
        });

        (getAllSubmissionsImplemented ? it : it.skip)("Should return multiple submissions when they exist", async () => {
            const submission1 = TestDataSource.getRepository("AssignmentSubmissions").create({
                comment: "This is the first test submission",
                timeSubmitted: new Date().toISOString(),
                user: user,
                assignment: assignment,
            });
            const submission2 = TestDataSource.getRepository("AssignmentSubmissions").create({
                comment: "This is the second test submission",
                timeSubmitted: new Date().toISOString(),
                user: user,
                assignment: assignment,
            });
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllSubmissions(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                {
                    comment: submission1.comment,
                    timeSubmitted: submission1.timeSubmitted,
                    userId: user.userId,
                    assignmentId: assignment.assignmentId,
                    submissionId: submission1.assignmentSubmissionId,
                },
                {
                    comment: submission2.comment,
                    timeSubmitted: submission2.timeSubmitted,
                    userId: user.userId,
                    assignmentId: assignment.assignmentId,
                    submissionId: submission2.assignmentSubmissionId,
                }
            ]);
        });
    });

    let getSubmissionByIdImplemented: boolean;
    describe("Get a submission by ID", () => {
        beforeAll(async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getSubmission(req, res);
            if (res.status.mock.calls[0][0] === 501) {
                getSubmissionByIdImplemented = false;
            } else {
                getSubmissionByIdImplemented = true;
            }
        });
        it("Should have implemented the method getSubmission", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getSubmission(req, res);
            expect(res.status).not.toHaveBeenCalledWith(501);
        });
        (getSubmissionByIdImplemented ? it : it.skip)("Should not get a submission with an invalid ID", async () => {
            const req: any = {
                params: {
                    submissionId: "invalid-uuid",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });

        (getSubmissionByIdImplemented ? it : it.skip)("Should not get a submission with a non-existent ID", async () => {
            const req: any = {
                params: {
                    submissionId: "123e4567-e89b-12d3-a456-426614174999",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });

        (getSubmissionByIdImplemented ? it : it.skip)("Should get a submission with a valid ID", async () => {
            const submission = TestDataSource.getRepository("AssignmentSubmissions").create({
                comment: "This is a test submission",
                timeSubmitted: new Date().toISOString(),
                user: user,
                assignment: assignment,
            });
            const req: any = {
                params: {
                    submissionId: submission.assignmentSubmissionId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                comment: submission.comment,
                timeSubmitted: submission.timeSubmitted,
                userId: user.userId,
                assignmentId: assignment.assignmentId,
                submissionId: submission.assignmentSubmissionId,
            });
        });
    });

    let deleteSubmissionImplemented: boolean;
    describe("Delete a submission", () => {
        beforeAll(async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteSubmission(req, res);
            if (res.status.mock.calls[0][0] === 501) {
                deleteSubmissionImplemented = false;
            } else {
                deleteSubmissionImplemented = true;
            }
        });
        it("Should have implemented the method deleteSubmission", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteSubmission(req, res);
            expect(res.status).not.toHaveBeenCalledWith(501);
        });
        (deleteSubmissionImplemented ? it : it.skip)("Should not delete a submission with an invalid ID", async () => {
            const req: any = {
                params: {
                    submissionId: "invalid-uuid",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });

        (deleteSubmissionImplemented ? it : it.skip)("Should not delete a submission with a non-existent ID", async () => {
            const req: any = {
                params: {
                    submissionId: "123e4567-e89b-12d3-a456-426614174999",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });

        (deleteSubmissionImplemented ? it : it.skip)("Should delete a submission with a valid ID", async () => {
            const submission = TestDataSource.getRepository("AssignmentSubmissions").create({
                comment: "This is a test submission",
                timeSubmitted: new Date().toISOString(),
                user: user,
                assignment: assignment,
            });
            const req: any = {
                params: {
                    submissionId: submission.assignmentSubmissionId,
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteSubmission(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
        });
    });
});
