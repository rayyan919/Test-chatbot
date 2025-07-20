import express from 'express';
import { insertUser, updateUserName } from '../controller/queriesController.js';

const queriesRouter = express.Router();

queriesRouter.post('/insert-user', insertUser);
queriesRouter.put('/setname', updateUserName);

export default queriesRouter;