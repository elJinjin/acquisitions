import jwt from 'jsonwebtoken';
import { cookies } from '#utils/cookies.js';
import { signupSchema } from "#validations/auth.validation.js";
import { formatValidationErrors } from "#utils/format.js";
import { createUser, authenticateUser } from "#services/auth.service.js";
import logger from '#config/logger.js';
import 'dotenv/config';  // 👈 add this at top

export const signup = async (req, res, next) => {
    try {
        const validationResult = signupSchema.safeParse(req.body);
        
        if (!validationResult.success) {
            return res.status(400).json({ 
                error: "Validation failed",
                details: formatValidationErrors(validationResult.error)
            });
        }
        const { name, email, password, role } = validationResult.data;
        
        const user = await createUser({ name, email, password, role });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        cookies.set(res, 'token', token);  // 👈 add this line!
        
        logger.info(`User registered successfully: ${email}`);
        res.status(201).json({ 
            message: 'User registered',
            user: {
                id: user.id, // This should come from the database after creating the user
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (e) {
        logger.error('Signup error', e);
        
        if(e.message === 'User with this email already exists') {
            return res.status(409).json({ error: "Email already exists" });
        }
        next(e);
    }
};

export const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const user = await authenticateUser(email, password);
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        cookies.set(res, 'token', token);
        logger.info(`User logged in successfully: ${email}`);
        res.status(200).json({
            message: 'User logged in',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (e) {
        logger.error('Sign-in error', e);
        if (e.message === 'User not found' || e.message === 'Invalid password') {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        next(e);
    }
};

export const signOut = (req, res, next) => {
    try {
        cookies.clear(res, 'token');
        logger.info('User logged out');
        res.status(200).json({ message: 'User logged out' });
    } catch (e) {
        logger.error('Sign-out error', e);
        next(e);
    }
};