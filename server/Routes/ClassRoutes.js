import express from 'express';

import AuthMiddle from "../Middlewares/AuthMiddleware.js"
import {checkRole} from "../Middlewares/AuthMiddleware.js"
import { getAllClass, getClassById, } from '../Controllers/ClassController.js';

const classRouter = express.Router();    

classRouter.get("/",AuthMiddle,getAllClass);
classRouter.get("/:id",AuthMiddle,getClassById);



export default classRouter;