import { TestDataSource } from "./test-data-source";
import { UserController } from "../Controllers/UserController";
import { User } from "../Database/entities/User";

describe("UserController w test DB", () => {
    let controller: UserController;

    beforeAll(async () => {
        await TestDataSource.initialize();
        const userRepo = TestDataSource.getRepository(User);
        controller = new UserController(userRepo);

        // Create a role for the user to use
        await TestDataSource.getRepository("Role").save({ name: "student" });
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });

    it("Should create a user", async () => {
        const status = jest.fn().mockReturnThis();
        const json = jest.fn();
        
        await controller.create(
            {
                body: { 
                    name: "Test User", 
                    email: "testuser@example.com", 
                    password: "test", 
                    idNumber: "smth", 
                    role: { 
                        name: "student"
                    }
                }
            } as any,
            { status, json } as any
        );

        const users = await TestDataSource.getRepository("User").find();
        expect(users.length).toBe(1);
        expect(users[0].name).toBe("Test User");
        expect(users[0].email).toBe("testuser@example.com");
    });
});
