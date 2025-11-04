import "reflect-metadata";
import { DataSource } from "typeorm";

// Models
import { User } from "./entities/User.js";
import { Role } from "./entities/Role.js";
import { Grade } from "./entities/Grade.js";
import { Files } from "./entities/Files.js";
import { Course } from "./entities/Course.js";
import { Content } from "./entities/Content.js";
import { Assignments } from "./entities/Assignments.js";
import { UsersToCourses } from "./entities/UsersToCourses.js";
import { FederatedCredentials } from "./entities/FederatedCredentials.js";
import { AssignmentSubmissions } from "./entities/AssignmentSubmissions.js";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    // Using the models
    entities: [
        User,
        Role,
        Files,
        Grade,
        Course,
        Content,
        Assignments,
        UsersToCourses,
        FederatedCredentials,
        AssignmentSubmissions,
    ],
    synchronize: true,

});