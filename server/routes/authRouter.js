import { Login } from '../controller/authController.js';
import express from 'express';

const authRouter = express.Router();

authRouter.post('/login', Login);


export default authRouter;