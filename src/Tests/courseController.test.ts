import { TestDataSource } from "./test-data-source.js";
import { CourseController } from "../Controllers/CourseController.js";
import { start } from "repl";

describe("CourseController test:", () => {
    let controller: CourseController;

    beforeAll(async () => {
        await TestDataSource.initialize();
        controller = new CourseController(TestDataSource);

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
            expect(res.json).toHaveBeenCalledWith([ course ]);
        });
    });
});