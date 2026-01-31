const { Router } = require('express');
const router = Router();

router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'TFG API is running',
    version: '1.0.0'
  });
});

module.exports = router;