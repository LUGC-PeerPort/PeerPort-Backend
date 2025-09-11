import { Repository } from "typeorm";
import { User } from "../Database/entities/User";
import { Request, Response } from "express";

export class UserController {
    private userRepo: Repository<User>;

    constructor(UserRepo: Repository<User>) {
        this.userRepo = UserRepo;
    }

    async getAllUsers(req: Request, res: Response) {
        const users = await this.userRepo.find();
        res.json(users);
    }

    async create(req: Request, res: Response) {
        const user = this.userRepo.create(req.body);
        const result = await this.userRepo.save(user);
        res.status(201).json(result);
    }
}