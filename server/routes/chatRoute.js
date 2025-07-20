import { GoogleGenAI } from '@google/genai';
import express from 'express';
import handleResponse from '../utils/handleResponse.js';
import { verifyToken } from '../controller/authController.js';
import {
    putName, postProperties,
    deleteProperty, createChatHistory,
    getChatHistory, deleteCompound,
    fetchAllCids
} from '../db/queries.js';
import saveCompoundToUser from '../utils/handleCompounds.js';
import {
    role, nameDetectionPrompt, compoundDetectionPrompt,
    propertiesDetectionPrompt, displayPropertiesPrompt
} from '../utils/rolePrompts.js';
import { getPropertiesByCid, getStructureFiles } from '../services/pubchemServices.js';



const chatRouter = express.Router();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

function formatChatHistory(chatHistory) {
    return chatHistory
        .map(entry => `${entry.sender}: ${entry.message}`)
        .join('\n');
}


chatRouter.post('/chat', verifyToken, async (req, res) => {
    try {
        const { user_id, message } = req.body;
        if (!user_id || !message) {
            return res.status(400).json({ error: 'Missing user_id or message' });
        }

        const fullHistory = await getChatHistory(user_id, 100);
        const lastFew = await getChatHistory(user_id, 20);
        const isNewSession = message.trim().toLowerCase() === '__intro__';

        let prompt = '';

        if (isNewSession && fullHistory.length > 0) {
            const frontendFormatted = fullHistory.map(msg => ({
                sender: msg.sender,
                message: msg.message
            }));
            return handleResponse(res, 200, 'Returning User', {
                reply: null,
                history: frontendFormatted,
                isReturningUser: true
            });

        } else if (isNewSession) {
            prompt = `Introduce yourself as ChemBot and ask for the user's name in a friendly way. Only respond in plain text.`;
        } else {
            const formattedHistory = formatChatHistory(lastFew);
            prompt = `${formattedHistory}\n\n${nameDetectionPrompt}\n${compoundDetectionPrompt}\n${propertiesDetectionPrompt}\n${displayPropertiesPrompt}\nUser: "${message}"`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { systemInstruction: role },
        });

        let aiOutput = response.text;
        let reply = aiOutput;
        let removed = false;
        let detectedName = null;
        let detectedCompounds = [];
        let confirmedCompounds = [];
        let requestedProperties = [];
        let requestedFileTypes = [];
        let proceedToProperties = false;
        let readyForCompounds = false;
        let readyForNext = false;
        let completedCompound = null;
        const result = await fetchAllCids(user_id);

        const matches = [...aiOutput.matchAll(/```json\s*({[\s\S]*?})\s*```/g)];
        if (!isNewSession && matches) {
            for (const match of matches) {
                try {
                    const cleanJson = match[1];
                    const parsedJson = JSON.parse(cleanJson);
                    console.log("Parsed JSON:", parsedJson);

                    if (parsedJson.reply) reply = `\n\n${parsedJson.reply}`;
                    if (parsedJson.detectedName) detectedName = parsedJson.detectedName;
                    if (parsedJson.detectedCompounds) detectedCompounds.push(...parsedJson.detectedCompounds);
                    if (parsedJson.confirmedCompounds) confirmedCompounds.push(...parsedJson.confirmedCompounds);
                    if (parsedJson.requestedProperties) requestedProperties.push(...parsedJson.requestedProperties);
                    if (parsedJson.requestedFileTypes) requestedFileTypes.push(...parsedJson.requestedFileTypes);
                    if (parsedJson.proceedToProperties) proceedToProperties = true;
                    if (parsedJson.completedCompound) completedCompound = parsedJson.completedCompound;
                    if (parsedJson.removed) removed = true;
                    if (parsedJson.readyForCompounds) readyForCompounds = true;
                    if (parsedJson.readyForNext) readyForNext = true;


                } catch (err) {
                    console.error("Invalid JSON block:", err.message);
                }
            }
        } else if (!matches) {
            console.warn("No JSON object found in AI output.");
        }

        confirmedCompounds = [...new Set(confirmedCompounds)];
        detectedCompounds = [...new Set(detectedCompounds)];
        requestedProperties = [...new Set(requestedProperties)];
        requestedFileTypes = [...new Set(requestedFileTypes)];

        if (message) {
            await createChatHistory(user_id, message, 'user');
        }

        if (reply) {
            await createChatHistory(user_id, reply, 'bot');
        }

        if (detectedName) {
            await putName(user_id, detectedName);
        }

        for (const compound of detectedCompounds) {
            await saveCompoundToUser(user_id, compound);
        }

        for (const confirmedCompound of confirmedCompounds) {
            console.log(confirmedCompound.type, confirmedCompound.value);
            await saveCompoundToUser(user_id, confirmedCompound);
        }

        if (removed) {
            for (const property of [...requestedProperties, ...requestedFileTypes]) {
                await deleteProperty(user_id, property);
            }
        } else {
            for (const property of [...requestedProperties, ...requestedFileTypes]) {
                await postProperties(user_id, property);
            }
        }

        if (readyForCompounds && result.length > 0) {
            const { id, cid } = result[0];
            const compoundProps = await getPropertiesByCid(user_id, cid);
            const [filesDownloaded, fileErrors] = await getStructureFiles(user_id, cid);

            let fileTypesList = '';
            if (filesDownloaded && fileErrors.length === 0) {
                fileTypesList = `All requested files have been downloaded and saved in your study folder.`;
            } else if (filesDownloaded && fileErrors.length > 0) {
                fileTypesList = `Some files were downloaded successfully. However, the following could not be retrieved:\n\n${fileErrors.join('\n')}`;
            } else {
                fileTypesList = `No structure files could be downloaded for CID ${cid}. Reasons:\n\n${fileErrors.join('\n')}`;
            }


            const propertyJson = JSON.stringify(compoundProps, null, 2);
            const displayPrompt = displayPropertiesPrompt
                .replace('{compoundPropertiesJson}', propertyJson)
                .replace('{fileTypesList}', fileTypesList);

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: displayPrompt }] }],
                config: { systemInstruction: role }
            });

            aiOutput = response.text;
            reply = aiOutput;

            const displayMatches = [...aiOutput.matchAll(/```json\s*({[\s\S]*?})\s*```/g)];
            if (displayMatches.length > 0) {
                const parsed = JSON.parse(displayMatches[0][1]);
                reply = parsed.reply;
                completedCompound = { id, cid };
            }
        }


        if (readyForNext && completedCompound) {
            const entry_id = completedCompound.id;
            await deleteCompound(user_id, entry_id);

            const remaining = await fetchAllCids(user_id);
            if (remaining.length > 0) {
                const { id, cid } = remaining[0];
                const compoundProps = await getPropertiesByCid(user_id, cid);
                const [filesDownloaded, fileErrors] = await getStructureFiles(user_id, cid);

                let fileTypesList = '';
                if (filesDownloaded && fileErrors.length === 0) {
                    fileTypesList = `All requested files have been downloaded and saved in your study folder.`;
                } else if (filesDownloaded && fileErrors.length > 0) {
                    fileTypesList = `Some files were downloaded successfully. However, the following could not be retrieved:\n\n${fileErrors.join('\n')}`;
                } else {
                    fileTypesList = `No structure files could be downloaded for CID ${cid}. Reasons:\n\n${fileErrors.join('\n')}`;
                }


                const propertyJson = JSON.stringify(compoundProps, null, 2);
                const displayPrompt = displayPropertiesPrompt
                    .replace('{compoundPropertiesJson}', propertyJson)
                    .replace('{fileTypesList}', fileTypesList);

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{ role: 'user', parts: [{ text: displayPrompt }] }],
                    config: { systemInstruction: role }
                });

                aiOutput = response.text;
                const displayMatches = [...aiOutput.matchAll(/```json\s*({[\s\S]*?})\s*```/g)];
                if (displayMatches.length > 0) {
                    const parsed = JSON.parse(displayMatches[0][1]);
                    reply = parsed.reply;
                    completedCompound = { id, cid };
                    readyForNext = parsed.readyForNext || false;
                }
            } else {
                reply = "You've finished studying all your saved compounds. Would you like to add new ones?";
                completedCompound = null;
                readyForNext = false;
            }
        }

        handleResponse(res, 200, 'Gemini response OK', {
            reply,
            detectedName,
            detectedCompounds,
            confirmedCompounds,
            requestedProperties,
            requestedFileTypes,
            removed,
            proceedToProperties,
            completedCompound,
            readyForCompounds,
            readyForNext
        });

    } catch (err) {
        console.error('Gemini API error:', err);
        res.status(500).json({ error: 'Failed to call Gemini API.' });
    }
});

export default chatRouter;