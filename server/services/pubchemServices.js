import axios from "axios";
import { postCompound, getProperties } from "../db/queries.js";
import { properties, files } from '../utils/properties.js'
import fs from 'fs/promises';
import path from 'path';


export const getCompoundInfoFromCid = async (user_id, cid) => {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/SMILES,IUPACName,Title/JSON`;
    const res = await axios.get(url);
    const props = res.data.PropertyTable.Properties[0];
    const smiles = props.SMILES;
    const iupac_name = props.IUPACName;
    const title = props.Title;
    return {
        res,
        user_id, title,
        iupac_name, cid, smiles
    };
};

export const getCompoundInfoFromName = async (user_id, name) => {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/property/SMILES,IUPACName,Title/JSON`;
    const res = await axios.get(url);
    const props = res.data.PropertyTable.Properties[0];
    const smiles = props.SMILES;
    const iupac_name = props.IUPACName;
    const cid = props.CID;
    const title = props.Title;
    return {
        res,
        user_id, title,
        iupac_name, cid, smiles
    };
};

export const getCompoundInfoFromSmiles = async (user_id, smiles) => {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${smiles}/property/IUPACName,Title/JSON`;
    const res = await axios.get(url);
    const props = res.data.PropertyTable.Properties[0];
    const iupac_name = props.IUPACName;
    const cid = props.CID;
    const title = props.Title;
    return {
        res,
        user_id, title,
        iupac_name, cid, smiles
    };
};

export const getPropertiesByCid = async (user_id, cid) => {
    const props = await getProperties(user_id);
    console.log(user_id);
    console.log(props);
    let property_set = new Set();
    for (let i = 0; i < props.length; i++) {
        if (properties.includes(props[i].property)) {
            property_set.add(props[i].property);
        }
    }
    const list = Array.from(property_set);
    const property_string = list.join(',');
    console.log(property_set);
    console.log(property_string);
    console.log(cid);
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/${property_string}/JSON`;
    console.log(url);
    const res = await axios.get(url);
    return res.data.PropertyTable.Properties[0];
};


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const getStructureFiles = async (user_id, cid) => {
    const errors = [];
    let success = false;

    const props = await getProperties(user_id);
    const downloadDir = path.resolve('./downloads');

    for (let i = 0; i < props.length; i++) {
        if (files.includes(props[i].property)) {
            const type = props[i].property;
            let url = '', filename = '';

            switch (type) {
                case "2DSDF":
                    url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=2d`;
                    filename = `Conformer2D_COMPOUND_CID_${cid}.sdf`;
                    break;
                case "3DSDF":
                    url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`;
                    filename = `Conformer3D_COMPOUND_CID_${cid}.sdf`;
                    break;
                case "2DPNG":
                    url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?record_type=2d&image_size=small`;
                    filename = `Conformer2D_COMPOUND_CID_${cid}.png`;
                    break;
                case "3DPNG":
                    url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?record_type=3d&image_size=small`;
                    filename = `Conformer3D_COMPOUND_CID_${cid}.png`;
                    break;
                default:
                    continue;
            }

            try {
                console.log(url);
                const userDir = path.join(downloadDir, user_id.replace(/[^a-zA-Z0-9_-]/g, ''));
                await fs.mkdir(userDir, { recursive: true });

                const filePath = path.join(userDir, filename);
                const fileExists = await fs.access(filePath).then(() => true).catch(() => false);

                if (!fileExists) {
                    const res = await axios.get(url, { responseType: 'arraybuffer' });
                    await fs.writeFile(filePath, res.data);
                }

                success = true;
            } catch (err) {
                errors.push(`Failed to download/write ${type} for CID ${cid}: ${err.message}`);
            }
        }

        await sleep(5000);
    }

    return [success, errors];
};

export const resolveCompound = async (user_id, input, type) => {
    const trimmed = input.trim();
    const errors = [];

    if (type) {
        switch (type) {
            case 'c':
                try {
                    const res = await getCompoundInfoFromCid(user_id, trimmed);
                    await postCompound(res.user_id, res.title, res.iupac_name, res.cid, res.smiles);
                    return;
                } catch (err) {
                    errors.push(`CID lookup failed: ${err.message}`);
                }
                break;
            case 'n':
                try {
                    const res = await getCompoundInfoFromName(user_id, trimmed);
                    await postCompound(res.user_id, res.title, res.iupac_name, res.cid, res.smiles);
                    return;
                } catch (err) {
                    errors.push(`Name lookup failed: ${err.message}`);
                }
                break;
            case 's':
                try {
                    const res = await getCompoundInfoFromSmiles(user_id, trimmed);
                    await postCompound(res.user_id, res.title, res.iupac_name, res.cid, res.smiles);
                    return;
                } catch (err) {
                    errors.push(`SMILES lookup failed: ${err.message}`);
                }
                break;
        }

    } else {

        if (/^\d+$/.test(trimmed)) {
            try {
                const res = await getCompoundInfoFromCid(user_id, trimmed);
                await postCompound(res.user_id, res.title, res.iupac_name, res.cid, res.smiles);
                return;
            } catch (err) {
                errors.push(`CID lookup failed: ${err.message}`);
            }
        }

        try {
            const res = await getCompoundInfoFromName(user_id, trimmed);
            await postCompound(res.user_id, res.title, res.iupac_name, res.cid, res.smiles);
            return;
        } catch (err) {
            errors.push(`Name lookup failed: ${err.message}`);
        }

        try {
            const res = await getCompoundInfoFromSmiles(user_id, trimmed);
            await postCompound(res.user_id, res.title, res.iupac_name, res.cid, res.smiles);
            return;
        } catch (err) {
            errors.push(`SMILES lookup failed: ${err.message}`);
        }
    }

    throw new Error(`Failed to resolve compound input: '${trimmed}'\n${errors.join('\n')}`);
};


