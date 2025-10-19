import type { DataSource, Repository } from "typeorm";
import { Assignments } from "../Database/entities/Assignments.js";
import type { Request, Response } from "express";
import { AssignmentSubmissions } from "../Database/entities/AssignmentSubmissions.js";
import { User } from "../Database/entities/User.js";
import { Course } from "../Database/entities/Course.js";

/**
 * Used to manage assignments.
 */
export class AssignmentController {
    private assignmentRepo: Repository<Assignments>;
    private assignmentSubmissionsRepo: Repository<AssignmentSubmissions>;
    private userRepo: Repository<User>;
    private courseRepo: Repository<Course>;

    /**
     * Constructor for AssignmentController.
     * @param dataSource - The TypeORM DataSource.
     */
    constructor(dataSource: DataSource) {
        this.assignmentRepo = dataSource.getRepository(Assignments);
        this.assignmentSubmissionsRepo = dataSource.getRepository(AssignmentSubmissions);
        this.userRepo = dataSource.getRepository(User);
        this.courseRepo = dataSource.getRepository(Course);
    }
    /**
     * Checks if the UUID is valid
     * @param id - The  UUID
     * @returns The UUID if valid, undefined otherwise
     */
    private checkUUID(id: string): string | void {
        if (id == undefined) return;

        // Trim the string
        const assSubID = id.trim();

        // Check if the ID has content
        if (assSubID == "") return;
        
        // Check if the ID is a valid UUID
        if (!RegExp(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).test(assSubID)) return;
        
        // Return the ID
        return assSubID;
    }

    /**
     * Used to get all assignments.
     * @param req - The request object.
     * @param res - The response object.
     */
    async getAllAssignments(req: Request, res: Response): Promise<void> {
        try{
            const assignments = await this.assignmentRepo.find({
                relations: ["course"],
            });
            res.status(200).json(assignments);
        }
        catch(error){
            console.error("Error fetching assignments:", error);
            res.status(500).json({ message: "Failed to fetch assignments" });
        }
    }

    /**
     * Helper for assignment request body validation
     * @param body - The request body
     * @returns boolean
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private isValidAssBody(body: any): boolean {
        if (!body) return false;
        const required = ["name", "description", "dueDate", "courseId"];
        return required.every((key) => Object.hasOwn(body, key) && body[key]);
    }

    /**
     * Used to create a new assignment.
     * @param req - The request object.
     * @param res - The response object.
     */
    async createAssignment(req: Request, res: Response): Promise<void> {
        try {
            if(!this.isValidAssBody(req.body)){
                res.status(400).json({ message: "Invalid request body" });
                return;
            }
            const {name, description, dueDate, courseId} = req.body;
            const course = await this.courseRepo.findOne({where: {courseId}});
            if(!course){
                res.status(400).json({ message: "Invalid course ID" });
                return;
            }
            const newAssignment = this.assignmentRepo.create({name, description, dueDate, course});
            const savedAssignment = await this.assignmentRepo.save(newAssignment);
            res.status(201).json(savedAssignment);
        } catch (error) {
            console.error("Error creating assignment:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    /**
     * Used to get a single assignment by ID.
     * @param req - The request object
     * @param res - The response object
     */
    async getAssignment(req: Request, res: Response): Promise<void> {
        try{
            if(!req.params || !req.params.id){
                res.status(400).json({message: "Assignment ID is required"});
                return;
            }
            const {id} = req.params;
            const assID = this.checkUUID(id);
            if(!assID){
                res.status(400).json({message: "Invalid assignment ID"});
                return;
            }
            res.status(501).json({ message: "Not implemented" });
        } catch (error) {
            console.error("Error fetching assignment:", error);
            res.status(500).json({ message: "Failed to fetch assignment" });    
        }
        

        /* if fix does not work, go back to bellow*/
        // const {id} = req.params;
        // const assID = this.checkUUID(id);
        // if(!assID){
        //     res.status(400).json({message: "Invalid assignment ID"});
        //     return;
        // }
        // res.status(501).json({ message: "Not implemented" });
    }

    /**
     * Used to update an assignment by ID.
     * @param req - The request object
     * @param res - The response object
     */
    async updateAssignment(req: Request, res: Response): Promise<void> {
        try{
            //validate assignment id
            const id = req.params?.id;
            if(!id){
                res.status(400).json({message: "Assignment ID is required"});
                return;
            }
            const assID = this.checkUUID(id);
            if(!assID){
                res.status(400).json({message: "Invalid assignment ID"});
                return;
            }
            //validate request body
            if(!req.body || Object.keys(req.body).length === 0){
                res.status(400).json({message: "Request body is required"});
                return;
            }
            const {name, description, dueDate, courseId} = req.body;
            //find existing assignment
            const assignment = await this.assignmentRepo.findOne({where: {assignmentId: assID}, relations: ["course"]});
            if(!assignment){
                res.status(404).json({message: "Assignment not found"});
                return;
            }
            //update course
            if(courseId){
                const course = await this.courseRepo.findOne({where: {courseId}});
                if(!course){
                    res.status(400).json({message: "Invalid course ID"});
                    return;
                }
                assignment.course = course;
            }
            //update assignment fields
            assignment.name = name;
            assignment.description = description;
            assignment.dueDate = dueDate;
            //save updated assignment
            const updatedAssignment = await this.assignmentRepo.save(assignment);
            res.status(200).json(updatedAssignment);
        } catch (error) {
            console.error("Error updating assignment:", error);
            res.status(500).json({ message: "Failed to update assignment" });
        }
    }

    /**
     * Used to delete an assignment by ID.
     * @param req - The request object
     * @param res - The response object
     */
    async deleteAssignment(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params?.id;
            if (!id) {
                res.status(400).json({ message: "Assignment ID is required" });
                return;
            }
            const assID = this.checkUUID(id);
            if (!assID) {
                res.status(400).json({ message: "Invalid assignment ID" });
                return;
            }
            const assignment = await this.assignmentRepo.findOne({ where: { assignmentId: assID } });
            if (!assignment) {
                res.status(404).json({ message: "Assignment not found" });
                return;
            }
            await this.assignmentRepo.remove(assignment);
            res.status(204).send();
        } catch (error) {
            console.error("Error deleting assignment:", error);
            res.status(500).json({ message: "Failed to delete assignment" });
        }
    }

    /**
     * Used to get all submissions for a specific assignment.
     * @param req - The request object
     * @param res - The response object
     */
    async getSubmissionsForAssignment(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params?.id;
            if (!id) {
                res.status(400).json({ message: "Assignment ID is required" });
                return;
            }
            const assID = this.checkUUID(id);
            if (!assID) {
                res.status(400).json({ message: "Invalid assignment ID" });
                return;
            }
            const submissions = await this.assignmentSubmissionsRepo.find({ where: { assignment: { assignmentId: assID } } });
            res.status(200).json(submissions);
        } catch (error) {
            console.error("Error fetching submissions:", error);
            res.status(500).json({ message: "Failed to fetch submissions" });
        }
    }

    /**
     * Used to create a submission for a specific assignment.
     * @param req - The request object
     * @param res - The response object
     */
    async createSubmissionForAssignment(req: Request, res: Response): Promise<void> {
        try {
            // const{assignmentId, studentId, content}=req.body;
            // if(!assignmentId||!studentId||!content){
            //     res.status(400).json({message: "Missing a required feild: assignmentId, studentId, or coontent"});
            //     return;
            // }
            const assignmentId = req.params?.assignmentId;
            
            if(!assignmentId){
                res.status(400).json({message: "assignmentId is required"});
                return;
            }
            const validAssId = this.checkUUID(assignmentId);
            if(!validAssId){
                res.status(400).json({message: "Invalid assignmentId"});
                return;
            }
            const assignment=await this.assignmentRepo.findOne({where: {assignmentId: validAssId}});
            if(!assignment){
                res.status(400).json({message: "Assignment not found"});
                return;
            }
            const submissions = await this.assignmentSubmissionsRepo.find({where: {assignment: {assignmentId: validAssId}},relations: ["assignment", "user"]});
            const sumbissionRsponse = submissions.map((submission) => ({
                submissionId: submission.assignmentSubmissionId,
                assignmentId: submission.assignment.assignmentId,
                userId: submission.user.userId,
                comment: submission.comment,
                timeSubmitted: submission.timeSubmitted,
            }));
            res.status(200).json(sumbissionRsponse);
            // const newSubmission = this.assignmentSubmissionsRepo.create({
            //     //userId: studentId,
            //     //comment,
            //     timeSubmitted: new Date().toString(),
            // });
            // const saveSubmission = await this.assignmentSubmissionsRepo.save(newSubmission);
            // res.status(201).json(saveSubmission);
    
        }catch (error) {
            console.log("Error creating submission:", error);
            res.status(500).json({ message: "Failed to create submission" });
        }
    }
}