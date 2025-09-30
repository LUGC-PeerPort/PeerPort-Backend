import type { DataSource, Repository } from "typeorm";
import { Assignments } from "../Database/entities/Assignments";

/**
 * Used to manage assignments.
 */
export class AssignmentController {
    private assignmentRepo: Repository<Assignments>;

    /**
     * Constructor for AssignmentController.
     * @param dataSource - The TypeORM DataSource.
     */
    constructor(dataSource: DataSource) {
        this.assignmentRepo = dataSource.getRepository(Assignments);
    }
}