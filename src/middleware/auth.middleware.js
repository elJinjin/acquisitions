import logger from '#config/logger.js';
import { jwttoken } from '#utils/jwt.js';

const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res
        .status(401)
        .json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwttoken.verify(token);
    req.user = decoded;
    next();
  } catch (e) {
    logger.error('Authentication error', e);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export default authMiddleware;
