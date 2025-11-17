import { DataSource } from "typeorm";
import { User } from "../src/Database/entities/User.js";
import { Role } from "../src/Database/entities/Role.js";
import { Grade } from "../src/Database/entities/Grade.js";
import { Files } from "../src/Database/entities/Files.js";
import { Course } from "../src/Database/entities/Course.js";
import { Content } from "../src/Database/entities/Content.js";
import { Assignments } from "../src/Database/entities/Assignments.js";
import { UsersToCourses } from "../src/Database/entities/UsersToCourses.js";
import { AssignmentSubmissions } from "../src/Database/entities/AssignmentSubmissions.js";

export const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    synchronize: true,
    entities: [
        User, 
        Role,
        Grade, 
        Files,
        Course,
        Content,
        Assignments,
        UsersToCourses,
        AssignmentSubmissions,
    ],
});