import { User } from "./Database/entities/User.js";
import express from "express";
import { AppDataSource } from "./Database/DB.js";
import { UserController } from "./Controllers/UserController.js";
import { Class } from "./Database/entities/Class.js";

const app = express();
app.use(express.json());

// Check if the enviroment variables are set
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error("Database environment variables are not set.");
    process.exit(1);
}

AppDataSource.initialize().then(() => {
    const userRepo = AppDataSource.getRepository(User);
    const courseRepo = AppDataSource.getRepository(Class);
    const userController = new UserController(userRepo, courseRepo);

    app.get("/users", (req, res) => userController.getAllUsers(req, res));
    app.post("/users", (req, res) => userController.create(req, res));
});

app.listen(3000, () => {
    console.log("Server is running on port 3000 at http://localhost:3000/");
});

export default app;