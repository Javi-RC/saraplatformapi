const express = require('express');
const router = express.Router();
const cvController = require('../controllers/cv.controller');
const passport = require('passport');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Use PDF or TXT'), false);
    }
  }
});

const authenticate = passport.authenticate('jwt', { session: false });

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'org_admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Access denied. Administrator permissions are required.'
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

/**
 * @route   GET /api/cv/completeness
 * @desc    Obtiene el estado de completitud del CV del usuario
 * @access  Private
 */
router.get('/completeness', authenticate, cvController.getCompleteness);

/**
 * @route   GET /api/cv/missing-fields-questions
 * @desc    Obtiene preguntas dinámicas para completar los campos faltantes del CV
 * @access  Private
 * @query   language - Idioma de las preguntas ('en' o 'es', por defecto 'en')
 * @query   groupByCategory - Si es 'true', agrupa las preguntas por categoría
 */
router.get('/missing-fields-questions', authenticate, cvController.getMissingFieldsQuestions);

/**
 * @route   PATCH /api/cv/complete-fields
 * @desc    Completa los campos faltantes del CV
 * @access  Private
 */
router.patch('/complete-fields', authenticate, cvController.completeFields);

/**
 * @route   POST /api/cv/questionnaire/next
 * @desc    Submit phase responses and get next phase
 * @access  Private
 */
router.post('/questionnaire/next', authenticate, cvController.submitPhaseResponses);

/**
 * @route   POST /api/cv/questionnaire/submit
 * @desc    Submit final questionnaire responses
 * @access  Private
 */
router.post('/questionnaire/submit', authenticate, cvController.submitQuestionnaire);

// Error handler middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File is too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Error uploading file: ${error.message}`
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
