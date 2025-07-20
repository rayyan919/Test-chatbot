import { fetchProperties, inputCompound, fetchStructureFiles } from "../controller/pubchemController.js";
import express from 'express';
import fs from 'fs/promises';
import { verifyToken } from "../controller/authController.js";

const pubchemRouter = express.Router();

pubchemRouter.post('/fetch-properties', verifyToken, fetchProperties);
pubchemRouter.post('/input-compound', verifyToken, inputCompound);
pubchemRouter.post('/file-download', verifyToken, fetchStructureFiles);
pubchemRouter.get('/download/:filename', verifyToken, async (req, res) => {
    const filePath = path.resolve(`./downloads/${req.params.filename}`);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send("File not found");
    }
});

export default pubchemRouter;