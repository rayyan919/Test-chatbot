import { resolveCompound } from '../services/pubchemServices.js'

async function saveCompoundToUser(user_id, compound) {
    const { type, value } = compound;
    try {
        if (type === 'name') {
            await resolveCompound(user_id, value, 'n');
        } else if (type === 'SMILES') {
            await resolveCompound(user_id, value, 's');
        } else if (type === 'CID') {
            await resolveCompound(user_id, value, 'c');
        } else {
            console.warn('Unknown compound type:', type);
        }
    } catch (error) {
        console.error(`Failed to save compound (${type} = ${value}) for user ${user_id}:`, error.message);
    }
};

export default saveCompoundToUser;