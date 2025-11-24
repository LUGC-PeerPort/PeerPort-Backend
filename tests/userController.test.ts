import { TestDataSource } from "./test-data-source.js";
import { UserController } from "../src/Controllers/UserController.js";

describe("UserController test:", () => {
    let controller: UserController;

    beforeAll(async () => {
        await TestDataSource.initialize();
        controller = new UserController(TestDataSource);

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

    describe("Getting all users from the database", () => {
        it("Should get an empty array when there are no users", async () => {
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllUsers(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it("Should get an array of users when there are users", async () => {
            // First, create a user to get
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                password: "securepassword",
                profilePictureUrl: null,
                idNumber: "123456789smth",
            });
            const req: any = {};
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getAllUsers(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([expect.objectContaining({
                userId: user.userId,
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: null,
                idNumber: "123456789smth",
            })]);
        });
    });

    describe("Create a user in the database", () => {
        it("Should not create a user with an invalid structure", async () => {
            const req: any = {
                body: {
                    smth: "Test User",
                    email: "",
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.create(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user structure" });
        });

        it("Should not create a user with less than 2 characters in the name", async () => {
            const req: any = {
                body: {
                    name: "T",
                    email: "testuser@example.com",
                    profilePictureUrl: undefined,
                    idNumber: "123456789smth",
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.create(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user structure" });
        });

        it("Should not create a user with no name", async () => {
            const req: any = {
                body: {
                    email: "testinguser@example.com",
                    profilePictureUrl: undefined,
                    idNumber: "123456789smth",
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.create(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user structure" });
        });

        it("Should not create a user with an invalid email", async () => {
            const req: any = {
                body: {
                    name: "Test User",
                    email: "notanemail",
                    profilePictureUrl: undefined,
                    idNumber: "123456789smth",
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.create(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user structure" });
        });

        it("Should not create a user with an empty email", async () => {
            const req: any = {
                body: {
                    name: "Test User",
                    email: "",
                    profilePictureUrl: undefined,
                    idNumber: "123456789smth",
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.create(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user structure" });
        });

        it("Should not create a user with no email", async () => {
            const req: any = {
                body: {
                    name: "Test User",
                    profilePictureUrl: undefined,
                    idNumber: "123456789smth",
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.create(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user structure" });
        });

        it("Should not create a user with an empty id number", async () => {
            const req: any = {
                body: {
                    name: "Test User",
                    email: "testuser@example.com",
                    profilePictureUrl: undefined,
                    idNumber: "",
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.create(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user structure" });
        });

        it("Should not create a user when the same email already exists", async () => {
            // First, create a user
            await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: null,
                idNumber: "123456789smth",
            });

            const req: any = {
                body: {
                    name: "Another User",
                    email: "testuser@example.com",
                    profilePictureUrl: undefined,
                    idNumber: "987654321smth",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.create(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ message: "Email already in use" });
        });

        it("Should create a user with valid data", async () => {
            const req: any = {
                body: {
                    name: "Test User",
                    email: "testuser@example.com",
                    profilePictureUrl: undefined,
                    idNumber: "123456789smth",
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);

            await controller.create(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                userId: expect.any(String),
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: null,
                idNumber: "123456789smth",
            }));

            // Ensure password is not returned in the response
            expect(res.json.mock.calls[0][0].password).toBeUndefined();

            // Verify that the user was actually created in the database
            const user = await TestDataSource.getRepository("User").findOneBy({ email: "testuser@example.com" });
            expect(user).toBeDefined();
            expect(user).toMatchObject({
                userId: expect.any(String),
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: null,
                idNumber: "123456789smth",
            });
        });
    });

    describe("Get a user profile from the database", () => {
        it("Should not get a user with an invalid ID", async () => {
            const req: any = {
                params: {
                    userId: "invalid-uuid"
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
        });

        it("Should not get a user that does not exist", async () => {
            const req: any = {
                params: {
                    userId: "123e4567-e89b-12d3-a456-426614174000"
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it("Should get a user that does exist", async () => {
            // Get the role to assign to the user
            const role = await TestDataSource.getRepository("Role").findOneBy({ name: "student" });
            
            // First, create a user to get
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
                role: role,
            });

            const req: any = {
                params: {
                    userId: user.userId
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                userId: user.userId,
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: null,
                idNumber: "123456789smth",
                role: {
                    name: "student"
                },
                courses: [],
            }));
        });

        it("Should get a user and their courses", async () => {
            // Get the role to assign to the user
            const role = await TestDataSource.getRepository("Role").findOneBy({ name: "student" });
            // First, create a user to get
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: null,
                idNumber: "123456789smth",
                role: role,
            });

            // Then, create a course for the user
            const course = await TestDataSource.getRepository("Course").save({
                name: "Test Course",
                courseCode: "TC101",
                isOpen: true,
                description: "This is a test course",
                startDate: "2023-01-01",
                endDate: "2023-06-01",
            });

            // Enroll the user in the course
            const enrolledData = await TestDataSource.getRepository("UsersToCourses").save({
                user: user,
                course: course,
            });

            const req: any = {
                params: {
                    userId: user.userId
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                userId: user.userId,
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: null,
                idNumber: "123456789smth",
                role: {
                    name: "student"
                },
                courses: [expect.objectContaining({
                    courseId: course.courseId,
                    name: "Test Course",
                    courseCode: "TC101",
                    isOpen: true,
                    description: "This is a test course",
                    startDate: "2023-01-01",
                    endDate: "2023-06-01",
                    enrolledOn: enrolledData.enrolledOn,
                })],
            }));
        });
    });

    describe("Update a user profile in the database", () => {
        it("Should not update a user with an invalid ID", async () => {
            const req: any = {
                params: {
                    userId: "invalid-uuid"
                },
                body: {
                    name: "Updated User"
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
        });

        it("Should not update a user that does not exist", async () => {
            const req: any = {
                params: {
                    userId: "123e4567-e89b-12d3-a456-426614174000"
                },
                body: {
                    name: "Updated User"
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it("Should not update a user with an invalid structure", async () => {
            // First, create a user to update
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    userId: user.userId
                },
                body: {
                    namee: "Updated User"
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user structure" });
        });

        it("Should not update a user with no body", async () => {
            // First, create a user to update
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    userId: user.userId
                },
                body: {}
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user structure" });
        });

        it("Should update a user with no change to name or email", async () => {
            // First, create a user to update
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
            });
            const req: any = {
                params: {
                    userId: user.userId
                },
                body: {
                    profilePictureUrl: "smth/smth"
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                userId: user.userId,
                name: "Test User",
                email: "testuser@example.com"
            }));
        });

        it("Should update a user with valid data", async () => {
            // First, create a user to update
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    userId: user.userId
                },
                body: {
                    name: "Updated User",
                    email: "updateduser@example.com",
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.updateProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                userId: user.userId,
                name: "Updated User",
                email: "updateduser@example.com",
                profilePictureUrl: null,
                idNumber: "123456789smth",
            }));
            // Ensure password is not returned in the response
            expect(res.json.mock.calls[0][0].password).toBeUndefined();

            // Verify that the user was actually updated in the database
            const updatedUser = await TestDataSource.getRepository("User").findOneBy({ userId: user.id });
            expect(updatedUser).toBeDefined();
            expect(updatedUser).toMatchObject({
                userId: user.userId,
                name: "Updated User",
                email: "updateduser@example.com",
                profilePictureUrl: null,
                idNumber: "123456789smth",
            });
        });
    });

    describe("Delete a user profile from the database", () => {
        it("Should not delete a user with an invalid ID", async () => {
            const req: any = {
                params: {
                    userId: "invalid-uuid"
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
        });

        it("Should delete a user that does exist", async () => {
            // First, create a user to delete
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    userId: user.userId
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" });

            // Verify that the user was actually deleted from the database
            const deletedUser = await TestDataSource.getRepository("User").findOneBy({ userId: user.id });
            expect(deletedUser).toBeNull();
        });
    });

    describe("Get a user's courses from the database", () => {
        it("Should not get courses for a user with an invalid ID", async () => {
            const req: any = {
                params: {
                    userId: "invalid-uuid"
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
        });

        it("Should not get courses for a user that does not exist", async () => {
            const req: any = {
                params: {
                    userId: "123e4567-e89b-12d3-a456-426614174070"
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourses(req, res);

            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("Should get courses for a user that does exist", async () => {
            // First, create a user to get
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
            });

            const course = await TestDataSource.getRepository("Course").save({
                name: "Test Course",
                description: "This is a test course",
                startDate: "2023-01-01",
                endDate: "2023-06-01",
                isOpen: true,
                courseCode: "TC101",
            });

            const linkData = await TestDataSource.getRepository("UsersToCourses").save({
                user: user,
                course: course,
            });

            const req: any = {
                params: {
                    userId: user.userId
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ ...course, enrolledOn: linkData.enrolledOn }]);
        });

        it("Should get an empty array for a user with no courses", async () => {
            // First, create a user to get
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
            });
            const req: any = {
                params: {
                    userId: user.userId
                }
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    describe("Get a user's course from the database", () => {
        it("Should not get a course for a user with an invalid user ID", async () => {
            const req: any = {
                params: {
                    userId: "invalid-uuid",
                    courseId: "123e4567-e89b-12d3-a456-426614174000"
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid user ID" });
        });

        it("Should not get a course for a user that does not exist", async () => {
            const req: any = {
                params: {
                    userId: "123e4567-e89b-12d3-a456-426614174000",
                    courseId: "123e4567-e89b-12d3-a456-426614174000"
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it("Should not get a course for a user with an invalid course ID", async () => {
            // Make a user
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
            });
            const req: any = {
                params: {
                    userId: user.userId,
                    courseId: "invalid-uuid"
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid course ID" });
        });

        it("Should not get a course for a user that is not enrolled in the course", async () => {
            // First, create a user to get
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
            });

            const course = await TestDataSource.getRepository("Course").save({
                name: "Test Course",
                description: "This is a test course",
                startDate: "2023-01-01",
                endDate: "2023-06-01",
                isOpen: true,
                courseCode: "TC101",
            });

            const req: any = {
                params: {
                    userId: user.userId,
                    courseId: course.courseId
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Course not found for user" });
        });

        it("Should get a course for a user that is enrolled in the course", async () => {
            // First, create a user to get
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
            });

            const course = await TestDataSource.getRepository("Course").save({
                name: "Test Course",
                description: "This is a test course",
                startDate: "2023-01-01",
                endDate: "2023-06-01",
                isOpen: true,
                courseCode: "TC101",
            });

            // Enroll the user in the course
            const linkData = await TestDataSource.getRepository("UsersToCourses").save({
                user: user,
                course: course,
            });

            const req: any = {
                params: {
                    userId: user.userId,
                    courseId: course.courseId
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ ...course, enrolledOn: linkData.enrolledOn });
        });
    });

    describe("Getting the current user that is logged in", () => {

        it.each([
            { name: "fail when there is no session",                            value: {  },                                                                            expectedStatus: 401, expectedResult: { message: "Unauthorized" } },
            { name: "fail when the session is malformed",                       value: { session: {  } },                                                               expectedStatus: 401, expectedResult: { message: "Unauthorized" } },
            { name: "fail when the current user is not logged in",              value: { session: { passport: {  } } },                                                 expectedStatus: 401, expectedResult: { message: "Unauthorized" } },
            { name: "fail when the current user ID is null",                    value: { session: { passport: { user: null } } },                                       expectedStatus: 401, expectedResult: { message: "Unauthorized" } },
            { name: "fail when the current user doesn't exist",                 value: { session: { passport: { user: "123e4567-e89b-12d3-a456-426618874000" } } },     expectedStatus: 401, expectedResult: { message: "Unauthorized" } }
        ])("Authentication should $name", async ({name: _name, value, expectedStatus, expectedResult}) => {
            const req: any = value;
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCurrentUser(req, res);

            expect(res.status).toHaveBeenCalledWith(expectedStatus);
            expect(res.json).toHaveBeenCalledWith(expectedResult);
        });

        it("Should get the current logged in user", async () => {
            const role = await TestDataSource.getRepository("Role").save({
                name: "tester"
            });

            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                password: "securepassword",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
                role: role,
            });

            const req: any = {
                session: {
                    passport: {
                        user: user.userId,
                    }
                },
            };
            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCurrentUser(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                userId: user.userId,
                roleId: user.role.roleId
            });
        });
    });


    describe("checkUserStructure function tests", () => {
        it("Should return false for a null object", () => {
            const result = (controller as any).checkUserStructure(null);
            expect(result).toBe(false);
        });
        
        it("Should return false for an empty object", () => {
            const result = (controller as any).checkUserStructure({});
            expect(result).toBe(false);
        });
        
        it("Should return false for unnecessary fields", () => {
            const result = (controller as any).checkUserStructure({
                invalidField: "This should not be here",
            });
            expect(result).toBe(false);
        });
        
        it("Should return false for valid fields with extra unnecessary fields", () => {
            const result = (controller as any).checkUserStructure({
                name: "Valid Name",
                email: "valid.email@example.com",
                idNumber: "123456789",
                profilePictureUrl: "http://example.com/profile.jpg",
                extraField: "This should not be here",
            });
            expect(result).toBe(false);
        });



        describe("Name tests", () => {
            const basicValues = {
                email: "valid.email@example.com",
                idNumber: "123456789",
                profilePictureUrl: "http://example.com/profile.jpg",
            };
            it.each([
                { name: "Missing name should return false", data: basicValues, expected: false, isUpdate: false },
                { name: "Empty name should return false", data: { name: "  ", ...basicValues }, expected: false, isUpdate: false },
                { name: "Non-string name should return false", data: { name: 123, ...basicValues }, expected: false, isUpdate: false },
                { name: "Too short name should return false", data: { name: "A", ...basicValues }, expected: false, isUpdate: false },

                { name: "Missing name while updating should return true", data: { ...basicValues }, expected: true, isUpdate: true },
                { name: "Empty name while updating should return false", data: { name: "  ", ...basicValues }, expected: false, isUpdate: true },
                { name: "Non-string name while updating should return false", data: { name: 123, ...basicValues }, expected: false, isUpdate: true },
                { name: "Too short name while updating should return false", data: { name: "A", ...basicValues }, expected: false, isUpdate: true },

            ])("$name", ({ name: _name, data, expected, isUpdate }) => {
                expect((controller as any).checkUserStructure(data, isUpdate)).toBe(expected);
            });
        });

        describe("Email tests", () => {
            const basicValues = {
                name: "Valid Name",
                idNumber: "123456789",
                profilePictureUrl: "http://example.com/profile.jpg",
            };

            it.each([
                { name: "Should return false for missing email", data: basicValues, expected: false, isUpdate: false },
                { name: "Should return false for empty email", data: { email: "   ", ...basicValues }, expected: false, isUpdate: false },
                { name: "Should return false for a non-string email", data: { email: 12345, ...basicValues }, expected: false, isUpdate: false },
                { name: "Should return false for an invalid email format", data: { email: "invalid-email", ...basicValues }, expected: false, isUpdate: false },

                { name: "Should return true for missing email while updating", data: basicValues, expected: true, isUpdate: true },
                { name: "Should return false for a non-string email while updating", data: { email: 12345, ...basicValues }, expected: false, isUpdate: true },
                { name: "Should return false for an invalid email format while updating", data: { email: "invalid-email", ...basicValues }, expected: false, isUpdate: true },
                { name: "Should return true for valid email", data: { email: "valid.email@example.com", ...basicValues }, expected: true, isUpdate: false },
            ])("$name", ({ name: _name, data, expected, isUpdate }) => {
                expect((controller as any).checkUserStructure(data, isUpdate)).toBe(expected);
            });
        });

        describe("idNumber tests", () => {
            const basicValues = {
                name: "Valid Name",
                email: "valid.email@example.com",
                profilePictureUrl: "http://example.com/profile.jpg",
            };

            it.each([
                { name: "Should return false for missing idNumber", data: basicValues, expected: false, isUpdate: false },
                { name: "Should return false for empty idNumber", data: { idNumber: "   ", ...basicValues }, expected: false, isUpdate: false },
                { name: "Should return false for a non-string idNumber", data: { idNumber: 123456789, ...basicValues }, expected: false, isUpdate: false },
                { name: "Should return true for valid idNumber", data: { idNumber: "123456789", ...basicValues }, expected: true, isUpdate: false },

                { name: "Should return false for a non-string idNumber while updating", data: { idNumber: 123456789, ...basicValues }, expected: false, isUpdate: true },
                { name: "Should return false for an empty idNumber while updating", data: { idNumber: "   ", ...basicValues }, expected: false, isUpdate: true },
                { name: "Should return true for missing idNumber while updating", data: basicValues, expected: true, isUpdate: true },
                { name: "Should return true for valid idNumber", data: { idNumber: "123456789", ...basicValues }, expected: true, isUpdate: true },
            ])("$name", ({ name: _name, data, expected, isUpdate }) => {
                expect((controller as any).checkUserStructure(data, isUpdate)).toBe(expected);
            });
        });

        describe("profilePictureUrl tests", () => {
            const basicValues = {
                name: "Valid Name",
                email: "valid.email@example.com",
                idNumber: "123456789",
            };

            it.each([
                { name: "Should return false for empty profilePictureUrl", data: { profilePictureUrl: "   ", ...basicValues }, expected: false, isUpdate: false },
                { name: "Should return false for a non-string profilePictureUrl", data: { profilePictureUrl: 12345, ...basicValues }, expected: false, isUpdate: false },
                { name: "Should return false for an URL that is too short", data: { profilePictureUrl: "a", ...basicValues }, expected: false, isUpdate: false },
                { name: "Should return true for missing profilePictureUrl", data: basicValues, expected: true, isUpdate: false },

                { name: "Should return true for missing profilePictureUrl while updating", data: basicValues, expected: true, isUpdate: true },
                { name: "Should return false for a non-string profilePictureUrl while updating", data: { profilePictureUrl: 12345, ...basicValues }, expected: false, isUpdate: true },
                { name: "Should return false for a URL that is too short while updating", data: { profilePictureUrl: "a", ...basicValues }, expected: false, isUpdate: true },
                { name: "Should return true for valid profilePictureUrl while updating", data: { profilePictureUrl: "http://example.com/profile.jpg", ...basicValues }, expected: true, isUpdate: true },
            ])("$name", ({ name: _name, data, expected, isUpdate }) => {
                expect((controller as any).checkUserStructure(data, isUpdate)).toBe(expected);
            });
        });

        it("Should return true for valid fields", () => {
            const result = (controller as any).checkUserStructure({
                name: "Valid Name",
                email: "valid.email@example.com",
                idNumber: "123456789",
                profilePictureUrl: "http://example.com/profile.jpg",
            });
            expect(result).toBe(true);
        });
    });

    describe("userReturn function tests", () => {
        it("Should correctly parse a User entity to UserReturn type", () => {
            const result = (controller as any).userReturn({
                userId: "123e4567-e89b-12d3-a456-426614174000",
                name: "Test User",
                email: "test.user@example.com",
                profilePictureUrl: "http://example.com/profile.jpg",
                idNumber: "123456789",
                role: { name: "student" },
                courses: [
                    {
                        enrolledOn: new Date("2023-01-01"),
                        course: {
                            courseId: "987e6543-e21b-12d3-a456-426614174000",
                            name: "Test Course",
                            courseCode: "TC101",
                            isOpen: true,
                            description: "This is a test course",
                            startDate: "2023-01-01",
                            endDate: "2023-06-01",
                        }
                    }
                ],
            });
            expect(result).toEqual({
                userId: "123e4567-e89b-12d3-a456-426614174000",
                name: "Test User",
                email: "test.user@example.com",
                profilePictureUrl: "http://example.com/profile.jpg",
                idNumber: "123456789",
                role: { name: "student" },
                courses: [
                    {
                        courseId: "987e6543-e21b-12d3-a456-426614174000",
                        name: "Test Course",
                        courseCode: "TC101",
                        isOpen: true,
                        description: "This is a test course",
                        startDate: "2023-01-01",
                        endDate: "2023-06-01",
                        enrolledOn: new Date("2023-01-01"),
                    }
                ]
            });
        });

        describe("Optional fields tests", () => {
            const baseData = {
                userId: "123e4567-e89b-12d3-a456-426614174000",
                name: "Test User",
                email: "test.user@example.com",
                idNumber: "123456789",
            };
            const courseBase = {
                course: {
                    courseId: "987e6543-e21b-12d3-a456-426614174000",
                    name: "Test Course",
                    courseCode: "TC101",
                    isOpen: true,
                },
                enrolledOn: new Date("2023-01-01"),
            };
            it.each([
                {
                    name: "Should handle undefined profilePictureUrl",
                    data: { ...baseData, profilePictureUrl: undefined },
                    expected: { ...baseData, profilePictureUrl: null, role: undefined, courses: [] }
                },
                {
                    name: "Should handle null profilePictureUrl",
                    data: { ...baseData, profilePictureUrl: null },
                    expected: { ...baseData, profilePictureUrl: null, role: undefined, courses: [] }
                },
                {
                    name: "Should handle undefined roles",
                    data: { ...baseData, role: undefined },
                    expected: { ...baseData, profilePictureUrl: null, role: undefined, courses: [] }
                },
                {
                    name: "Should handle undefined courses",
                    data: { ...baseData, courses: undefined },
                    expected: { ...baseData, profilePictureUrl: null, role: undefined, courses: [] }
                },
                {
                    name: "Should handle null courses",
                    data: { ...baseData, courses: null },
                    expected: { ...baseData, profilePictureUrl: null, role: undefined, courses: [] }
                },
                {
                    name: "Should handle undefined descriptions in courses",
                    data: {
                        ...baseData,
                        courses: [
                            { ...courseBase, course: { ...courseBase.course, description: undefined } }
                        ]
                    },
                    expected: {
                        ...baseData,
                        profilePictureUrl: null,
                        role: undefined,
                        courses: [
                            {
                                courseId: courseBase.course.courseId,
                                name: courseBase.course.name,
                                courseCode: courseBase.course.courseCode,
                                isOpen: courseBase.course.isOpen,
                                description: undefined,
                                startDate: (courseBase.course as any).startDate,
                                endDate: (courseBase.course as any).endDate ?? undefined,
                                enrolledOn: courseBase.enrolledOn,
                            }
                        ]
                    }
                },
                {
                    name: "Should handle null descriptions in courses",
                    data: {
                        ...baseData,
                        courses: [
                            { ...courseBase, course: { ...courseBase.course, description: null } }
                        ]
                    },
                    expected: {
                        ...baseData,
                        profilePictureUrl: null,
                        role: undefined,
                        courses: [
                            {
                                courseId: courseBase.course.courseId,
                                name: courseBase.course.name,
                                courseCode: courseBase.course.courseCode,
                                isOpen: courseBase.course.isOpen,
                                description: undefined,
                                startDate: (courseBase.course as any).startDate,
                                endDate: (courseBase.course as any).endDate ?? undefined,
                                enrolledOn: courseBase.enrolledOn,
                            }
                        ]
                    }
                },
                {
                    name: "Should handle undefined endDate in courses",
                    data: {
                        ...baseData,
                        courses: [
                            { ...courseBase, course: { ...courseBase.course, endDate: undefined } }
                        ]
                    },
                    expected: {
                        ...baseData,
                        profilePictureUrl: null,
                        role: undefined,
                        courses: [
                            {
                                courseId: courseBase.course.courseId,
                                name: courseBase.course.name,
                                courseCode: courseBase.course.courseCode,
                                isOpen: courseBase.course.isOpen,
                                description: (courseBase.course as any).description ?? undefined,
                                startDate: (courseBase.course as any).startDate,
                                endDate: undefined,
                                enrolledOn: courseBase.enrolledOn,
                            }
                        ]
                    }
                },
                {
                    name: "Should handle null endDate in courses",
                    data: {
                        ...baseData,
                        courses: [
                            { ...courseBase, course: { ...courseBase.course, endDate: null } }
                        ]
                    },
                    expected: {
                        ...baseData,
                        profilePictureUrl: null,
                        role: undefined,
                        courses: [
                            {
                                courseId: courseBase.course.courseId,
                                name: courseBase.course.name,
                                courseCode: courseBase.course.courseCode,
                                isOpen: courseBase.course.isOpen,
                                description: (courseBase.course as any).description ?? undefined,
                                startDate: (courseBase.course as any).startDate,
                                endDate: undefined,
                                enrolledOn: courseBase.enrolledOn,
                            }
                        ]
                    }
                },
            ])("$name", ({ name: _name, data, expected }) => {
                const result = (controller as any).userReturn(data);
                expect(result).toEqual(expected);
            });
        });
    });

    describe("courseReturn function tests", () => {
        it("Should correctly parse a Course entity to CourseReturn type", () => {
            const result = (controller as any).courseReturn({
                courseId: "987e6543-e21b-12d3-a456-426614174000",
                name: "Test Course",
                courseCode: "TC101",
                isOpen: true,
                description: "This is a test course",
                startDate: "2023-01-01",
                endDate: "2023-06-01",
                enrolledOn: new Date("2023-01-01"),
            });
            expect(result).toEqual({
                courseId: "987e6543-e21b-12d3-a456-426614174000",
                name: "Test Course",
                courseCode: "TC101",
                isOpen: true,
                description: "This is a test course",
                startDate: "2023-01-01",
                endDate: "2023-06-01",
                enrolledOn: new Date("2023-01-01"),
            });
        });

        describe("Optional fields tests", () => {
            const baseData = {
                courseId: "987e6543-e21b-12d3-a456-426614174000",
                name: "Test Course",
                courseCode: "TC101",
                isOpen: true,
                startDate: "2023-01-01",
                enrolledOn: new Date("2023-01-01"),
            };
            it.each([
                { name: "Should handle undefined description", data: { ...baseData, description: undefined }, expected: { ...baseData, description: undefined, endDate: undefined } },
                { name: "Should handle null description", data: { ...baseData, description: null }, expected: { ...baseData, description: undefined, endDate: undefined } },
                { name: "Should handle undefined endDate", data: { ...baseData, endDate: undefined }, expected: { ...baseData, description: (baseData as any).description ?? undefined, endDate: undefined } },
                { name: "Should handle null endDate", data: { ...baseData, endDate: null }, expected: { ...baseData, description: (baseData as any).description ?? undefined, endDate: undefined } },
            ])("$name", ({ name: _name, data, expected }) => {
                expect((controller as any).courseReturn(data)).toEqual(expected);
            });
        });
    });
});
