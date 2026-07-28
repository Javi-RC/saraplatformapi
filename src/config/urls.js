function getFrontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3001';
}

module.exports = { getFrontendUrl };
