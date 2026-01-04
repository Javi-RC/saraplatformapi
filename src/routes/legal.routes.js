const { Router } = require('express');
const router = Router();

const legalController = require('../controllers/legal.controller');

// Public endpoints (no auth)
router.get('/terms', (req, res) => legalController.getTerms(req, res));

module.exports = router;
