const mongoose = require('mongoose');

// Memoized so every caller awaits the same connection attempt instead of opening
// a second one (app.js connects for serverless, server.js connects before listening).
let connectionPromise = null;

const doConnect = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 300000,
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 10000
    });

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    throw err;
  }
};

const connectDB = () => {
  if (!connectionPromise) {
    connectionPromise = doConnect().catch((err) => {
      // Let a later call retry instead of caching the failure forever
      connectionPromise = null;
      throw err;
    });
  }
  return connectionPromise;
};

module.exports = connectDB;