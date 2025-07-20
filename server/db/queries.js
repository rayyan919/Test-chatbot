import db from './db.js'

export const postUser = async (username, name = 'Unknown User') => {
    try {
        await db('user_').insert({ username: username, name: name }).then(() => { });
    } catch (error) {
        console.error('Error inserting  user:', error);
        throw new Error('Internal Server Error');
    }
};


export const postCompound = async (user_id, title, iupac_name, cid, smiles) => {
    try {

        const existing = await db('compound')
            .where({ user_id, cid })
            .first();

        if (existing) {
            console.log(`Compound with CID ${cid} already exists for user ${user_id}`);
            return { skipped: true, message: "Duplicate compound for user", compound: existing };
        }

        await db('compound').insert({
            user_id: user_id,
            title: title,
            cid: cid,
            smiles: smiles,
            iupac_name: iupac_name
        }).then(() => { });

        return { skipped: false, message: "Compound inserted", cid };
    } catch (error) {
        console.error("Error inserting compound:", error.message);
        throw new Error(`Failed to insert compound: ${error.message}`);
    }
};


export const postProperties = async (user_id, property) => {
    try {
        const exists = await db('props')
            .where({ user_id, property })
            .first();

        if (exists) {
            console.log(`Property already exists for user ${user_id}`);
            return { skipped: true };
        }
        await db('props').insert({
            user_id: user_id,
            property: property
        }).then(() => { });
        return { skipped: false };
    } catch (error) {
        console.error("Error inserting property:", error.message);
        throw new Error(`Failed to insert property: ${error.message}`)
    }
};

export const deleteCompound = async (user_id, entry_id) => {
    try {
        const exists = await db.select('*').from('compound')
            .where('id', entry_id).andWhere('user_id', user_id)
            .first();
        if (exists) {
            await db('compound').where('id', entry_id).del();
        }
        else {
            console.log(`Compound does not exist for user ${user_id}`);
            return { skipped: true };
        }
    } catch (error) {
        console.error("Error deleting compound:", error.message);
        throw new Error(`Failed to delete compound: ${error.message}`)
    }
};

export const deleteProperty = async (user_id, property) => {
    try {
        const exists = await db('props')
            .where({ user_id, property })
            .first();
        if (exists) {
            await db('props').where('property', property)
                .andWhere('user_id', user_id).del();
        }
        else {
            console.log(`Property does not exist for user ${user_id}`);
            return { skipped: true };
        }
    } catch (error) {
        console.error("Error inserting property:", error.message);
        throw new Error(`Failed to insert property: ${error.message}`)
    }
};

export const putName = async (user_id, name) => {
    try {
        await db('user_').where('id', user_id)
            .update('name', name);
    } catch (error) {
        console.error("Error updating name:", error.message);
        throw new Error(`Failed to update name: ${error.message}`)
    }
};

export const getProperties = async (user_id) => {
    try {
        const result = await db.select('property').from('props').where('user_id', user_id);
        return result;
    } catch (error) {
        console.error("Error fetching properties:", error.message);
        throw new Error(`Failed to fetch properties: ${error.message}`)
    }
};

export const fetchAllCids = async (user_id) => {
    try {
        const result = await db.select('id', 'cid').from('compound').where('user_id', user_id);
        return result;
    } catch (error) {
        console.error("Error fetching CIDs:", error.message);
        throw new Error(`Failed to fetch CIDs: ${error.message}`)
    }
};

export const createChatHistory = async (user_id, message, type) => {
    try {
        await db('messages').insert({
            user_id: user_id,
            sender: type,
            message: message
        });
    } catch (error) {
        console.error("Error fetching properties:", error.message);
        throw new Error(`Failed to fetch properties: ${error.message}`)
    }
};

export const getChatHistory = async (user_id, limit = 100) => {
    try {
        const result = await db('messages')
            .where({ user_id })
            .orderBy('created_at', 'asc')
            .limit(limit);
        return result.map(msg => ({
            sender: msg.sender === 'user' ? 'User' : 'ChemBot',
            message: msg.message
        }));

    } catch (error) {
        console.error("Error fetching chat history:", error.message);
        throw new Error(`Failed to fetch history: ${error.message}`)
    }
};


