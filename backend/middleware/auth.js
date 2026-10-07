const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'school_erp_secret_key_98765';

// Middleware to verify if user is logged in (has valid token)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: Please log in first' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Session expired or invalid token. Please log in again.' });
  }
};

// Middleware to authorize specific roles (e.g., 'admin', 'teacher')
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access Denied: Role '${req.user.role}' is not authorized to perform this action`,
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles, JWT_SECRET };