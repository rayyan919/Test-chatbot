import { Model } from 'objection';
import knexConfig from './knexfile.js';
import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[environment]);

Model.knex(db);

export default db;