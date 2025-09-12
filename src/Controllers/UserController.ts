import type { Repository } from "typeorm";
import type { User } from "../Database/entities/User.js";
import type { Request, Response } from "express";

/**
 *
 */
export class UserController {
    private userRepo: Repository<User>;

    /**
	 *
	 * @param UserRepo
	 */
    constructor(UserRepo: Repository<User>) {
        this.userRepo = UserRepo;
    }

    /**
	 *
	 * @param req
	 * @param res
	 */
    async getAllUsers(req: Request, res: Response): Promise<void> {
        const users = await this.userRepo.find();
        res.json(users);
    }

    /**
	 *
	 * @param req
	 * @param res
	 */
    async create(req: Request, res: Response): Promise<void> {
        const user = this.userRepo.create(req.body);
        const result = await this.userRepo.save(user);
        res.status(201).json(result);
    }
}