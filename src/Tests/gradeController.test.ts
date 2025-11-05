import { TestDataSource } from "./test-data-source.js";
import { GradeController } from "../Controllers/GradeController.js";
import { Course } from "../Database/entities/Course.js";
import { User } from "../Database/entities/User.js";
import { AssignmentSubmissions } from "../Database/entities/AssignmentSubmissions.js";
import { Assignments } from "../Database/entities/Assignments.js";
import { Role } from "../Database/entities/Role.js";
import { Grade } from "../Database/entities/Grade.js";

describe.skip("GradeController test:", () => {
    let controller: GradeController;
    let course: Course;
    let user: User;
    let assignmentSubmission: AssignmentSubmissions;
    let assignmentSubmission2: AssignmentSubmissions;
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
        course = await TestDataSource.getRepository(Course).save(courseData);

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
        user = await TestDataSource.getRepository(User).save(userData);

        // Create an assignment for the assignment submission
        const assignment = await TestDataSource.getRepository(Assignments).save({
            name: "Test Assignment",
            description: "This is a test assignment",
            dueDate: "2025-06-01",
            course: course,
        });

        // Create an assignment submission for the grades to be associated with
        assignmentSubmission = await TestDataSource.getRepository(AssignmentSubmissions).save({
            comment: "This is a test submission",
            timeSubmitted: new Date().toISOString(),
            user: user,
            assignment: assignment,
        });
        assignmentSubmission2 = await TestDataSource.getRepository(AssignmentSubmissions).save({
            comment: "This is a test submission",
            timeSubmitted: new Date().toISOString(),
            user: user,
            assignment: assignment,
        });
    });

    beforeEach(async () => {
        await TestDataSource.getRepository(Grade).clear();

        // Create a general grade for testing getGrade by ID
        generalGrade = await TestDataSource.getRepository(Grade).save({
            user: user,
            course: course,
            assignmentSubmission: assignmentSubmission,
            minScore: 0,
            maxScore: 100,
            achievedScore: 75,
        });
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
                assignmentSubmission: assignmentSubmission2,
                minScore: 10,
                maxScore: 110,
                achievedScore: 80,
            });

            const grade2 = generalGrade; // Created in beforeEach

            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.getAllGrades(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([
                {
                    gradeId: grade1.gradeId,
                    userId: grade1.user,
                    courseId: grade1.course,
                    assignmentSubmissionId: grade1.assignmentSubmission,
                    minScore: grade1.minScore,
                    maxScore: grade1.maxScore,
                    achievedScore: grade1.achievedScore,
                },
                {
                    gradeId: grade2.gradeId,
                    userId: grade2.user,
                    courseId: grade2.course,
                    assignmentSubmissionId: grade2.assignmentSubmission,
                    minScore: grade2.minScore,
                    maxScore: grade2.maxScore,
                    achievedScore: grade2.achievedScore,
                }
            ]);
        });
    });

    describe("Get grade by ID", () => {
        it("Should implement getGrade method", async () => {
            expect(controller.getGrade).toBeDefined();
            expect(typeof controller.getGrade).toBe("function");
        });

        it.each([
            // Missing values
            { name: "fails when gradeId is missing", value: {  }, expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },

            // Invalid values
            { name: "fails when gradeId is invalid", value: { params: { gradeId: "invalid" } }, expectedStatus: 400, expectedResult: { message: "Invalid grade ID" } },

            // Logical errors
            { name: "fails when grade does not exist", value: { params: { gradeId: "123e4567-e89b-12d3-a456-426614174000" } }, expectedStatus: 404, expectedResult: { message: "Grade not found" } },

            // Valid cases
            { name: "succeeds when grade exists", value: { params: { gradeId: () => generalGrade.gradeId } }, expectedStatus: 200, expectedResult: () => ({ 
                gradeId: generalGrade.gradeId,
                userId: generalGrade.user,
                courseId: generalGrade.course,
                assignmentSubmissionId: generalGrade.assignmentSubmission,
                minScore: generalGrade.minScore,
                maxScore: generalGrade.maxScore,
                achievedScore: generalGrade.achievedScore,
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
        const defaultBody = { minScore: 0, maxScore: 100, achievedScore: 85 };
        it.each([
            // Missing values
            { name: "fails when missing all values",                                value: {  }, expectedStatus: 400, expectedResult: { message: "Invalid Grade structure" } },  
            { name: "fails when missing userId",                                    value: { params: { courseId: courseId }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "Invalid Grade structure" } },
            { name: "fails when missing courseId",                                  value: { params: { userId: userId }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "Invalid Grade structure" } },
            { name: "fails when missing minScore",                                  value: { body: { maxScore: 100, achievedScore: 85 }, params: defaultParams }, expectedStatus: 400, expectedResult: { message: "Invalid Grade structure" } },
            { name: "fails when missing maxScore",                                  value: { body: { minScore: 0, achievedScore: 85 }, params: defaultParams }, expectedStatus: 400, expectedResult: { message: "Invalid Grade structure" } },
            { name: "fails when missing achievedScore",                             value: { body: { minScore: 0, maxScore: 100 }, params: defaultParams }, expectedStatus: 400, expectedResult: { message: "Invalid Grade structure" } },

            // Invalid values
            { name: "fails when userId is a number",                                value: { params: { userId: 123, courseId: courseId }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when userId is empty",                                   value: { params: { userId: "  ", courseId: courseId }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when userId is not the right format",                    value: { params: { userId: "invalid-format", courseId: courseId }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "Invalid user ID" } },
            { name: "fails when courseId is a number",                              value: { params: { userId: userId, courseId: 123 }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when courseId is empty",                                 value: { params: { userId: userId, courseId: "  " }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when courseId is not the right format",                  value: { params: { userId: userId, courseId: "invalid-format" }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "Invalid course ID" } },
            { name: "fails when assignmentSubmissionId is a number",                value: { params: { userId: userId, courseId: courseId, assignmentSubmissionId: 123 }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "Invalid assignment submission ID" } },
            { name: "fails when assignmentSubmissionId is empty",                   value: { params: { userId: userId, courseId: courseId, assignmentSubmissionId: "  " }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "Invalid assignment submission ID" } },
            { name: "fails when assignmentSubmissionId is not the right format",    value: { params: { userId: userId, courseId: courseId, assignmentSubmissionId: "invalid-format" }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "Invalid assignment submission ID" } },
            { name: "fails when minScore is invalid",                               value: { body: { minScore: "invalid", maxScore: 100, achievedScore: 50}, params: defaultParams }, expectedStatus: 400, expectedResult: { message: "Invalid Grade structure" } },
            { name: "fails when maxScore is invalid",                               value: { body: { minScore: 0, maxScore: "invalid", achievedScore: 50 }, params: defaultParams }, expectedStatus: 400, expectedResult: { message: "Invalid Grade structure" } },
            { name: "fails when achievedScore is invalid",                          value: { body: { minScore: 0, maxScore: 100, achievedScore: "invalid" }, params: defaultParams }, expectedStatus: 400, expectedResult: { message: "Invalid Grade structure" } },

            // Logical errors
            { name: "fails when user does not exist",                               value: { params: { userId: "123e4567-e89b-12d3-a456-426614174000", courseId: courseId }, body: defaultBody }, expectedStatus: 404, expectedResult: { message: "User not found" } },
            { name: "fails when course does not exist",                             value: { params: { userId: userId, courseId: "123e4567-e89b-12d3-a456-426614174000" }, body: defaultBody }, expectedStatus: 404, expectedResult: { message: "Course not found" } },
            { name: "fails when assignment submission does not exist",              value: { params: { ...defaultParams, assignmentSubmissionId: "123e4567-e89b-12d3-a456-426614174000" }, body: defaultBody }, expectedStatus: 404, expectedResult: { message: "Assignment submission not found" } },
            { name: "fails when minScore is negative",                              value: { body: { minScore: -5, maxScore: 100, achievedScore: 50 }, params: defaultParams }, expectedStatus: 400, expectedResult: { message: "Invalid Grade structure" } },
            { name: "fails when maxScore is less than minScore",                    value: { body: { minScore: 10, maxScore: 5, achievedScore: 50 }, params: defaultParams }, expectedStatus: 400, expectedResult: { message: "Invalid max score" } },
            { name: "fails when achievedScore is less than minScore",               value: { body: { minScore: 20, maxScore: 100, achievedScore: 10 }, params: defaultParams }, expectedStatus: 400, expectedResult: { message: "Invalid achieved score" } },
            { name: "fails when achievedScore is greater than maxScore",            value: { body: { minScore: 0, maxScore: 100, achievedScore: 150 }, params: defaultParams }, expectedStatus: 400, expectedResult: { message: "Invalid achieved score" } },

            // Valid cases
            { name: "succeeds when assignmentSubmissionId is present",              value: { params: { ...defaultParams, assignmentSubmissionId: assignmentSubmissionId }, body: defaultBody }, expectedStatus: 201, expectedResult: { gradeId: expect.any(String), userId: defaultParams.userId, courseId: defaultParams.courseId, assignmentSubmissionId: assignmentSubmissionId, minScore: defaultBody.minScore, maxScore: defaultBody.maxScore, achievedScore: defaultBody.achievedScore } },
            { name: "succeeds when assignmentSubmissionId is not present",          value: { params: defaultParams, body: defaultBody }, expectedStatus: 201, expectedResult: {  gradeId: expect.any(String), userId: defaultParams.userId, courseId: defaultParams.courseId, assignmentSubmissionId: undefined, minScore: defaultBody.minScore, maxScore: defaultBody.maxScore, achievedScore: defaultBody.achievedScore  } },

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
        it("Should implement updateGrade method", async () => {});

        const gradeId = (): string => generalGrade.gradeId;
        const defaultBody = { minScore: 0, maxScore: 100, achievedScore: 50 };
        it.each([
            // Missing values
            { name: "fails when no values are passed",                      value: {  }, expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },
            { name: "fails when missing gradeId",                           value: { body: defaultBody }, expectedStatus: 400, expectedResult: { message: "Invalid grade structure" } },

            // Invalid values
            { name: "fails when gradeId is empty",                          value: { params: { gradeId: "   " }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when gradeId is a number",                       value: { params: { gradeId: 123 }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when gradeId is an invalid format",              value: { params: { gradeId: "invalid-format" }, body: defaultBody }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when minScore is invalid",                       value: { params: { gradeId: gradeId }, body: { minScore: "invalid", maxScore: 100, achievedScore: 50 } }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when maxScore is invalid",                       value: { params: { gradeId: gradeId }, body: { minScore: 0, maxScore: "invalid", achievedScore: 50 } }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when achievedScore is invalid",                  value: { params: { gradeId: gradeId }, body: { minScore: 0, maxScore: 100, achievedScore: "invalid" } }, expectedStatus: 400, expectedResult: { message: "" } },

            // Logical errors
            { name: "fails when grade does not exist",                      value: { params: { gradeId: "123e4567-e89b-12d3-a456-426614174000" } }, expectedStatus: 404, expectedResult: { message: "" } },
            { name: "fails when minScore is negative",                      value: { params: { gradeId: gradeId }, body: { minScore: -1, maxScore: 100, achievedScore: 50 } }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when maxScore is less than minScore",            value: { params: { gradeId: gradeId }, body: { minScore: 1, maxScore: 0, achievedScore: 50 } }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when achievedScore is less than minScore",       value: { params: { gradeId: gradeId }, body: { minScore: 1, maxScore: 100, achievedScore: 0 } }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when achievedScore is greater than maxScore",    value: { params: { gradeId: gradeId }, body: { minScore: 0, maxScore: 100, achievedScore: 101 } }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when updating maxScore below achievedScore",     value: { params: { gradeId: gradeId }, body: { maxScore: 40 } }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when updating minScore above achievedScore",     value: { params: { gradeId: gradeId }, body: { minScore: 60 } }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when updating minScore above maxScore",         value: { params: { gradeId: gradeId }, body: { minScore: 110 } }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when updating maxScore below minScore",         value: { params: { gradeId: gradeId }, body: { maxScore: -10 } }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when updating achievedScore below minScore",    value: { params: { gradeId: gradeId }, body: { achievedScore: 0 } }, expectedStatus: 400, expectedResult: { message: "" } },

            // Valid cases
            { name: "succeeds when updating minScore",                      value: { params: { gradeId: gradeId }, body: { minScore: 20 } }, expectedStatus: 200, expectedResult: {} },
            { name: "succeeds when updating maxScore",                      value: { params: { gradeId: gradeId }, body: { maxScore: 90 } }, expectedStatus: 200, expectedResult: {} },
            { name: "succeeds when updating achievedScore",                 value: { params: { gradeId: gradeId }, body: { achievedScore: 50 } }, expectedStatus: 200, expectedResult: {} },
            { name: "succeeds when updating all fields",                    value: { params: { gradeId: gradeId }, body: { minScore: 20, maxScore: 90, achievedScore: 50 } }, expectedStatus: 200, expectedResult: {} },

            // No changes
            { name: "succeeds when no fields are updated",                  value: {  }, expectedStatus: 200, expectedResult: {} },
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
        it("Should implement deleteGrade method", async () => {});

        it.each([
            // Missing values
            { name: "fails when missing gradeId",       value: {  }, expectedStatus: 400, expectedResult: { message: "" } },

            // Invalid values
            { name: "fails when gradeId is invalid",    value: {  }, expectedStatus: 400, expectedResult: { message: "" } },

            // Logical errors
            { name: "fails when grade does not exist",  value: {  }, expectedStatus: 404, expectedResult: { message: "" } },

            // Valid cases
            { name: "succeeds when grade exists",       value: {  }, expectedStatus: 200, expectedResult: {} },
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
        it("Should implement getAllGradesForUser method", async () => {});

        it.each([
            // Missing values
            { name: "fails when missing userId",                value: {  }, expectedStatus: 400, expectedResult: { message: "" } },

            // Invalid values
            { name: "fails when userId is invalid",             value: {  }, expectedStatus: 400, expectedResult: { message: "" } },

            // Logical errors
            { name: "fails when user does not exist",           value: {  }, expectedStatus: 404, expectedResult: { message: "" } },

            // Valid cases
            { name: "succeeds when user has no grades",         value: {  }, expectedStatus: 200, expectedResult: {} },
            { name: "succeeds when user has multiple grades",   value: {  }, expectedStatus: 200, expectedResult: {} },
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
        it("Should implement getAllGradesForCourse method", async () => {});

        it.each([
            // Missing values
            { name: "fails when missing courseId",                  value: {  }, expectedStatus: 400, expectedResult: { message: "" } },

            // Invalid values
            { name: "fails when courseId is invalid",               value: {  }, expectedStatus: 400, expectedResult: { message: "" } },

            // Logical errors
            { name: "fails when course does not exist",             value: {  }, expectedStatus: 404, expectedResult: { message: "" } },

            // Valid cases
            { name: "succeeds when course has no grades",           value: {  }, expectedStatus: 200, expectedResult: {} },
            { name: "succeeds when course has multiple grades",     value: {  }, expectedStatus: 200, expectedResult: {} },
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
        it("Should implement getAllGradesForUserInCourse method", async () => {});

        it.each([
            // Missing values
            { name: "fails when missing userId",                            value: {  }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when missing courseId",                          value: {  }, expectedStatus: 400, expectedResult: { message: "" } },

            // Invalid values
            { name: "fails when userId is invalid",                         value: {  }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when courseId is invalid",                       value: {  }, expectedStatus: 400, expectedResult: { message: "" } },

            // Logical errors
            { name: "fails when user does not exist",                       value: {  }, expectedStatus: 404, expectedResult: { message: "" } },
            { name: "fails when course does not exist",                     value: {  }, expectedStatus: 404, expectedResult: { message: "" } },

            // Valid cases
            { name: "succeeds when user has no grades in course",           value: {  }, expectedStatus: 200, expectedResult: {} },
            { name: "succeeds when user has multiple grades in course",     value: {  }, expectedStatus: 200, expectedResult: {} },
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
        it("Should implement getCalculatedGradeForUserInCourse method", async () => {});

        it.each([
            // Missing values
            { name: "fails when missing userId",                            value: {  }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when missing courseId",                          value: {  }, expectedStatus: 400, expectedResult: { message: "" } },

            // Invalid values
            { name: "fails when userId is invalid",                         value: {  }, expectedStatus: 400, expectedResult: { message: "" } },
            { name: "fails when courseId is invalid",                       value: {  }, expectedStatus: 400, expectedResult: { message: "" } },

            // Logical errors
            { name: "fails when user does not exist",                       value: {  }, expectedStatus: 404, expectedResult: { message: "" } },
            { name: "fails when course does not exist",                     value: {  }, expectedStatus: 404, expectedResult: { message: "" } },

            // Valid cases
            { name: "succeeds when user has no grades in course",           value: {  }, expectedStatus: 200, expectedResult: {} },
            { name: "succeeds when user has multiple grades in course",     value: {  }, expectedStatus: 200, expectedResult: {} },
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

    describe("Get the average of the grades in a course", () => {
        it("Should implement getAverageGradeForCourse method", async () => {});

        it.each([
            // Missing values
            { name: "fails when missing courseId",                  value: {  }, expectedStatus: 400, expectedResult: { message: "" } },

            // Invalid values
            { name: "fails when courseId is invalid",               value: {  }, expectedStatus: 400, expectedResult: { message: "" } },

            // Logical errors
            { name: "fails when course does not exist",             value: {  }, expectedStatus: 404, expectedResult: { message: "" } },

            // Valid cases
            { name: "succeeds when course has no grades",           value: {  }, expectedStatus: 200, expectedResult: {} },
            { name: "succeeds when course has multiple grades",     value: {  }, expectedStatus: 200, expectedResult: {} },
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

    // Resolve any functions inside expectedResult so assertions compare concrete values
    if (expectedResult && typeof expectedResult === "object") {
        const resolved = { ...(expectedResult as any) } as any;
        for (const [k, v] of Object.entries(resolved)) {
            if (typeof v === "function") resolved[k] = v();
        }
        expectedResult = resolved;
    }
    if (resolvedValue.params && typeof resolvedValue.params.gradeId === "function") {
        resolvedValue.params = { ...resolvedValue.params, gradeId: resolvedValue.params.gradeId() };
    }

    return { fixedValue: resolvedValue, fixedExpectedResult: expectedResult };
}