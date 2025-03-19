import express from 'express';

import AuthMiddle from "../Middlewares/AuthMiddleware.js"
import {checkRole} from "../Middlewares/AuthMiddleware.js"
import { getAllSubjects, getSubjectsById, updateSubject } from '../Controllers/SubjectController.js';


const subjectRouter = express.Router();    

subjectRouter.get("/",AuthMiddle,getAllSubjects);
subjectRouter.get("/:id",AuthMiddle,getSubjectsById);
subjectRouter.put("/:id",AuthMiddle,checkRole(["Admin","HOD"]),updateSubject);


export default subjectRouter;