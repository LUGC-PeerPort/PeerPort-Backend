import express from "express";
import YAML from "yamljs";
import path from "path/win32";
import swaggerUi from "swagger-ui-express";
import { AppDataSource } from "./Database/DB.js";
import { UserController } from "./Controllers/UserController.js";
import { CourseController } from "./Controllers/CourseController.js";
import { AssignmentController } from "./Controllers/AssignmentController.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const app = express();
app.use(express.json());

// Check if the environment variables are set
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error("Database environment variables are not set.");
    process.exit(1);
}

AppDataSource.initialize().then(() => {
    const userController = new UserController(AppDataSource);
    const courseController = new CourseController(AppDataSource);
    const assignmentController = new AssignmentController(AppDataSource);

    // Define routes
    app.get("/users", (req, res) => userController.getAllUsers(req, res));
    app.post("/users", (req, res) => userController.create(req, res));
    app.get("/users/:userId", (req, res) => userController.getProfile(req, res));
    app.put("/users/:userId", (req, res) => userController.updateProfile(req, res));
    app.delete("/users/:userId", (req, res) => userController.deleteProfile(req, res));
    app.get("/users/:userId/courses", (req, res) => userController.getCourses(req, res));
    app.get("/users/:userId/courses/:courseId", (req, res) => userController.getCourse(req, res));


    app.get("/courses", (req, res) => courseController.getAllCourses(req, res));
    app.post("/courses", (req, res) => courseController.createCourse(req, res));
    app.get("/courses/:id", (req, res) => courseController.getCourse(req, res));

    //Assignment controller
    app.get("/assignments/:id", (req, res) => assignmentController.getAssignment(req, res));
    app.get("/assignments", (req, res) => assignmentController.getAllAssignments(req, res));
    app.post("/assignments", (req, res) => assignmentController.createAssignment(req, res));
    app.put("/assignments/:id", (req, res) => assignmentController.updateAssignment(req, res));
    app.delete("/assignments/:id", (req, res) => assignmentController.deleteAssignment(req, res));
    app.get("/courses/:courseId", (req, res) => courseController.getCourse(req, res));
    app.get("/courses/:courseId/assignments", (req, res) => courseController.getCourseAssignments(req, res));
});

// Setting up swagger
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerDocument = YAML.load(path.resolve(__dirname, "../oapi.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(3000, () => {
    console.log("Server is running on port 3000 at http://localhost:3000/");
});

export default app;