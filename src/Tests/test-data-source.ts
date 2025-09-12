import { DataSource } from "typeorm";
import { User } from "../Database/entities/User";
import { Role } from "../Database/entities/Role";
import { Class } from "../Database/entities/Class";
import { UsersToClasses } from "../Database/entities/UsersToClasses";

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