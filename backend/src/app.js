const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const auth = require('./middleware/auth');

const app = express();

// Basic request logging
app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    console.log(
      `[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'))
);

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'devtrack-backend',
    timestamp: new Date().toISOString(),
  });
});

// Profile routes (requires auth)
app.use('/api/profile', auth, profileRoutes);

// Task routes (requires auth)
app.use('/api/tasks', auth, taskRoutes);

// 404 handler for unknown API routes
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ message: 'Route not found' });
  }
  next();
});

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Error] Unhandled error', {
    message: err.message,
  });

  if (res.headersSent) {
    return;
  }

  res.status(err.statusCode || 500).json({
    message:
      err.message || 'An unexpected error occurred. Please try again later.',
  });
});

module.exports = app;

