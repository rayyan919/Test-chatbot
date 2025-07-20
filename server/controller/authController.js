import db from '../db/db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import handleResponse from '../utils/handleResponse.js';
import { postUser } from '../db/queries.js';
dotenv.config();

export const verifyToken = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).send("Missing token");
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).send("Invalid token");
    }
};

export const Login = async (req, res, next) => {
    const { username } = req.body;
    try {
        let [user] = await db.select('*').from('user_').where('username', username);

        if (!user) {
            await postUser(username);
            [user] = await db.select('*').from('user_').where('username', username);
        }

        const token = jwt.sign(
            { username: user.username, id: user.id },
            process.env.SECRET_KEY,
            { expiresIn: '1h' }
        );

        handleResponse(res, 200, 'User logged in successfully', {
            user: {
                id: user.id,
                username: user.username
            },
            token: token
        });
    } catch (error) {
        console.error('Login error:', error);
        next(error);
    }
};