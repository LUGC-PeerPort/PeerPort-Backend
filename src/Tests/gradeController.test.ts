import { TestDataSource } from "./test-data-source.js";
import { GradeController } from "../Controllers/GradeController.js";
import { Course } from "../Database/entities/Course.js";
import { User } from "../Database/entities/User.js";
import { AssignmentSubmissions } from "../Database/entities/AssignmentSubmissions.js";
import { Assignments } from "../Database/entities/Assignments.js";
import { Role } from "../Database/entities/Role.js";
import { Grade } from "../Database/entities/Grade.js";
import { UsersToCourses } from "../Database/entities/UsersToCourses.js";

describe("GradeController test:", () => {
    let controller: GradeController;
    let course: Course;
    let course2: Course;
    let user: User;
    let user2: User;
    let assignmentSubmission: AssignmentSubmissions;
    let assignmentSubmission2: AssignmentSubmissions;
    let assignmentSubmissionUnique: AssignmentSubmissions;
    let generalGrade: Grade;

    beforeAll(async () => {
        await TestDataSource.initialize();
        controller = new GradeController(TestDataSource);

        // Create a course for the grades to be associated with
        const courseData = {
            name: "Test Course",
            courseCode: "TEST 101",
            isOpen: true,
            description: "A course for testing purposes",
            startDate: new Date().toString(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toString()
        };
        course = await TestDataSource.getRepository(Course).create(courseData);
        await TestDataSource.getRepository(Course).save(course);
        course2 = await TestDataSource.getRepository(Course).create(courseData);
        await TestDataSource.getRepository(Course).save(course2);

        // Create a role for the user to use
        await TestDataSource.getRepository(Role).save({ name: "student" });

        // Create a user for the grades to be associated with
        const userData = {
            name: "Test User",
            email: "testuser@example.com",
            password: "password",
            idNumber: "123456",
            role: await TestDataSource.getRepository("Role").findOneBy({ name: "student" }) as Role,
        };
        user = await TestDataSource.getRepository(User).create(userData);
        await TestDataSource.getRepository(User).save(user);
        user2 = await TestDataSource.getRepository(User).create(userData);
        await TestDataSource.getRepository(User).save(user2);

        await TestDataSource.getRepository(UsersToCourses).save({ user: user, course: course });
        await TestDataSource.getRepository(UsersToCourses).save({ user: user, course: course2 });
        await TestDataSource.getRepository(UsersToCourses).save({ user: user2, course: course2 });

        // Create an assignment for the assignment submission
        const assignment = await TestDataSource.getRepository(Assignments).save({
            name: "Test Assignment",
            description: "This is a test assignment",
            dueDate: "2025-06-01",
            course: course,
        });

        // Create an assignment submission for the grades to be associated with
        const assignmentSubmissionData = {
            comment: "This is a test submission",
            timeSubmitted: new Date().toISOString(),
            user: user,
            assignment: assignment,
        };
        assignmentSubmission = await TestDataSource.getRepository(AssignmentSubmissions).create(assignmentSubmissionData);
        await TestDataSource.getRepository(AssignmentSubmissions).save(assignmentSubmission);
        assignmentSubmission2 = await TestDataSource.getRepository(AssignmentSubmissions).create(assignmentSubmissionData);
        await TestDataSource.getRepository(AssignmentSubmissions).save(assignmentSubmission2);
        assignmentSubmissionUnique = await TestDataSource.getRepository(AssignmentSubmissions).create(assignmentSubmissionData);
        await TestDataSource.getRepository(AssignmentSubmissions).save(assignmentSubmissionUnique);
    });

    beforeEach(async () => {
        // Create a general grade for testing getGrade by ID
        generalGrade = await TestDataSource.getRepository(Grade).save({
            user: user,
            course: course,
            assignmentSubmission: assignmentSubmissionUnique,
            minScore: 10,
            maxScore: 110,
            achievedScore: 75,
            weight: 1,
        });
    });

    afterEach(async () => {
        await TestDataSource.getRepository(Grade).clear();
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });

    describe("Get all grades", () => {
        it("Should implement getAllGrades method", async () => {
            expect(controller.getAllGrades).toBeDefined();
            expect(typeof controller.getAllGrades).toBe("function");
        });

        it("Should return an empty list if there are no grades", async () => {
            // Remove all grades to ensure the database is empty
            await TestDataSource.getRepository(Grade).clear();

            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.getAllGrades(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it("Should return multiple grades", async () => {
            const grade1 = await TestDataSource.getRepository(Grade).save({
                user: user,
                course: course,
                assignmentSubmission: assignmentSubmission,
                minScore: 10,
                maxScore: 110,
                achievedScore: 80,
                weight: 1,
            });

            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.getAllGrades(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
                {
                    gradeId: grade1.gradeId,
                    userId: grade1.user.userId,
                    courseId: grade1.course.courseId,
                    assignmentSubmissionId: grade1.assignmentSubmission?.assignmentSubmissionId,
                    achievedScore: grade1.achievedScore,
                    weight: grade1.weight,
                    minScore: grade1.minScore,
                    maxScore: grade1.maxScore,
                },
                {
                    gradeId: generalGrade.gradeId,
                    userId: generalGrade.user.userId,
                    courseId: generalGrade.course.courseId,
                    assignmentSubmissionId: generalGrade.assignmentSubmission?.assignmentSubmissionId,
                    achievedScore: generalGrade.achievedScore,
                    weight: generalGrade.weight,
                    minScore: generalGrade.minScore,
                    maxScore: generalGrade.maxScore,
                }
            ]));
        });
    });

    describe("Get grade by ID", () => {
        it("Should implement getGrade method", async () => {
            expect(controller.getGrade).toBeDefined();
            expect(typeof controller.getGrade).toBe("function");
        });

        it.each([
            // Missing values
            { name: "fails when gradeId is missing",                value: {  },                                                                expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },

            // Invalid values
            { name: "fails when gradeId is a number",               value: { params: { gradeId: 123 } },                                        expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },
            { name: "fails when gradeId is empty",                  value: { params: { gradeId: "   " } },                                      expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },
            { name: "fails when gradeId is an invalid format",      value: { params: { gradeId: "invalid-format" } },                           expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },

            // Logical errors
            { name: "fails when grade does not exist",              value: { params: { gradeId: "123e4567-e89b-12d3-a456-426614174000" } },     expectedStatus: 404, expectedResult: { message: "Grade not found" } },

            // Valid cases
            { name: "succeeds when grade exists",                   value: { params: { gradeId: () => generalGrade.gradeId } },                 expectedStatus: 200, expectedResult: () => ({ 
                gradeId: generalGrade.gradeId,
                userId: generalGrade.user.userId,
                courseId: generalGrade.course.courseId,
                assignmentSubmissionId: generalGrade.assignmentSubmission?.assignmentSubmissionId,
                minScore: generalGrade.minScore,
                maxScore: generalGrade.maxScore,
                achievedScore: generalGrade.achievedScore,
                weight: generalGrade.weight,
            }) },
        ])("Getting a grade with $name", async ({ name: _name, value, expectedStatus, expectedResult }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(value, expectedResult);

            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.getGrade(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(fixedExpectedResult);
        });
    });

    describe("Create grade", () => {
        it("Should implement createGrade method", async () => {
            expect(controller.createGrade).toBeDefined();
            expect(typeof controller.createGrade).toBe("function");
        });

        const courseId = (): string => course.courseId;
        const userId = (): string => user.userId;
        const assignmentSubmissionId = (): string => assignmentSubmission.assignmentSubmissionId;
        const defaultParams = { userId: userId, courseId: courseId };
        const defaultBody = { minScore: 0, maxScore: 100, achievedScore: 85, weight: 1 };
        it.each([
            // Missing values
            { name: "fails when missing all values",                                value: {  },                                                                                                                    expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },  
            { name: "fails when missing userId",                                    value: { params: { courseId: courseId }, body: defaultBody },                                                                   expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when missing courseId",                                  value: { params: { userId: userId }, body: defaultBody },                                                                       expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when missing minScore",                                  value: { body: { maxScore: 100, achievedScore: 85, weight: 1 }, params: defaultParams },                                        expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },
            { name: "fails when missing maxScore",                                  value: { body: { minScore: 0, achievedScore: 85, weight: 1 }, params: defaultParams },                                          expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },
            { name: "fails when missing weight",                                    value: { body: { minScore: 0, maxScore: 100, achievedScore: 85 }, params: defaultParams },                                      expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },

            // Invalid values
            { name: "fails when userId is a number",                                value: { params: { userId: 123, courseId: courseId }, body: defaultBody },                                                      expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when userId is empty",                                   value: { params: { userId: "  ", courseId: courseId }, body: defaultBody },                                                     expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when userId is not the right format",                    value: { params: { userId: "invalid-format", courseId: courseId }, body: defaultBody },                                         expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when courseId is a number",                              value: { params: { userId: userId, courseId: 123 }, body: defaultBody },                                                        expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when courseId is empty",                                 value: { params: { userId: userId, courseId: "  " }, body: defaultBody },                                                       expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when courseId is not the right format",                  value: { params: { userId: userId, courseId: "invalid-format" }, body: defaultBody },                                           expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when assignmentSubmissionId is a number",                value: { params: { userId: userId, courseId: courseId, assignmentSubmissionId: 123 }, body: defaultBody },                      expectedStatus: 400, expectedResult: { message: "Invalid assignment submission ID" } },
            { name: "fails when assignmentSubmissionId is empty",                   value: { params: { userId: userId, courseId: courseId, assignmentSubmissionId: "  " }, body: defaultBody },                     expectedStatus: 400, expectedResult: { message: "Invalid assignment submission ID" } },
            { name: "fails when assignmentSubmissionId is not the right format",    value: { params: { userId: userId, courseId: courseId, assignmentSubmissionId: "invalid-format" }, body: defaultBody },         expectedStatus: 400, expectedResult: { message: "Invalid assignment submission ID" } },
            { name: "fails when minScore is invalid",                               value: { body: { minScore: "invalid", maxScore: 100, achievedScore: 50, weight: 1}, params: defaultParams },                    expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },
            { name: "fails when maxScore is invalid",                               value: { body: { minScore: 0, maxScore: "invalid", achievedScore: 50, weight: 1 }, params: defaultParams },                     expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },
            { name: "fails when achievedScore is invalid",                          value: { body: { minScore: 0, maxScore: 100, achievedScore: "invalid", weight: 1 }, params: defaultParams },                    expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },
            { name: "fails when weight is invalid",                                 value: { body: { minScore: 0, maxScore: 100, achievedScore: 85, weight: "invalid" }, params: defaultParams },                   expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },

            // Logical errors
            { name: "fails when user does not exist",                               value: { params: { userId: "123e4567-e89b-12d3-a456-426614174000", courseId: courseId }, body: defaultBody },                   expectedStatus: 404, expectedResult: { message: "User not found" } },
            { name: "fails when course does not exist",                             value: { params: { userId: userId, courseId: "123e4567-e89b-12d3-a456-426614174000" }, body: defaultBody },                     expectedStatus: 404, expectedResult: { message: "Course not found" } },
            { name: "fails when assignment submission does not exist",              value: { params: { ...defaultParams, assignmentSubmissionId: "123e4567-e89b-12d3-a456-426614174000" }, body: defaultBody },     expectedStatus: 404, expectedResult: { message: "Assignment submission not found" } },
            { name: "fails when minScore is negative",                              value: { body: { minScore: -5, maxScore: 100, achievedScore: 50, weight: 1 }, params: defaultParams },                          expectedStatus: 400, expectedResult: { message: "Invalid min score" } },
            { name: "fails when maxScore is less than minScore",                    value: { body: { minScore: 10, maxScore: 5, achievedScore: 50, weight: 1 }, params: defaultParams },                            expectedStatus: 400, expectedResult: { message: "Invalid max score" } },
            { name: "fails when achievedScore is less than minScore",               value: { body: { minScore: 20, maxScore: 100, achievedScore: 10, weight: 1 }, params: defaultParams },                          expectedStatus: 400, expectedResult: { message: "Invalid achieved score" } },
            { name: "fails when achievedScore is greater than maxScore",            value: { body: { minScore: 0, maxScore: 100, achievedScore: 150, weight: 1 }, params: defaultParams },                          expectedStatus: 400, expectedResult: { message: "Invalid achieved score" } },
            { name: "fails when weight is negative",                                value: { body: { minScore: 0, maxScore: 100, achievedScore: 85, weight: -1 }, params: defaultParams },                          expectedStatus: 400, expectedResult: { message: "Invalid weight" } },


            // Valid cases
            { name: "succeeds when assignmentSubmissionId is present",              value: { params: { ...defaultParams, assignmentSubmissionId: assignmentSubmissionId }, body: defaultBody },                     expectedStatus: 201, expectedResult: { gradeId: expect.any(String), userId: defaultParams.userId, courseId: defaultParams.courseId, assignmentSubmissionId: assignmentSubmissionId, ...defaultBody } },
            { name: "succeeds when assignmentSubmissionId is not present",          value: { params: defaultParams, body: defaultBody },                                                                            expectedStatus: 201, expectedResult: { gradeId: expect.any(String), userId: defaultParams.userId, courseId: defaultParams.courseId, assignmentSubmissionId: null, ...defaultBody } },

        ])("Creating a grade $name", async ({ name: _name, value, expectedStatus, expectedResult }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(value, expectedResult);

            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.createGrade(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(fixedExpectedResult);
        });
    });

    describe("Update grade", () => {
        it("Should implement updateGrade method", async () => {
            expect(controller.updateGrade).toBeDefined();
            expect(typeof controller.updateGrade).toBe("function");
        });

        const gradeId = (): string => generalGrade.gradeId;
        const userId = (): string => generalGrade.user.userId;
        const courseId = (): string => generalGrade.course.courseId;
        const assignmentSubmissionId = (): string | undefined => generalGrade.assignmentSubmission?.assignmentSubmissionId;
        const defaultBody = { minScore: 0, maxScore: 100, achievedScore: 50, weight: 2 };
        it.each([
            // Missing values
            { name: "fails when no values are passed",                      value: {  },                                                                                                            expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },
            { name: "fails when missing gradeId",                           value: { body: defaultBody },                                                                                           expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },

            // Invalid values
            { name: "fails when gradeId is empty",                          value: { params: { gradeId: "   " }, body: defaultBody },                                                               expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },
            { name: "fails when gradeId is a number",                       value: { params: { gradeId: 123 }, body: defaultBody },                                                                 expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },
            { name: "fails when gradeId is an invalid format",              value: { params: { gradeId: "invalid-format" }, body: defaultBody },                                                    expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },
            { name: "fails when minScore is invalid",                       value: { params: { gradeId: gradeId }, body: { minScore: "invalid", maxScore: 100, achievedScore: 50, weight: 1 } },    expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },
            { name: "fails when maxScore is invalid",                       value: { params: { gradeId: gradeId }, body: { minScore: 0, maxScore: "invalid", achievedScore: 50, weight: 1 } },      expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },
            { name: "fails when achievedScore is invalid",                  value: { params: { gradeId: gradeId }, body: { minScore: 0, maxScore: 100, achievedScore: "invalid", weight: 1 } },     expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },
            { name: "fails when weight is invalid type",                    value: { params: { gradeId: gradeId }, body: { minScore: 0, maxScore: 100, achievedScore: 50, weight: "invalid" } },    expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },

            // Logical errors
            { name: "fails when grade does not exist",                      value: { params: { gradeId: "123e4567-e89b-12d3-a456-426614174000" } },                                                 expectedStatus: 404, expectedResult: { message: "Grade not found" } },
            { name: "fails when weight is negative",                        value: { params: { gradeId: gradeId }, body: { weight: -1 } },                                                          expectedStatus: 400, expectedResult: { message: "Invalid weight" } },
            { name: "fails when minScore is negative",                      value: { params: { gradeId: gradeId }, body: { minScore: -1} },                                                         expectedStatus: 400, expectedResult: { message: "Invalid min score" } },
            { name: "fails when maxScore is less than minScore",            value: { params: { gradeId: gradeId }, body: { minScore: 1, maxScore: 0 } },                                            expectedStatus: 400, expectedResult: { message: "Invalid max score" } },
            { name: "fails when achievedScore is less than minScore",       value: { params: { gradeId: gradeId }, body: { minScore: 1, achievedScore: 0 } },                                       expectedStatus: 400, expectedResult: { message: "Invalid achieved score" } },
            { name: "fails when achievedScore is greater than maxScore",    value: { params: { gradeId: gradeId }, body: { maxScore: 100, achievedScore: 101 } },                                   expectedStatus: 400, expectedResult: { message: "Invalid achieved score" } },
            { name: "fails when updating maxScore below achievedScore",     value: { params: { gradeId: gradeId }, body: { maxScore: () => generalGrade.achievedScore - 1 } },                      expectedStatus: 400, expectedResult: { message: "Invalid max score" } },
            { name: "fails when updating minScore above achievedScore",     value: { params: { gradeId: gradeId }, body: { minScore: () => generalGrade.achievedScore + 1 } },                      expectedStatus: 400, expectedResult: { message: "Invalid min score" } },
            { name: "fails when updating minScore above maxScore",          value: { params: { gradeId: gradeId }, body: { minScore: () => generalGrade.maxScore + 1 } },                           expectedStatus: 400, expectedResult: { message: "Invalid min score" } },
            { name: "fails when updating maxScore below minScore",          value: { params: { gradeId: gradeId }, body: { maxScore: () => generalGrade.minScore - 1 } },                           expectedStatus: 400, expectedResult: { message: "Invalid max score" } },
            { name: "fails when updating achievedScore below minScore",     value: { params: { gradeId: gradeId }, body: { achievedScore: () => generalGrade.minScore - 1 } },                      expectedStatus: 400, expectedResult: { message: "Invalid achieved score" } },
            { name: "fails when updating achievedScore above maxScore",     value: { params: { gradeId: gradeId }, body: { achievedScore: () => generalGrade.maxScore + 1 } },                      expectedStatus: 400, expectedResult: { message: "Invalid achieved score" } },

            // Valid cases
            { name: "succeeds when updating minScore",                      value: { params: { gradeId: gradeId }, body: { minScore: 20 } },                                                        expectedStatus: 200, expectedResult: { gradeId: gradeId, assignmentSubmissionId: assignmentSubmissionId, courseId: courseId, userId: userId, minScore: 20, maxScore: () => generalGrade.maxScore, achievedScore: () => generalGrade.achievedScore, weight: () => generalGrade.weight } },
            { name: "succeeds when updating maxScore",                      value: { params: { gradeId: gradeId }, body: { maxScore: 90 } },                                                        expectedStatus: 200, expectedResult: { gradeId: gradeId, assignmentSubmissionId: assignmentSubmissionId, courseId: courseId, userId: userId, minScore: () => generalGrade.minScore, maxScore: 90, achievedScore: () => generalGrade.achievedScore, weight: () => generalGrade.weight } },
            { name: "succeeds when updating achievedScore",                 value: { params: { gradeId: gradeId }, body: { achievedScore: 50 } },                                                   expectedStatus: 200, expectedResult: { gradeId: gradeId, assignmentSubmissionId: assignmentSubmissionId, courseId: courseId, userId: userId, minScore: () => generalGrade.minScore, maxScore: () => generalGrade.maxScore, achievedScore: 50, weight: () => generalGrade.weight } },
            { name: "succeeds when updating weight",                        value: { params: { gradeId: gradeId }, body: { weight: 2 } },                                                           expectedStatus: 200, expectedResult: { gradeId: gradeId, assignmentSubmissionId: assignmentSubmissionId, courseId: courseId, userId: userId, minScore: () => generalGrade.minScore, maxScore: () => generalGrade.maxScore, achievedScore: () => generalGrade.achievedScore, weight: 2 } },
            { name: "succeeds when updating all fields",                    value: { params: { gradeId: gradeId }, body: defaultBody },                                                             expectedStatus: 200, expectedResult: { gradeId: gradeId, assignmentSubmissionId: assignmentSubmissionId, courseId: courseId, userId: userId, ...defaultBody } },

            // No changes
            { name: "succeeds when no fields are updated",                  value: { params: { gradeId: gradeId }, body: {  } },                                                                    expectedStatus: 200, expectedResult: { gradeId: gradeId, assignmentSubmissionId: assignmentSubmissionId, courseId: courseId, userId: userId, minScore: () => generalGrade.minScore, maxScore: () => generalGrade.maxScore, achievedScore: () => generalGrade.achievedScore, weight: () => generalGrade.weight } },
        ])("Updating a grade $name", async ({name: _name, value, expectedStatus, expectedResult }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(value, expectedResult);

            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.updateGrade(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(fixedExpectedResult);
        });
    });

    describe("Delete grade", () => {
        it("Should implement deleteGrade method", async () => {
            expect(controller.deleteGrade).toBeDefined();
            expect(typeof controller.deleteGrade).toBe("function");
        });

        it.each([
            // Missing values
            { name: "fails when missing gradeId",                   value: {  },                                                                expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },

            // Invalid values
            { name: "fails when gradeId is a number",               value: { params: { gradeId: 123 } },                                        expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },
            { name: "fails when gradeId is empty",                  value: { params: { gradeId: "  " } },                                       expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },
            { name: "fails when gradeId is an invalid format",      value: { params: { gradeId: "invalid-format" } },                           expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },

            // Logical errors
            { name: "fails when grade does not exist",              value: { params: { gradeId: "123e4567-e89b-12d3-a456-426614174000" } },     expectedStatus: 404, expectedResult: { message: "Grade not found" } },

            // Valid cases
            { name: "succeeds when grade exists",                   value: { params: { gradeId: () => generalGrade.gradeId } },                 expectedStatus: 200, expectedResult: { message: "Grade deleted" } },
        ])("Deleting a grade $name", async ({ name: _name, value, expectedStatus, expectedResult }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(value, expectedResult);

            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.deleteGrade(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(fixedExpectedResult);
        });
    });

    describe("Get all grades for user", () => {
        it("Should implement getAllGradesForUser method", async () => {
            expect(controller.getAllGradesForUser).toBeDefined();
            expect(typeof controller.getAllGradesForUser).toBe("function");
        });

        it.each([
            // Missing values
            { name: "fails when missing userId",                    value: {  },                                                                expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },

            // Invalid values
            { name: "fails when userId is a number",                value: { params: { userId: 123 } },                                         expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when userId is empty",                   value: { params: { userId: "  " } },                                        expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when userId is an invalid format",       value: { params: { userId: "invalid-format" } },                            expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },

            // Logical errors
            { name: "fails when user does not exist",               value: { params: { userId: "123e4567-e89b-12d3-a456-426614174000" } },      expectedStatus: 404, expectedResult: { message: "User not found" } },

            // Valid cases
            { name: "succeeds when user has no grades",             value: { params: { userId: () => user2.userId } },                          expectedStatus: 200, expectedResult: [] },
            { name: "succeeds when user has multiple grades",       value: { params: { userId: () => user.userId } },                           expectedStatus: 200, expectedResult: () => [ { 
                gradeId: generalGrade.gradeId, 
                userId: generalGrade.user.userId,
                courseId: generalGrade.course.courseId, 
                assignmentSubmissionId: generalGrade.assignmentSubmission?.assignmentSubmissionId, 
                minScore: generalGrade.minScore, 
                maxScore: generalGrade.maxScore, 
                achievedScore: generalGrade.achievedScore, 
                weight: generalGrade.weight 
            } ] },
        ])("Getting all grades for a user $name", async ({ name: _name, value, expectedStatus, expectedResult }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(value, expectedResult);

            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.getAllGradesForUser(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(fixedExpectedResult);
        });
    });
    
    describe("Get all grades for course", () => {
        it("Should implement getAllGradesForCourse method", async () => {
            expect(controller.getAllGradesForCourse).toBeDefined();
            expect(typeof controller.getAllGradesForCourse).toBe("function");
        });

        it.each([
            // Missing values
            { name: "fails when missing courseId",                  value: {  },                                                                expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },

            // Invalid values
            { name: "fails when courseId is a number",              value: { params: { courseId: 123 } },                                       expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when courseId is empty",                 value: { params: { courseId: "  " } },                                      expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when courseId is an invalid format",     value: { params: { courseId: "invalid-format" } },                          expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },

            // Logical errors
            { name: "fails when course does not exist",             value: { params: { courseId: "123e4567-e89b-12d3-a456-426614174000" } },    expectedStatus: 404, expectedResult: { message: "Course not found" } },

            // Valid cases
            { name: "succeeds when course has no grades",           value: { params: { courseId: () => course2.courseId } },                    expectedStatus: 200, expectedResult: [] },
            { name: "succeeds when course has multiple grades",     value: { params: { courseId: () => course.courseId } },                     expectedStatus: 200, expectedResult: () => [ {
                gradeId: generalGrade.gradeId, 
                userId: generalGrade.user.userId,
                courseId: generalGrade.course.courseId, 
                assignmentSubmissionId: generalGrade.assignmentSubmission?.assignmentSubmissionId, 
                minScore: generalGrade.minScore, 
                maxScore: generalGrade.maxScore, 
                achievedScore: generalGrade.achievedScore, 
                weight: generalGrade.weight 
            } ] },
        ])("Getting all grades for a course $name", async ({ name: _name, value, expectedStatus, expectedResult }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(value, expectedResult);

            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.getAllGradesForCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(fixedExpectedResult);
        });
    });

    describe("Get all grades for a user in a specific course", () => {
        it("Should implement getAllGradesForUserInCourse method", async () => {
            expect(controller.getAllGradesForUserInCourse).toBeDefined();
            expect(typeof controller.getAllGradesForUserInCourse).toBe("function");
        });

        it.each([
            // Missing values
            { name: "fails when nothing is provided",                       value: {  },                                                                                                expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when missing userId",                            value: { params: { courseId: () => course.courseId } },                                                     expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when missing courseId",                          value: { params: { userId: () => user.userId } },                                                           expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },

            // Invalid values
            { name: "fails when userId is a number",                        value: { params: { userId: 123, courseId: () => course.courseId } },                                        expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when userId is empty",                           value: { params: { userId: "  ", courseId: () => course.courseId } },                                       expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when userId is an invalid format",               value: { params: { userId: "invalid", courseId: () => course.courseId } },                                  expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when courseId is a number",                      value: { params: { userId: () => user.userId, courseId: 123 } },                                            expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when courseId is empty",                         value: { params: { userId: () => user.userId, courseId: "" } },                                             expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when courseId is an invalid format",             value: { params: { userId: () => user.userId, courseId: "invalid" } },                                      expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },

            // Logical errors
            { name: "fails when user does not exist",                       value: { params: { userId: "123e4567-e89b-12d3-a456-426614174000", courseId: () => course.courseId } },     expectedStatus: 404, expectedResult: { message: "User not found" } },
            { name: "fails when course does not exist",                     value: { params: { userId: () => user.userId, courseId: "123e4567-e89b-12d3-a456-426614174000" } },         expectedStatus: 404, expectedResult: { message: "Course not found" } },

            // Valid cases
            { name: "succeeds when user has no grades in course",           value: { params: { userId: () => user.userId, courseId: () => course2.courseId } },                         expectedStatus: 200, expectedResult: [] },
            { name: "succeeds when user has multiple grades in course",     value: { params: { userId: () => user.userId, courseId: () => course.courseId } },                          expectedStatus: 200, expectedResult: () => [ {
                gradeId: generalGrade.gradeId, 
                userId: generalGrade.user.userId,
                courseId: generalGrade.course.courseId, 
                assignmentSubmissionId: generalGrade.assignmentSubmission?.assignmentSubmissionId, 
                minScore: generalGrade.minScore, 
                maxScore: generalGrade.maxScore, 
                achievedScore: generalGrade.achievedScore, 
                weight: generalGrade.weight 
            } ] },
        ])("Getting all grades for a user in a specific course $name", async ({ name: _name, value, expectedStatus, expectedResult }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(value, expectedResult);

            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.getAllGradesForUserInCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(fixedExpectedResult);
        });
    });

    describe("Get the calculated grade for a user in a specific course", () => {
        it("Should implement getCalculatedGradeForUserInCourse method", async () => {
            expect(controller.getCalculatedGradeForUserInCourse).toBeDefined();
            expect(typeof controller.getCalculatedGradeForUserInCourse).toBe("function");
        });

        it.each([
            // Missing values
            { name: "fails when missing userId",                            value: { params: { courseId: () => course.courseId } },                                                     expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when missing courseId",                          value: { params: { userId: () => user.userId } },                                                           expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },

            // Invalid values
            { name: "fails when userId is a number",                        value: { params: { userId: 123, courseId: () => course.courseId } },                                        expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when userId is empty",                           value: { params: { userId: "  ", courseId: () => course.courseId } },                                       expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when userId is an invalid format",               value: { params: { userId: "invalid", courseId: () => course.courseId } },                                  expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when courseId is a number",                      value: { params: { userId: () => user.userId, courseId: 123 } },                                            expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when courseId is empty",                         value: { params: { userId: () => user.userId, courseId: "" } },                                             expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when courseId is an invalid format",             value: { params: { userId: () => user.userId, courseId: "invalid" } },                                      expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },

            // Logical errors
            { name: "fails when user does not exist",                       value: { params: { userId: "123e4567-e89b-12d3-a456-426614174000", courseId: () => course.courseId } },     expectedStatus: 404, expectedResult: { message: "User not found" } },
            { name: "fails when course does not exist",                     value: { params: { userId: () => user.userId, courseId: "123e4567-e89b-12d3-a456-426614174000" } },         expectedStatus: 404, expectedResult: { message: "Course not found" } },

            // Valid cases
            { name: "succeeds when user has no grades in course",           value: { params: { userId: () => user2.userId, courseId: () => course2.courseId } },                        expectedStatus: 200, expectedResult: { grade: 0 } },
            { name: "succeeds when user has multiple grades in course",     value: { params: { userId: () => user.userId, courseId: () => course.courseId } },                          expectedStatus: 200, expectedResult: () => { return { grade: generalGrade.achievedScore }; } },
        ])("Getting the calculated grade for a user in a specific course $name", async ({ name: _name, value, expectedStatus, expectedResult }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(value, expectedResult);

            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.getCalculatedGradeForUserInCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(fixedExpectedResult);
        });
    });

    describe.skip("Get the average of the grades in a course", () => {
        it("Should implement getAverageGradeForCourse method", async () => {
            expect(controller.getAverageGradeForCourse).toBeDefined();
            expect(typeof controller.getAverageGradeForCourse).toBe("function");
        });

        it.each([
            // Missing values
            { name: "fails when missing courseId",                  value: {  },                                                                    expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },

            // Invalid values
            { name: "fails when courseId is a number",              value: { params: { courseId: 123 } },                                           expectedStatus: 400, expectedResult: { message: "Invalid courseId format" } },
            { name: "fails when courseId is empty",                 value: { params: { courseId: "  " } },                                          expectedStatus: 400, expectedResult: { message: "courseId is required" } },
            { name: "fails when courseId is an invalid format",     value: { params: { courseId: "invalid-format" } },                              expectedStatus: 400, expectedResult: { message: "Invalid courseId format" } },

            // Logical errors
            { name: "fails when course does not exist",             value: { params: { courseId: "123e4567-e89b-12d3-a456-426614174000" } },        expectedStatus: 404, expectedResult: { message: "Course not found" } },

            // Valid cases
            { name: "succeeds when course has no grades",           value: { params: { courseId: () => course2.courseId } },                        expectedStatus: 200, expectedResult: 0 },
            { name: "succeeds when course has multiple grades",     value: { params: { courseId: () => course.courseId } },                         expectedStatus: 200, expectedResult: () => generalGrade.achievedScore },
        ])("Getting the average of the grades in a course $name", async ({ name: _name, value, expectedStatus, expectedResult }) => {
            const { fixedValue, fixedExpectedResult } = generateParameters(value, expectedResult);

            const req: any = fixedValue ?? {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.getAverageGradeForCourse(req, res);

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