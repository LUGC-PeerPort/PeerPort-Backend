import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User.js";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    entities: [User],
    synchronize: true,

})