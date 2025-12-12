const express = require('express');
const router = express.Router();
const cvController = require('../controllers/cv.controller');
const passport = require('passport');
const multer = require('multer');

// Configurar multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo PDF y TXT
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no soportado. Use PDF o TXT'), false);
    }
  }
});

// Middleware de autenticación JWT
const authenticate = passport.authenticate('jwt', { session: false });

// Middleware de autorización para admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'org_admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Acceso denegado. Se requieren permisos de administrador.'
  });
};

/**
 * @route   POST /api/cv/upload
 * @desc    Sube y procesa un CV
 * @access  Private (requiere autenticación)
 */
router.post('/upload', authenticate, upload.single('cv'), cvController.uploadCV);

/**
 * @route   GET /api/cv/my-cv
 * @desc    Obtiene el CV del usuario autenticado
 * @access  Private
 */
router.get('/my-cv', authenticate, cvController.getMyCV);

/**
 * @route   POST /api/cv/submit-to-organization
 * @desc    Envía el CV a una organización
 * @access  Private
 */
router.post('/submit-to-organization', authenticate, cvController.submitToOrganization);

/**
 * @route   GET /api/cv/stats
 * @desc    Obtiene estadísticas del CV del usuario
 * @access  Private
 */
router.get('/stats', authenticate, cvController.getCVStats);

/**
 * @route   GET /api/cv/:cvId
 * @desc    Obtiene un CV específico por ID
 * @access  Private (propietario o admin)
 */
router.get('/:cvId', authenticate, cvController.getCVById);

/**
 * @route   PUT /api/cv/:cvId
 * @desc    Actualiza el CV del usuario
 * @access  Private
 */
router.put('/:cvId', authenticate, cvController.updateCV);

/**
 * @route   DELETE /api/cv/:cvId
 * @desc    Elimina el CV del usuario
 * @access  Private
 */
router.delete('/:cvId', authenticate, cvController.deleteCV);

/**
 * @route   GET /api/cv/admin/all
 * @desc    Obtiene todos los CVs (con filtros opcionales)
 * @access  Private (solo admin)
 */
router.get('/admin/all', authenticate, isAdmin, cvController.getAllCVs);

/**
 * @route   POST /api/cv/admin/search
 * @desc    Busca CVs por criterios
 * @access  Private (solo admin)
 */
router.post('/admin/search', authenticate, isAdmin, cvController.searchCVs);

// Manejo de errores de multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'El archivo es demasiado grande. Máximo 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Error al subir archivo: ${error.message}`
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  next();
});

module.exports = router;
