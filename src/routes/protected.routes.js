const { Router } = require('express');
const router = Router();
const { authMiddleware } = require('../utils/jwt');

// Ruta protegida de ejemplo
router.get('/profile', authMiddleware, (req, res) => {
  res.json({ 
    success: true, 
    message: 'Access to protected route granted', 
    user: req.user 
  });
});

module.exports = router;