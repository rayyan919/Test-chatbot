import express from "express";
import dotenv from "dotenv";
import path from 'path';
import cors from 'cors';
import queriesRouter from "./routes/queriesRouter.js";
import chatRouter from "./routes/chatRoute.js";
import pubchemRouter from "./routes/pubchemRouter.js";
import authRouter from "./routes/authRouter.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());

app.use('/api', authRouter);
app.use('/api/users', queriesRouter);
app.use('/api', chatRouter);
app.use('/pubchem', pubchemRouter);
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));


app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
});





