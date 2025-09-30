import { TestDataSource } from "./test-data-source.js";
import { SubmissionController } from "../Controllers/SubmissionController.js";
import { Course } from "../Database/entities/Course.js";
import { User } from "../Database/entities/User.js";
import { Assignments } from "../Database/entities/Assignments.js";

describe("SubmissionController test:", () => {
    let controller: SubmissionController;
    const course = new Course();
    const user = new User();
    const assignment = new Assignments();

    beforeAll(async () => {
        await TestDataSource.initialize();
        controller = new SubmissionController(TestDataSource);

        // Create a course for the assignments to use
        course.name = "Test Course";
        course.courseCode = "TEST101";
        course.isOpen = true;
        course.description = "This is a test course";
        course.startDate = "2025-01-01";
        course.endDate = "2025-12-31";
        await TestDataSource.getRepository(Course).save(course);

        // Create an assignment for the submissions to use
        assignment.name = "Test Assignment";
        assignment.description = "This is a test assignment";
        assignment.dueDate = "2025-06-01";
        assignment.course = course;
        await TestDataSource.getRepository(Assignments).save(assignment);

        // Create a role for the user to use
        await TestDataSource.getRepository("Role").save({ name: "student" });

        // Create a user for the submissions to use
        user.name = "Test User";
        user.email = "testuser@example.com";
        user.password = "password";
        user.idNumber = "123456";
        user.role = await TestDataSource.getRepository("Role").findOneBy({ name: "student" }) as any;
        await TestDataSource.getRepository(User).save(user);
    });

    beforeEach(async () => {
        // Clear users before each test
        await TestDataSource.getRepository("Assignments").clear();
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });

    describe("Get all submissions", () => {
        it("Should return an empty array when there are no submissions", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllSubmissions(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it("Should return a single submission when it exists", async () => {
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

        it("Should return multiple submissions when they exist", async () => {
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

    describe("Get a submission by ID", () => {
        it("Should not get a submission with an invalid ID", async () => {
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

        it("Should not get a submission with a non-existent ID", async () => {
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

        it("Should get a submission with a valid ID", async () => {
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

    describe("Delete a submission", () => {
        it("Should not delete a submission with an invalid ID", async () => {
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

        it("Should not delete a submission with a non-existent ID", async () => {
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

        it("Should delete a submission with a valid ID", async () => {
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
