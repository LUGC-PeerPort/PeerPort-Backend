import { TestDataSource } from "./test-data-source.js";
import { UserController } from "../Controllers/UserController.js";
import { User } from "../Database/entities/User.js";

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

    it("Temp test", async () => {
        expect(true).toBe(true);
    });
});
