import {
    postUser,
    postCompound,
    postProperties,
    deleteCompound,
    deleteProperty,
    putName
} from "../db/queries.js";

import handleResponse from "../utils/handleResponse.js";

export const insertUser = async (req, res, next) => {
    const { username } = req.body;
    try {
        if (!username) throw new Error("Username is required");
        await postUser(username);
        handleResponse(res, 201, "User created successfully!");
    } catch (error) {
        next(error);
    }
};

export const insertCompound = async (req, res, next) => {
    try {
        const compounds = req.body;

        if (!Array.isArray(compounds) || compounds.length === 0) {
            throw new Error("Compound list is empty or invalid");
        }

        for (const { user_id, title, iupac_name, cid, smiles } of compounds) {
            if (!user_id || !cid || !smiles)
                throw new Error("Missing required compound fields");
            await postCompound(user_id, title, iupac_name, cid, smiles);
        }

        handleResponse(res, 201, "Compound(s) added successfully!");
    } catch (error) {
        next(error);
    }
};

export const insertProperty = async (req, res, next) => {
    try {
        const properties = req.body;

        if (!Array.isArray(properties) || properties.length === 0) {
            throw new Error("Property list is empty or invalid");
        }

        for (const { user_id, property } of properties) {
            if (!user_id || !property)
                throw new Error("Missing required property fields");
            await postProperties(user_id, property);
        }

        handleResponse(res, 201, "Property(ies) added successfully!");
    } catch (error) {
        next(error);
    }
};

export const removeCompound = async (req, res, next) => {
    const { entry_id } = req.body;
    try {
        if (!entry_id) throw new Error("Entry ID is required");
        await deleteCompound(entry_id);
        handleResponse(res, 200, "Compound deleted successfully!");
    } catch (error) {
        next(error);
    }
};

export const removeProperty = async (req, res, next) => {
    const { user_id, property } = req.body;
    try {
        if (!user_id || !property) throw new Error("User ID and property are required");
        await deleteProperty(user_id, property);
        handleResponse(res, 200, "Property deleted successfully!");
    } catch (error) {
        next(error);
    }
};

export const updateUserName = async (req, res, next) => {
    const { user_id, name } = req.body;
    try {
        if (!user_id || !name) throw new Error("User ID and new name are required");
        await putName(user_id, name);
        handleResponse(res, 200, "User name updated successfully!");
    } catch (error) {
        next(error);
    }
};
