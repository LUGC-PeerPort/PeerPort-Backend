import { DataSource } from "typeorm";
import { User } from "../Database/entities/User.js";
import { Role } from "../Database/entities/Role.js";
import { Class } from "../Database/entities/Course.js";
import { UsersToClasses } from "../Database/entities/UsersToCourses.js";

export const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    synchronize: true,
    entities: [
        User, 
        Role, 
        Class,
        UsersToClasses
    ],
});