import express from "express";
import { AppDataSource } from "./Database/DB.js";
import { UserController } from "./Controllers/UserController.js";
import { CourseController } from "./Controllers/CourseController.js";

const app = express();
app.use(express.json());

// Check if the enviroment variables are set
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error("Database environment variables are not set.");
    process.exit(1);
}

AppDataSource.initialize().then(() => {
    const userController = new UserController(AppDataSource);
    const courseController = new CourseController(AppDataSource);

    // Define routes
    app.get("/users", (req, res) => userController.getAllUsers(req, res));
    app.post("/users", (req, res) => userController.create(req, res));
    app.get("/users/:id", (req, res) => userController.getProfile(req, res));
    app.put("/users/:id", (req, res) => userController.updateProfile(req, res));
    app.delete("/users/:id", (req, res) => userController.deleteProfile(req, res));
    app.get("/users/:id/courses", (req, res) => userController.getCourses(req, res));
    app.get("/users/:id/courses/:courseId", (req, res) => userController.getCourse(req, res));


    app.get("/courses", (req, res) => courseController.getAllCourses(req, res));
    app.post("/courses", (req, res) => courseController.createCourse(req, res));
    app.get("/courses/:id", (req, res) => courseController.getCourse(req, res));
});

app.listen(3000, () => {
    console.log("Server is running on port 3000 at http://localhost:3000/");
});

export default app;