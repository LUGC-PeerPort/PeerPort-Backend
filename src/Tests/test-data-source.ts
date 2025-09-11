import { DataSource } from "typeorm";
import { User } from "../Database/entities/User";

export const TestDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    synchronize: true,
    entities: [User],
});