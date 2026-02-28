import jwt from 'jsonwebtoken';
import { cookies } from '#utils/cookies.js';
import { signupSchema } from "#validations/auth.validation.js";
import { formatValidationErrors } from "#utils/format.js";
import { createUser } from "#services/auth.service.js";
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