import express from "express";
import YAML from "yamljs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { AppDataSource } from "./Database/DB.js";
import { UserController } from "./Controllers/UserController.js";
import { CourseController } from "./Controllers/CourseController.js";
import { AssignmentController } from "./Controllers/AssignmentController.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import passport from "passport";
import {User} from "./Database/entities/User.js";
import {Role} from "./Database/entities/Role.js";
import {GoogleStrategySetup} from "./Auth/GoogleStrategy.js";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { GradeController } from "./Controllers/GradeController.js";
import { ContentController } from "./Controllers/ContentController.js";
import { SubmissionController } from "./Controllers/SubmissionController.js";
import { checkIfUpdateAvailable } from "./updateDetection.js";

console.log("Checking for updates...");
if (!checkIfUpdateAvailable()) {
    console.error("Update check failed or updates are available. Exiting...");
    process.exit(1);
}


console.log("\nStarting PeerPort Backend...");

const app = express();
app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: "GET,POST,PUT,DELETE,HEAD,OPTIONS",
    credentials: true,
    allowedHeaders: "Content-Type,Authorization"
}));

// // Setting up swagger
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerDocument = YAML.load(path.resolve(__dirname, "../../oapi.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));



// Initialize file upload middleware
let uploadDir: string;
if (!process.env.UPLOAD_DIR) {
    uploadDir = path.resolve(__dirname, "./uploads");
    if (!fs.existsSync(uploadDir)) {fs.mkdirSync(uploadDir, { recursive: true });}
    console.warn(`UPLOAD_DIR environment variable not set, defaulting to '${uploadDir}'`);
} else {
    uploadDir = path.resolve(__dirname, process.env.UPLOAD_DIR);
    if (!fs.existsSync(uploadDir)) {fs.mkdirSync(uploadDir, { recursive: true });}
    console.log(`Uploads will be stored in: ${uploadDir}`);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        // Make new filename to avoid collisions
        const safeFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname.replace(" ", "_")}`;
        cb(null, safeFileName);
    }
});
const uploader = multer({
    storage,
    // Removed limit temproaraly limits: {fileSize: 1e+7} // 10MB file size limit
});

// Check if the environment variables are set
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error("Database environment variables are not set.");
    process.exit(1);
}


AppDataSource.initialize().then(() => {

    const roleRepository = AppDataSource.getRepository(Role);
    // Ensure default roles exist
    const ensureDefaultRoles = async () : Promise<void> => {
        const roles = ["user", "teacher", "admin"];
        for (const roleName of roles) {
            let role = await roleRepository.findOneBy({ name: roleName });
            if (!role) {
                role = new Role();
                role.name = roleName;
                await roleRepository.save(role);
                console.log(`Created default role: ${roleName}`);
            }
        }
    };
    ensureDefaultRoles().then(()=>{}).catch(console.error);


    const userController = new UserController(AppDataSource);
    const courseController = new CourseController(AppDataSource);
    const gradeController = new GradeController(AppDataSource);
    const contentController = new ContentController(AppDataSource);
    const submissionController = new SubmissionController(AppDataSource);

    // Setup Google OAuth Strategy
    const ifAuthed = GoogleStrategySetup(app, AppDataSource);
    const userRepository = AppDataSource.getRepository(User);


    if(process.env.IS_PRODUCTION === "false") {
        app.get("/auth/setRole/:roleName", async (req, res) => {
            const roleName = req.params.roleName;

            // @ts-expect-error Needed as request session types are ... weird
            const userId  = (req.session as unknown).passport.user;
            if(!userId) {
                return res.status(401).json({ message: "Not authenticated." });
            }

            if(!["user", "teacher", "admin"].includes(roleName)) {
                return res.status(400).json({ message: "Invalid role name." });
            }


            const user = await userRepository.findOneBy({ userId: userId });
            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }
            const role = await roleRepository.findOneBy({ name: roleName });
            if (!role) {
                return res.status(400).json({ message: "Role does not exist." });
            }
            user.role = role;
            await userRepository.save(user);
            return res.json({ message: `User role updated to ${roleName}.` });
        });
    }


    app.get("/auth/testAuth/user", (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, () => {
        return res.json({message: "User has minimum 'user' role access."});
    }));
    app.get("/auth/testAuth/teacher", (req, res) => ifAuthed(["teacher", "admin"], req, res, () => {
        return res.json({message: "User has minimum 'teacher' role access."});
    }));
    app.get("/auth/testAuth/admin", (req, res) => ifAuthed(["admin"], req, res, () => {
        return res.json({message: "User has 'admin' role access."});
    }));
    const assignmentController = new AssignmentController(AppDataSource);

    // Define routes
    app.get("/login/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    // User controller
    app.get("/auth/currentUser",                (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, async () => { userController.getCurrentUser(req, res);}));
    app.get("/users",                           (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => userController.getAllUsers(req, res)));
    app.post("/users",                          (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => userController.create(req, res)));
    app.get("/users/:userId",                   (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, () => userController.getProfile(req, res)));
    app.put("/users/:userId",                   (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, () => userController.updateProfile(req, res)));
    app.delete("/users/:userId",                (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, () => userController.deleteProfile(req, res)));
    app.get("/users/:userId/courses",           (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, () => userController.getCourses(req, res)));
    app.get("/users/:userId/courses/:courseId", (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, () => userController.getCourse(req, res)));

    // Course controller
    app.get("/courses",                             (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => courseController.getAllCourses(req, res)));
    app.post("/courses",                            (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => courseController.createCourse(req, res)));
    app.put("/courses/:courseId",                   (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => courseController.updateCourse(req, res)));
    app.delete("/courses/:courseId",                (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => courseController.deleteCourse(req, res)));
    app.get("/courses/:courseId",                   (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => courseController.getCourse(req, res)));
    app.post("/courses/:courseId/enroll/:userId",   (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => courseController.enrollUserInCourse(req, res)));
    app.get("/courses/:courseId/assignments",       (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => courseController.getCourseAssignments(req, res)));

    // Assignment controller
    app.get("/assignments/:assignmentId",                               (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => assignmentController.getAssignment(req, res)));
    app.get("/assignments",                                             (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => assignmentController.getAllAssignments(req, res)));
    app.post("/assignments",                                            (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => assignmentController.createAssignment(req, res)));
    app.put("/assignments/:assignmentId",                               (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => assignmentController.updateAssignment(req, res)));
    app.delete("/assignments/:assignmentId",                            (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => assignmentController.deleteAssignment(req, res)));
    app.post("/assignments/:assignmentId/submissions", uploader.any(),  (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => assignmentController.createSubmissionForAssignment(req, res)));
    app.get("/assignments/:assignmentId/submissions",                   (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => assignmentController.getSubmissionsForAssignment(req, res)));

    // Submission controller
    app.get("/submissions",                 (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => submissionController.getAllSubmissions(req, res)));
    app.get("/submissions/:submissionId",   (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => submissionController.getSubmission(req, res)));

    // Grade controller
    app.get("/grades",                                              (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => gradeController.getAllGrades(req, res)));
    app.get("/grades/by-id/:gradeId",                               (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => gradeController.getGrade(req, res)));
    app.put("/grades/by-id/:gradeId",                               (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => gradeController.updateGrade(req, res)));
    app.delete("/grades/by-id/:gradeId",                            (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => gradeController.deleteGrade(req, res)));
    app.post("/grades/:userId/:courseId",                           (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => gradeController.createGrade(req, res)));
    app.post("/grades/:userId/:courseId/:assignmentSubmissionId",   (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => gradeController.createGrade(req, res)));
    app.get("/grades/by-user/:userId",                              (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => gradeController.getAllGradesForUser(req, res)));
    app.get("/grades/by-course/:courseId",                          (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => gradeController.getAllGradesForCourse(req, res)));
    app.get("/grades/:userId/:courseId",                            (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => gradeController.getAllGradesForUserInCourse(req, res)));
    app.get("/grades/calculated/:userId/:courseId",                 (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => gradeController.getCalculatedGradeForUserInCourse(req, res)));
    app.get("/grades/average/:courseId",                            (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => gradeController.getAverageGradeForCourse(req, res)));
    
    // Content controller
    app.get("/content",                 (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => contentController.getAllContent(req, res)));
    app.get("/content/:contentId",      (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => contentController.getContentById(req, res)));
    app.post("/content/:courseId",      (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => contentController.createContent(req, res)));
    app.post("/content/sub/:parentId",  (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => contentController.createSubContent(req, res)));
    app.put("/content/:contentId",      (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => contentController.updateContent(req, res)));
    app.delete("/content/:contentId",   (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  () => contentController.deleteContent(req, res)));
});

// Error handler for multer
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Check if the error is a Multer error
    if (err && typeof err === "object" && "code" in err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;

        // Handle specific Multer errors
        if (e.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ message: "One or more files exceed the 10MB limit." });
        }
        if (e instanceof multer.MulterError) {
            return res.status(400).json({ message: e.message });
        }
    }
    // Go to next error handler
    return next(err);
});

// Start the server
app.listen(3000, () => {
    console.log("Server is running on port 3000 at http://localhost:3000/");
    console.log("API documentation available at http://localhost:3000/api-docs"); // link to api so that I don't need to find the link every time
});

export default app;
