import { TestDataSource } from "./test-data-source.js";
import { AssignmentController } from "../Controllers/AssignmentController.js";
import { Course } from "../Database/entities/Course.js";

describe("AssignmentController test:", () => {
    let controller: AssignmentController;
    const course = new Course();

    beforeAll(async () => {
        await TestDataSource.initialize();
        controller = new AssignmentController(TestDataSource);

        // Create a role for the user to use
        await TestDataSource.getRepository("Role").save({ name: "student" });
        
        course.name = "Test Course";
        course.courseCode = "TEST101";
        course.isOpen = true;
        course.description = "This is a test course";
        course.startDate = "2025-01-01";
        course.endDate = "2025-12-31";
        await TestDataSource.getRepository(Course).save(course);
    });

    beforeEach(async () => {
        // Clear users before each test
        await TestDataSource.getRepository("Assignments").clear();
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });

    describe("Get all assignments", () => {
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
        it("Should not create an assignment with an invalid structure", async () => {});

        it("Should not create an assignment with a invalid name", async () => {});

        it("Should not create an assignment with no name", async () => {});

        it("Should not create an assignment with a invalid description", async () => {});

        it("Should not create an assignment with no description", async () => {});

        it("Should not create an assignment with a invalid due date", async () => {});

        it("Should not create an assignment with no due date", async () => {});

        it("Should not create an assignment with a past due date", async () => {});

        it("Should not create an assignment with a invalid class ID", async () => {});

        it("Should not create an assignment with no class ID", async () => {});

        it("Should create an assignment with valid data", async () => {});
    });

    describe("Getting an assignment", () => {
        it("Should not get an assignment with an invalid ID", async () => {});

        it("Should not get an assignment with a non-existent ID", async () => {});

        it("Should get an assignment with a valid ID", async () => {});
    });

    describe("Updating an assignment", () => {
        it("Should not update an assignment with an invalid ID", async () => {});

        it("Should not update an assignment with a non-existent ID", async () => {});

        it("Should not update an assignment with a invalid structure", async () => {});

        it("Should not update an assignment with a invalid name", async () => {});

        it("Should not update an assignment with a invalid description", async () => {});

        it("Should not update an assignment with a invalid due date", async () => {});

        it("Should not update an assignment with a past due date", async () => {});

        it("Should update an assignment with valid data", async () => {});
    });

    describe("Deleting an assignment", () => {
        it("Should not delete an assignment with an invalid ID", async () => {});

        it("Should not delete an assignment with a non-existent ID", async () => {});

        it("Should delete an assignment with a valid ID", async () => {});
    });

    describe("Getting submissions for an assignment", () => {
        it("Should not get submissions with an invalid assignment ID", async () => {});

        it("Should not get submissions with a non-existent assignment ID", async () => {});

        it("Should get submissions when no submissions exist", async () => {});

        it("Should get submissions when multiple submissions exist", async () => {});
    });

    describe("Creating a submission for an assignment", () => {
        it("Should not create a submission with an invalid assignment ID", async () => {});

        it("Should not create a submission with a non-existent assignment ID", async () => {});

        it("Should not create a submission with an invalid timeSubmitted", async () => {});

        it("Should not create a submission with no timeSubmitted", async () => {});

        it("Should create a submission with valid data", async () => {});

        // Not needed in MVP
        // it("Should create multiple submissions for the same assignment from different users", async () => {});

        // it("Should create submissions for the same user until max is reached on an assignment", async () => {});

        // it("Should not create submissions for the same user after max is reached on an assignment", async () => {});
    });
});
