import "reflect-metadata";
import { DataSource } from "typeorm";

// Models
import { User } from "./entities/User.js";
import { Role } from "./entities/Role.js";
import { Class } from "./entities/Class.js";
import { UsersToClasses } from "./entities/UsersToClasses.js";

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
        Class,
        UsersToClasses
    ],
    synchronize: true,

});