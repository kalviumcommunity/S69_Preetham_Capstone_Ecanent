import express from 'express'
import { deleteUser, getInstitution, getMembers, getUser, updateFacultyDetailsGoogle, updateInstitution, updateInstitutionGoogle, updateUser } from '../Controllers/UserController.js'
import AuthMiddle from '../Middlewares/AuthMiddleware.js'

const userRouter = express.Router();
userRouter.get('/profile',AuthMiddle,getUser);
userRouter.put('/update-institution',AuthMiddle,updateInstitution);
userRouter.get('/institute',getInstitution);
userRouter.get('/members',AuthMiddle,getMembers);
userRouter.put('/update-name',AuthMiddle,updateUser);
userRouter.delete('/delete',AuthMiddle, deleteUser);
userRouter.put('/update-institutionGoogle', AuthMiddle, updateInstitutionGoogle);
userRouter.put('/update-faculty-details-google', AuthMiddle, updateFacultyDetailsGoogle);
export default userRouter;