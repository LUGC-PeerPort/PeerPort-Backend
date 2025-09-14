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

        it("Should not create a user with less than 2 chacracters in the name", async () => {
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
            await TestDataSource.destroy();
            await TestDataSource.initialize();
            controller = new UserController(TestDataSource);

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
        });
    });
});
