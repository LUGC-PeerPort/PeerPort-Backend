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

        // Create a course for the assignments to user
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
        it("Should return an empty array when there are no submissions", async () => {});

        it("Should return a single submission when it exists", async () => {});

        it("Should return multiple submissions when they exist", async () => {});
    });

    describe("Get a submission by ID", () => {
        it("Should not get a submission with an invalid ID", async () => {});

        it("Should not get a submission with a non-existent ID", async () => {});

        it("Should get a submission with a valid ID", async () => {});
    });

    describe("Delete a submission", () => {
        it("Should not delete a submission with an invalid ID", async () => {});

        it("Should not delete a submission with a non-existent ID", async () => {});

        it("Should delete a submission with a valid ID", async () => {});
    });
});
