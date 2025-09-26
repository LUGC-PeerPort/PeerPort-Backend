import { TestDataSource } from "./test-data-source.js";
import { UserController } from "../Controllers/UserController.js";

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
                profilePictureUrl: "",
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
                    namee: "Test User",
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
                    password: "securepassword",
                    profilePictureUrl: "",
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
                    password: "securepassword",
                    profilePictureUrl: "",
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
                    password: "securepassword",
                    profilePictureUrl: "",
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
                    password: "securepassword",
                    profilePictureUrl: "",
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
                    password: "securepassword",
                    profilePictureUrl: "",
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

        it("Should not create a user with an empty password", async () => {
            const req: any = {
                body: {
                    name: "Test User",
                    email: "testuser@example.com",
                    password: "",
                    profilePictureUrl: "",
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
                    password: "securepassword",
                    profilePictureUrl: "",
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
                password: "securepassword",
                profilePictureUrl: null,
                idNumber: "123456789smth",
            });

            const req: any = {
                body: {
                    name: "Another User",
                    email: "testuser@example.com",
                    password: "anotherpassword",
                    profilePictureUrl: "",
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
                    password: "securepassword",
                    profilePictureUrl: "",
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
                password: "securepassword",
                profilePictureUrl: null,
                idNumber: "123456789smth",
            });
        });
    });

    describe("Get a user profile from the database", () => {
        it("Should not get a user with an invalid ID", async () => {
            const req: any = {
                params: {
                    id: "invalid-uuid"
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
                    id: "123e4567-e89b-12d3-a456-426614174000"
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
                password: "securepassword",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
                role: role,
            });

            const req: any = {
                params: {
                    id: user.userId
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
                password: "securepassword",
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
                    id: user.userId
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
                    id: "invalid-uuid"
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
                    id: "123e4567-e89b-12d3-a456-426614174000"
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
                password: "securepassword",
                profilePictureUrl: "",
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    id: user.userId
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
                password: "securepassword",
                profilePictureUrl: "",
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    id: user.userId
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

        it("Should update a user with valid data", async () => {
            // First, create a user to update
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                password: "securepassword",
                profilePictureUrl: undefined,
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    id: user.userId
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
                password: "securepassword",
                profilePictureUrl: null,
                idNumber: "123456789smth",
            });
        });
    });

    describe("Delete a user profile from the database", () => {
        it("Should not delete a user with an invalid ID", async () => {
            const req: any = {
                params: {
                    id: "invalid-uuid"
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
                password: "securepassword",
                profilePictureUrl: "",
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    id: user.userId
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
                    id: "invalid-uuid"
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
                    id: "123e4567-e89b-12d3-a456-426614174000"
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it("Should get courses for a user that does exist", async () => {
            // First, create a user to get
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                password: "securepassword",
                profilePictureUrl: "",
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
                    id: user.userId
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ ...course, enrolledOn: linkData.enrolledOn }]);
        });
    });

    describe("Get a user's course from the database", () => {
        it("Should not get a course for a user with an invalid user ID", async () => {
            const req: any = {
                params: {
                    id: "invalid-uuid",
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
                    id: "123e4567-e89b-12d3-a456-426614174000",
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
                password: "securepassword",
                profilePictureUrl: "",
                idNumber: "123456789smth",
            });
            const req: any = {
                params: {
                    id: user.userId,
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
                password: "securepassword",
                profilePictureUrl: "",
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
                    id: user.userId,
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
                password: "securepassword",
                profilePictureUrl: "",
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
                    id: user.userId,
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
});
