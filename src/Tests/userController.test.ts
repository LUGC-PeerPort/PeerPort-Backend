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
        await TestDataSource.getRepository("User").clear();
    });

    afterAll(async () => {
        await TestDataSource.destroy();
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
                    profilePictureURL: "",
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
                    profilePictureURL: "",
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
                    profilePictureURL: "",
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
                    profilePictureURL: "",
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
                    profilePictureURL: "",
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
                    profilePictureURL: "",
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
                    profilePictureURL: "",
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

        it("Should create a user with valid data", async () => {
            const req: any = {
                body: {
                    name: "Test User",
                    email: "testuser@example.com",
                    password: "securepassword",
                    profilePictureURL: "",
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
                password: "securepassword",
                profilePictureUrl: null,
                idNumber: "123456789smth",
            }));

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
                role: undefined,
                classes: undefined,
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
            // First, create a user to get
            const user = await TestDataSource.getRepository("User").save({
                name: "Test User",
                email: "testuser@example.com",
                password: "securepassword",
                profilePictureURL: "",
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    id: user.id
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                userId: user.id,
                name: "Test User",
                email: "testuser@example.com",
                password: "securepassword",
                profilePictureUrl: null,
                idNumber: "123456789smth",
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
                profilePictureURL: "",
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    id: user.id
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
                profilePictureURL: "",
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    id: user.id
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
                profilePictureURL: "",
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    id: user.id
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
                userId: user.id,
                name: "Updated User",
                email: "updateduser@example.com",
                password: "securepassword",
                profilePictureUrl: null,
                idNumber: "123456789smth",
            }));

            // Verify that the user was actually updated in the database
            const updatedUser = await TestDataSource.getRepository("User").findOneBy({ userId: user.id });
            expect(updatedUser).toBeDefined();
            expect(updatedUser).toMatchObject({
                userId: user.id,
                name: "Updated User",
                email: "updateduser@example.com",
                password: "securepassword",
                profilePictureUrl: null,
                idNumber: "123456789smth",
                role: undefined,
                classes: undefined,
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
                profilePictureURL: "",
                idNumber: "123456789smth",
            });

            const req: any = {
                params: {
                    id: user.id
                }
            };

            const res: any = {};
            res.status = jest.fn().mockReturnValue(res);
            res.json = jest.fn().mockReturnValue(res);
            await controller.deleteProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" });

            // Verify that the user was actually deleted from the database
            const deletedUser = await TestDataSource.getRepository("User").findOneBy({ userId: user.id });
            expect(deletedUser).toBeNull();
        });
    });
});
