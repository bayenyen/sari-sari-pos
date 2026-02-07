const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const adminOrCashier = (req, res, next) => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'CASHIER') {
    return res.status(403).json({ error: 'Admin or Cashier access required' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly, adminOrCashier };
