import express from "express";
import YAML from "yamljs";
import path from "path/win32";
import swaggerUi from "swagger-ui-express";
import { AppDataSource } from "./Database/DB.js";
import { UserController } from "./Controllers/UserController.js";
import { CourseController } from "./Controllers/CourseController.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import passport from "passport";
import {User} from "./Database/entities/User.js";
import session from "express-session";
import {Role} from "./Database/entities/Role.js";
import {GoogleStrategySetup} from "./Auth/GoogleStrategy.js";
import cors from "cors";


const app = express();
app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: "GET,POST,PUT,DELETE,HEAD,OPTIONS",
    credentials: true,
    allowedHeaders: "Content-Type,Authorization"
}))


// Check if the enviroment variables are set
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error("Database environment variables are not set.");
    process.exit(1);
}

AppDataSource.initialize().then(() => {

    const roleRepository = AppDataSource.getRepository(Role);
    // Ensure default roles exist
    const ensureDefaultRoles = async () => {
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
    }
    ensureDefaultRoles().then(()=>{}).catch(console.error);


    const userController = new UserController(AppDataSource);
    const courseController = new CourseController(AppDataSource);

    // Setup Google OAuth Strategy
    const ifAuthed = GoogleStrategySetup(app, AppDataSource);
    const userRepository = AppDataSource.getRepository(User);


    if(process.env.NODE_ENV !== "production") {
        app.get("/auth/setRole/:roleName", async (req, res) => {
            const roleName = req.params.roleName;

            const userId  = (req.session as any).passport.user;
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
        })
    }


    // @ts-ignore
    app.get("/auth/testAuth/user", (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, (req, res) => {
        return res.json({message: "User has minimum 'user' role access."});
    }));
    app.get("/auth/testAuth/teacher", (req, res) => ifAuthed(["teacher", "admin"], req, res, (req, res) => {
        return res.json({message: "User has minimum 'teacher' role access."});
    }));
    app.get("/auth/testAuth/admin", (req, res) => ifAuthed(["admin"], req, res, (req, res) => {
        return res.json({message: "User has 'admin' role access."});
    }));

    // Define routes
    app.get("/login/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    app.get("/users", (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  userController.getAllUsers));
    app.post("/users", (req, res) =>ifAuthed(["user", "teacher", "admin"], req, res,  userController.create));
    app.get("/users/:id", (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, userController.getProfile));
    app.put("/users/:id", (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, userController.updateProfile));
    app.delete("/users/:id", (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, userController.deleteProfile));
    app.get("/users/:id/courses", (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, userController.getCourses));
    app.get("/users/:id/courses/:courseId", (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, userController.getCourse));


    app.get("/courses", (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  courseController.getAllCourses));
    app.post("/courses", (req, res) => ifAuthed(["user", "teacher", "admin"], req, res, courseController.createCourse));
    app.get("/courses/:id", (req, res) => ifAuthed(["user", "teacher", "admin"], req, res,  courseController.getCourse));
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