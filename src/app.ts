import { User } from "./Database/entities/User.js";
import express from "express";
import { AppDataSource } from "./Database/DB.js";
import { UserController } from "./Controllers/UserController.js";

const app = express();
app.use(express.json());

AppDataSource.initialize().then(() => {
    const userRepo = AppDataSource.getRepository(User);
    const userController = new UserController(userRepo);

    app.get("/users", (req, res) => userController.getAllUsers(req, res));
    app.post("/users", (req, res) => userController.create(req, res));
})

export default app;