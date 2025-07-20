import { getPropertiesByCid, resolveCompound, getStructureFiles } from '../services/pubchemServices.js';
import handleResponse from '../utils/handleResponse.js';

export const inputCompound = async (req, res, next) => {
    const { user_id, input } = req.body;
    try {
        await resolveCompound(user_id, input);
        handleResponse(res, 201, "Compound inserted successfully!");
    } catch (error) {
        next(error);
    }
};

export const fetchProperties = async (req, res, next) => {
    const { user_id, cid } = req.body;
    try {
        const response = await getPropertiesByCid(user_id, cid);
        handleResponse(res, 201, `Fetched properties for ${cid}`, response);
    } catch (error) {
        next(error);
    }
};

export const fetchStructureFiles = async (req, res, next) => {
    const { user_id, cid } = req.body;
    try {
        const response = await getStructureFiles(user_id, cid);
        handleResponse(res, 201, `Fetched files for ${cid}`, response);
    } catch (error) {
        next(error);
    }
}