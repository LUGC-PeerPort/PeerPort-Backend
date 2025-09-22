import { DataSource } from "typeorm";
import { User } from "../Database/entities/User.js";
import { Role } from "../Database/entities/Role.js";
import { Course } from "../Database/entities/Course.js";
import { UsersToCourses } from "../Database/entities/UsersToCourses.js";

export const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    synchronize: true,
    entities: [
        User, 
        Role, 
        Course,
        UsersToCourses
    ],
});