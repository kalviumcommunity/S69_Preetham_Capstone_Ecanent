import express from 'express';

import AuthMiddle from "../Middlewares/AuthMiddleware.js"
import {checkRole} from "../Middlewares/AuthMiddleware.js"
import { createClass, getAllClass, getClassById,updateClass } from '../Controllers/ClassController.js';

const classRouter = express.Router();    

classRouter.post("/create",AuthMiddle,createClass);
classRouter.get("/",AuthMiddle,getAllClass);
classRouter.get("/:id",AuthMiddle,getClassById);
classRouter.put("/:id",AuthMiddle,checkRole(["Admin","HOD"]),updateClass);  


export default classRouter;