// Update with your config settings.
import dotenv from 'dotenv';
dotenv.config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export default {
    development: {
        client: 'mysql2',
        connection: {
            host: process.env.DB_HOST || '127.0.0.1',
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    },

    staging: {
        client: 'mysql2',
        connection: {
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    }
};