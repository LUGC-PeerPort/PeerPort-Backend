import { DataSource } from "typeorm";
import { User } from "../Database/entities/User";
import { Role } from "../Database/entities/Role";

export const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    synchronize: true,
    entities: [User, Role],
});