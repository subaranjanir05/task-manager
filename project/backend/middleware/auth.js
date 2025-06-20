const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user not found' });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
};

const requireSubscription = (requiredPlan) => {
  return (req, res, next) => {
    const user = req.user;
    const planHierarchy = { free: 0, pro: 1, team: 2 };
    
    if (planHierarchy[user.subscription.plan] < planHierarchy[requiredPlan]) {
      return res.status(403).json({ 
        message: `${requiredPlan} subscription required`,
        currentPlan: user.subscription.plan,
        requiredPlan
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requireSubscription
};