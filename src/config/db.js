const mongoose = require('mongoose');
const dns = require('node:dns');

// Memoized so every caller awaits the same connection attempt instead of opening
// a second one (app.js connects for serverless, server.js connects before listening).
let connectionPromise = null;

const FALLBACK_DNS_SERVERS = ['8.8.8.8', '1.1.1.1'];

const isLoopback = (server) => {
  const host = server.replace(/^\[/, '').split(']')[0].split('%')[0];
  return host.startsWith('127.') || host === '::1';
};

/**
 * Guarantees Node's DNS resolver can answer SRV queries before we hand a
 * `mongodb+srv://` URI to the driver.
 *
 * On some Windows setups c-ares — the resolver behind `dns.resolveSrv` — fails
 * to read the system configuration and falls back to 127.0.0.1, where nothing
 * is listening. The symptom is confusing because everything else keeps working:
 * ordinary hostnames go through `dns.lookup()`, which asks the OS instead. Only
 * the SRV/TXT lookups that `mongodb+srv://` needs reach c-ares, and they die
 * with `querySrv ECONNREFUSED _mongodb._tcp.<cluster>`.
 *
 * `DNS_SERVERS` (comma-separated) overrides the resolver outright; without it we
 * only step in when the resolver has nothing but loopback to talk to.
 *
 * @param {string} uri The MongoDB connection string about to be used.
 */
const ensureResolvableDns = (uri) => {
  if (!uri.startsWith('mongodb+srv://')) return;

  const configured = (process.env.DNS_SERVERS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (configured.length) {
    dns.setServers(configured);
    return;
  }

  const current = dns.getServers();
  if (current.length && !current.every(isLoopback)) return;

  console.warn(
    `No usable DNS server for SRV lookups (resolver reported ${JSON.stringify(current)}). ` +
    `Falling back to ${FALLBACK_DNS_SERVERS.join(', ')}. Set DNS_SERVERS to choose your own.`
  );
  dns.setServers(FALLBACK_DNS_SERVERS);
};

const doConnect = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  ensureResolvableDns(uri);

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