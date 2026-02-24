const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('[DB] MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      // Keep options explicit for production-style clarity; Mongoose 9 uses modern defaults
    });

    console.log('[DB] Connected to MongoDB');
  } catch (error) {
    console.error('[DB] Failed to connect to MongoDB', {
      message: error.message,
    });
    process.exit(1);
  }
};

module.exports = connectDB;

