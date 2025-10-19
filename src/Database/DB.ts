import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../Database/entities/User.js";
import { Role } from "../Database/entities/Role.js";
import { Files } from "../Database/entities/Files.js";
import { Course } from "../Database/entities/Course.js";
import { Content } from "../Database/entities/Content.js";
import { Assignments } from "../Database/entities/Assignments.js";
import { UsersToCourses } from "../Database/entities/UsersToCourses.js";
import { ContentToFiles } from "../Database/entities/ContentToFiles.js";
import { AssignmentToFiles } from "../Database/entities/AssignmentToFiles.js";
import { AssignmentSubmissions } from "../Database/entities/AssignmentSubmissions.js";
import { AssignmentSubmissionToFiles } from "../Database/entities/AssignmentSubmissionToFiles.js";


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
        Course,
        Content,
        Assignments,
        UsersToCourses,
        ContentToFiles,
        AssignmentToFiles,
        AssignmentSubmissions,
        AssignmentSubmissionToFiles,
    ],
    synchronize: true,
});