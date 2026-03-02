import logger from '#config/logger.js';
import { getAllUsers, getUserById as getUserByIdService, updateUser as updateUserService, deleteUser as deleteUserService } from '#services/users.services.js';
import { userIdSchema, updateUserSchema } from '#validations/users.validation.js';
import { formatValidationErrors } from '#utils/format.js';

export const fetchAllUsers = async (req, res, next) => {
    try {
        logger.info('Getting users...');
        const allUsers = await getAllUsers();
        res.json({
            message: 'Successfully retrieved users',
            users: allUsers,
            count: allUsers.length,
        })
    } catch (e) {
        logger.error('Error fetching users', e);
        next(e);
    }
}

export const fetchUserById = async (req, res, next) => {
    try {
        const paramResult = userIdSchema.safeParse(req.params);
        if (!paramResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationErrors(paramResult.error),
            });
        }

        const { id } = paramResult.data;

        // Non-admin users can only view their own account
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only view your own account' });
        }

        logger.info(`Getting user by id: ${id}`);
        const user = await getUserByIdService(id);

        res.json({ message: 'Successfully retrieved user', user });
    } catch (e) {
        logger.error('Error fetching user by id', e);
        if (e.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        next(e);
    }
}

export const updateUser = async (req, res, next) => {
    try {
        const paramResult = userIdSchema.safeParse(req.params);
        if (!paramResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationErrors(paramResult.error),
            });
        }

        const bodyResult = updateUserSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationErrors(bodyResult.error),
            });
        }

        const { id } = paramResult.data;
        const updates = bodyResult.data;

        // Users can only update their own information
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only update your own information' });
        }

        // Only admins can change the role field
        if (updates.role && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can change user roles' });
        }

        logger.info(`Updating user ${id}`);
        const user = await updateUserService(id, updates);

        res.json({ message: 'User updated successfully', user });
    } catch (e) {
        logger.error('Error updating user', e);
        if (e.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        next(e);
    }
}

export const deleteUser = async (req, res, next) => {
    try {
        const paramResult = userIdSchema.safeParse(req.params);
        if (!paramResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationErrors(paramResult.error),
            });
        }

        const { id } = paramResult.data;

        // Non-admin users can only delete their own account
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own account' });
        }

        logger.info(`Deleting user ${id}`);
        const user = await deleteUserService(id);

        res.json({ message: 'User deleted successfully', user });
    } catch (e) {
        logger.error('Error deleting user', e);
        if (e.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        next(e);
    }
}
