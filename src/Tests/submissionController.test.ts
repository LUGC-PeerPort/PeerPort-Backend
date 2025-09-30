import { TestDataSource } from "./test-data-source.js";
import { SubmissionController } from "../Controllers/SubmissionController.js";

describe("SubmissionController test:", () => {
    let controller: SubmissionController;

    beforeAll(async () => {
        await TestDataSource.initialize();
        controller = new SubmissionController(TestDataSource);

        // Create a role for the user to use
        await TestDataSource.getRepository("Role").save({ name: "student" });
    });

    beforeEach(async () => {
        // Clear users before each test
        await TestDataSource.getRepository("UsersToCourses").clear();
        await TestDataSource.getRepository("User").clear();
        await TestDataSource.getRepository("Course").clear();
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });
});
