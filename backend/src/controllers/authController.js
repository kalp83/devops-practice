const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuthToken = require('../models/AuthToken');

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ id: userId }, secret, { expiresIn });
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const token = signToken(user._id.toString());

    await AuthToken.create({
      user: user._id,
      token,
      isUsed: false,
    });

    console.log('[Auth] Registered user', { id: user._id.toString() });

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('[Auth] Failed to register user', { message: error.message });
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user._id.toString());

    await AuthToken.create({
      user: user._id,
      token,
      isUsed: false,
    });

    console.log('[Auth] User logged in', { id: user._id.toString() });

    res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('[Auth] Failed to log in user', { message: error.message });
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ')
      ? header.split(' ')[1]
      : null;

    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    const record = await AuthToken.findOne({ token, user: req.user.id });

    if (!record) {
      return res.status(200).json({ message: 'Logged out' });
    }

    if (!record.isUsed) {
      record.isUsed = true;
      await record.save();
    }

    console.log('[Auth] Logged out token', {
      id: record._id.toString(),
      user: req.user.id,
    });

    res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    console.error('[Auth] Failed to log out', { message: error.message });
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
};

