import express from 'express';

import AuthMiddle from "../Middlewares/AuthMiddleware.js"
import {checkRole} from "../Middlewares/AuthMiddleware.js"
import { createSubject, getAllSubjects, getSubjectsById, updateSubject, deleteSubject } from '../Controllers/SubjectController.js';


const subjectRouter = express.Router();    

subjectRouter.post("/:classId",AuthMiddle,createSubject);
subjectRouter.get("/:classId",AuthMiddle,getAllSubjects);
subjectRouter.get("/id/:subjectId",AuthMiddle,getSubjectsById);
subjectRouter.put("/id/:subjectId",AuthMiddle,checkRole(["Admin","HOD"]),updateSubject);
subjectRouter.delete("/id/:subjectId",AuthMiddle,checkRole(["Admin","HOD"]),deleteSubject);


export default subjectRouter;