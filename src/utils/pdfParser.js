const Piscina = require('piscina');
const path = require('path');

const pool = new Piscina({
  filename: path.join(__dirname, '..', 'workers', 'pdf.worker.js'),
  minThreads: 1,
  maxThreads: 4,
  idleTimeout: 30_000,
});

const TIMEOUT_MS = 30_000;

function parsePdf(buffer) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(new Error('PDF parse timed out')), TIMEOUT_MS);

  return pool.run(buffer, { signal: ac.signal }).finally(() => {
    clearTimeout(timer);
  });
}

module.exports = { parsePdf };
