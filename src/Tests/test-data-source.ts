import { DataSource } from "typeorm";
import { User } from "../Database/entities/User.js";
import { Role } from "../Database/entities/Role.js";
import { Files } from "../Database/entities/Files.js";
import { Course } from "../Database/entities/Course.js";
import { Content } from "../Database/entities/Content.js";
import { Assignments } from "../Database/entities/Assignments.js";
import { UsersToCourses } from "../Database/entities/UsersToCourses.js";
import { AssignmentSubmissions } from "../Database/entities/AssignmentSubmissions.js";

export const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    synchronize: true,
    entities: [
        User, 
        Role, 
        Files,
        Course,
        Content,
        Assignments,
        UsersToCourses,
        AssignmentSubmissions,
    ],
});