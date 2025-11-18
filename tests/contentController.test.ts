import { TestDataSource } from "./test-data-source.js";
import { ContentController } from "../src/Controllers/ContentController.js";
import { Course } from "../src/Database/entities/Course.js";
import { Content } from "../src/Database/entities/Content.js"; 

describe("ContentController test:", () => {
    let controller: ContentController;
    let course: Course;
    let content: Content;

    beforeAll(async () => {
        await TestDataSource.initialize();
        controller = new ContentController(TestDataSource);

        // Create a course for the content to use
        const courseData = {
            name: "Test Course",
            courseCode: "TEST101",
            isOpen: true,
            description: "This is a test course",
            startDate: "2025-01-01",
            endDate: "2025-12-31",
        };
        course = await TestDataSource.getRepository(Course).save(courseData) as any;

        // Create a content item for testing
        content = await TestDataSource.getRepository(Content).create({
            name: "Test Content",
            description: "This is a test content",
            viewable: true,
            course: course
        });
        await TestDataSource.getRepository(Content).save(content);
    });

    beforeEach(async () => {
        // Clear content before each test
        await TestDataSource.getRepository(Content).clear();

        // Create a content item for testing
        content = await TestDataSource.getRepository(Content).save({
            name: "Test Content",
            description: "This is a test content",
            viewable: true,
            course: course
        });
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });

    describe("Getting content", () => {
        test("Getting all content should get an empty list when no content saved", async () => {

        });

        test("Getting all content should get multiple content items", async () => {
        });

        const contentId = (): string => content.contentId;
        const name = (): string => content.name;
        const description = (): string => content.description;
        const courseId = (): string => course.courseId;
        const viewable = (): boolean => content.viewable;
        test.each([
            { name: "fails when content Id is not given",           data: {},                                                                   expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id is undefined",           data: { params: { contentId: undefined } },                                 expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id is a number",            data: { params: { contentId: 123 } },                                       expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id is not a valid UUID",    data: { params: { contentId: "123-33333" } },                               expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id does not exist",         data: { params: { contentId: "123e4567-e89b-12d3-a456-426614174000" } },    expectedStatus: 404, expectedData: { message: "Content not found" } },

            { name: "succeeds when content Id is valid",            data: { params: { contentId: contentId } },                                 expectedStatus: 200, expectedData: { courseId: courseId, contentId: contentId, name: name, description: description, viewable: viewable } },
        ])("Getting specific content $name", async ({ name: _name, data, expectedStatus, expectedData }) => {
            const req: any = data;
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.getContentById(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(expectedData);
        });
    });

    describe("Creating content", () => {
        const courseId = (): string => course.courseId;
        test.each([
            { name: "fails when course Id is not given",            data: { },                                                                                                      expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when course Id is undefined",            data: { params: { courseId: undefined } },                                                                      expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when course Id is a number",             data: { params: { courseId: 123 } },                                                                            expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when course Id is not a valid UUID",     data: { params: { courseId: "123-3333" } },                                                                     expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when course Id does not exist",          data: { params: { courseId: "123e4567-e89b-12d3-a456-426614174000" } },                                         expectedStatus: 404, expectedData: { message: "Content not found" } },

            { name: "fails when name is missing",                   data: { body: {  }, params: { courseId: courseId } },                                                           expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when name is empty",                     data: { body: { name: "  " }, params: { courseId: courseId } },                                                 expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when name is a number",                  data: { body: { name: 123 }, params: { courseId: courseId } },                                                  expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when description is empty",              data: { body: { description: "  ", name: "tester"}, params: { courseId: courseId } },                           expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when description is a number",           data: { body: { description: 123, name: "tester"}, params: { courseId: courseId } },                            expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when viewable is missing",               data: { body: { description: "test", name: "tester"}, params: { courseId: courseId } },                         expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when viewable is undefined",             data: { body: { viewable: undefined, description: "test", name: "tester"}, params: { courseId: courseId } },    expectedStatus: 400, expectedData: { message: "Invalid content structure" } },

            { name: "succeeds when all data is valid",              data: { body: { viewable: false, name: "tester", description: "test" }, params: { courseId: courseId } },       expectedStatus: 200, expectedData: () => expect.objectContaining({ name: "tester", description: "test", courseId: course.courseId, viewable: false }) },
            { name: "succeeds without description present",         data: { body: { viewable: false, name: "tester" }, params: { courseId: courseId } },                            expectedStatus: 200, expectedData: () => expect.objectContaining({ name: "tester", viewable: false }) }
        ])("Creating content $name", async ({ name: _name, data, expectedStatus, expectedData }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(data, expectedData);
            
            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.createContent(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(fixedExpectedResult);
        });

        const parentId = (): string => content.contentId;
        test.each([
            { name: "fails when parent Id is missing",              data: { },                                                                                                      expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when parent Id is undefined",            data: { params: { parentId: undefined } },                                                                      expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when parent Id is a number",             data: { params: { parentId: 123 } },                                                                            expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when parent Id is not a valid UUID",     data: { params: { parentId: "123-3333" } },                                                                     expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when parent Id does not exist",          data: { params: { parentId: "123e4567-e89b-12d3-a456-426614174000" } },                                         expectedStatus: 404, expectedData: { message: "Content not found" } },

            { name: "fails when name is missing",                   data: { body: {  }, params: { parentId: parentId } },                                                           expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when name is empty",                     data: { body: { name: "  " }, params: { parentId: parentId } },                                                 expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when name is a number",                  data: { body: { name: 123 }, params: { parentId: parentId } },                                                  expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when description is empty",              data: { body: { description: "  ", name: "tester"}, params: { parentId: parentId } },                           expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when description is a number",           data: { body: {description: 123, name: "tester"}, params: { parentId: parentId } },                             expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when viewable is missing",               data: { body: { description: "test", name: "tester"}, params: { parentId: parentId } },                         expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when viewable is undefined",             data: { body: { viewable: undefined, description: "test", name: "tester"}, params: { parentId: parentId } },    expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            
            { name: "succeeds when all values are valid",           data: { body: { viewable: false, name: "tester", description: "test" }, params: { parentId: parentId } },       expectedStatus: 200, expectedData: () => expect.objectContaining({ viewable: false, name: "tester", description: "test", parentId: parentId() }) },
            { name: "succeeds without description present",         data: { body: { viewable: false, name: "tester" }, params: { parentId: parentId } },                            expectedStatus: 200, expectedData: () => expect.objectContaining({ viewable: false, name: "tester", parentId: parentId() }) }
        ])("Creating sub-content $name", async ({ name: _name, data, expectedStatus, expectedData }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(data, expectedData);

            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.createSubContent(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(fixedExpectedResult);
        });
    });

    describe("Updating content", () => {
        const contentId = (): string => content.contentId;
        const name = (): string => content.name;
        const description = (): string => content.description;
        const courseId = (): string => course.courseId;
        test.each([
            { name: "fails when content Id is not given",           data: {  },                                                                                                     expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id is undefined",           data: { params: { contentId: undefined } },                                                                     expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id is a number",            data: { params: { contentId: 123 } },                                                                           expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id is not a valid UUID",    data: { params: { contentId: "invalid-uuid" } },                                                                expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id does not exist",         data: { params: { contentId: "123e4567-e89b-12d3-a456-426614174000" } },                                        expectedStatus: 404, expectedData: { message: "Content not found" } },

            { name: "fails when name is empty",                     data: { params: { contentId: contentId }, body: { name: " " } },                                                expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when name is a number",                  data: { params: { contentId: contentId }, body: { name: 23 } },                                                 expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when description is empty",              data: { params: { contentId: contentId }, body: { description: "  " } },                                        expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when description is a number",           data: { params: { contentId: contentId }, body: { description: 23 } },                                          expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when viewable is missing",               data: { params: { contentId: contentId }, body: { description: "test", name: "tester"} },                       expectedStatus: 400, expectedData: { message: "Invalid content structure" } },
            { name: "fails when viewable is undefined",             data: { params: { contentId: contentId }, body: { viewable: undefined, description: "test", name: "tester"} },  expectedStatus: 400, expectedData: { message: "Invalid content structure" } },

            { name: "succeeds when all data is valid",              data: { params: { contentId: contentId }, body: { name: "new name", description: "new description" } },         expectedStatus: 200, expectedData: { courseId: courseId, contentId: contentId, name: "new name", description: "new description" } },
            { name: "succeeds without description present",         data: { params: { contentId: contentId }, body: { name: "new name" } },                                         expectedStatus: 200, expectedData: { courseId: courseId, contentId: contentId, name: "new name", description: description } },
            { name: "succeeds when only description is present",    data: { params: { contentId: contentId }, body: { description: "new description" } },                           expectedStatus: 200, expectedData: { courseId: courseId, contentId: contentId, name: name, description: "new description" } },
            { name: "succeeds when no values updated",              data: { params: { contentId: contentId }, body: { } },                                                          expectedStatus: 200, expectedData: { courseId: courseId, contentId: contentId, name: name, description: description } },
        ])("Updateing content $name", async ({ name: _name, data, expectedStatus, expectedData }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(data, expectedData);
            
            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.updateContent(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(fixedExpectedResult);
        });
    });

    describe("Deleting content", () => {
        const contentId = (): string => content.contentId;
        test.each([
            { name: "fails when content Id is not given",           data: {  },                                                                 expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id is undefined",           data: { params: { contentId: undefined } },                                 expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id is a number",            data: { params: { contentId: 123 } },                                       expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id is empty",               data: { params: { contentId: "  " } },                                      expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id is not a valid UUID",    data: { params: { contentId: "123-123" } },                                 expectedStatus: 400, expectedData: { message: "Invalid content ID" } },
            { name: "fails when content Id does not exist",         data: { params: { contentId: "123e4567-e89b-12d3-a456-426614174000" } },    expectedStatus: 404, expectedData: { message: "Content not found" } },

            { name: "succeeds when content Id is valid",            data: { params: { contentId: contentId } },                                  expectedStatus: 200, expectedData: { message: "Content deleted" } }
        ])("Deleting content $name", async ({ name: _name, data, expectedStatus, expectedData }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(data, expectedData);

            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.deleteContent(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(fixedExpectedResult);
        });
    });
});

/**
 * Generate fixed parameters and expected result for tests
 * @param value - The original test data
 * @param expectedResult - The original expected result
 * @returns - An object containing the fixed parameters and expected result
 */
function generateParameters(value: any, expectedResult: any): { fixedValue: any; fixedExpectedResult: any } {
    // Resolve any functions in the test data at runtime so they run when the test executes
    const resolvedValue: any = value ? { ...value } : {};
    // Resolve any functions in params
    if (resolvedValue.params) {
        resolvedValue.params = { ...resolvedValue.params };
        for (const [k, v] of Object.entries(resolvedValue.params)) {
            if (typeof v === "function") {
                (resolvedValue.params as any)[k] = (v as any)();
            }
        }
    }

    // Resolve any functions in body
    if (resolvedValue.body) {
        resolvedValue.body = { ...resolvedValue.body };
        for (const [k, v] of Object.entries(resolvedValue.body)) {
            if (typeof v === "function") {
                (resolvedValue.body as any)[k] = (v as any)();
            }
        }
    }

    // Resolve any functions inside expectedResult arrays or objects
    if (expectedResult && Array.isArray(expectedResult)) {
        expectedResult = expectedResult.map((item) => {
            if (typeof item === "function") return item();
            return item;
        });

    // Resolve any functions inside expectedResult so assertions compare concrete values
    } else if (expectedResult && typeof expectedResult === "object") {
        const resolved = { ...(expectedResult as any) } as any;
        for (const [k, v] of Object.entries(resolved)) {
            if (typeof v === "function") resolved[k] = v();
        }
        expectedResult = resolved;
    
    // Check if expectedResult is a function and resolve it
    } else if (expectedResult && typeof expectedResult === "function") {
        expectedResult = expectedResult();
    }

    return { fixedValue: resolvedValue, fixedExpectedResult: expectedResult };
}