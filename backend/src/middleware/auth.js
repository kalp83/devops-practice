const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuthToken = require('../models/AuthToken');

const auth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = header.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('[Auth] JWT_SECRET is not configured');
      return res
        .status(500)
        .json({ message: 'Authentication is not configured on this server' });
    }

    const decoded = jwt.verify(token, secret);

    const tokenRecord = await AuthToken.findOne({
      token,
      user: decoded.id,
    });

    if (!tokenRecord || tokenRecord.isUsed) {
      return res.status(401).json({ message: 'Token is no longer valid' });
    }

    const user = await User.findById(decoded.id).select(
      '_id name email bio avatarUrl createdAt'
    );

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    req.userEntity = user;

    next();
  } catch (error) {
    console.error('[Auth] Failed to verify token', { message: error.message });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth;

