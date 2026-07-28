const express = require('express');
const router = express.Router();
const cvController = require('../controllers/cv.controller');
const passport = require('passport');
const multer = require('multer');
const { isAdmin } = require('../middleware/authorization');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
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

/**
 * @route   POST /api/cv/upload
 * @desc    Uploads and processes a curriculum
 * @access  Private (requires authentication)
 */
router.post('/upload', authenticate, upload.single('cv'), cvController.uploadCV);

/**
 * @route   GET /api/cv/my-cv
 * @desc    Gets the authenticated user's curriculum
 * @access  Private
 */
router.get('/my-cv', authenticate, cvController.getMyCV);

/**
 * @route   POST /api/cv/submit-to-organization
 * @desc    Submits the curriculum to an organization
 * @access  Private
 */
router.post('/submit-to-organization', authenticate, cvController.submitToOrganization);

/**
 * @route   GET /api/cv/stats
 * @desc    Gets the user's curriculum statistics
 * @access  Private
 */
router.get('/stats', authenticate, cvController.getCVStats);

/**
 * @route   GET /api/cv/admin/all
 * @desc    Gets all curricula (with optional filters)
 * @access  Private (admin only)
 */
router.get('/admin/all', authenticate, isAdmin, cvController.getAllCVs);

/**
 * @route   POST /api/cv/admin/search
 * @desc    Searches curricula by criteria
 * @access  Private (admin only)
 */
router.post('/admin/search', authenticate, isAdmin, cvController.searchCVs);

/**
 * @route   GET /api/cv/completeness
 * @desc    Gets the completeness status of the user's curriculum
 * @access  Private
 */
router.get('/completeness', authenticate, cvController.getCompleteness);

/**
 * @route   GET /api/cv/missing-fields-questions
 * @desc    Gets dynamic questions to complete missing curriculum fields
 * @access  Private
 * @query   language - Question language ('en' or 'es', default 'en')
 * @query   groupByCategory - If 'true', groups questions by category
 */
router.get('/missing-fields-questions', authenticate, cvController.getMissingFieldsQuestions);

/**
 * @route   PATCH /api/cv/complete-fields
 * @desc    Completes missing curriculum fields
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

/**
 * @route   GET /api/cv/:cvId
 * @desc    Gets a specific curriculum by ID
 * @access  Private (owner or admin)
 */
router.get('/:cvId', authenticate, cvController.getCVById);

/**
 * @route   PUT /api/cv/:cvId
 * @desc    Updates the user's curriculum
 * @access  Private
 */
router.put('/:cvId', authenticate, cvController.updateCV);

/**
 * @route   DELETE /api/cv/:cvId
 * @desc    Deletes the user's curriculum
 * @access  Private
 */
router.delete('/:cvId', authenticate, cvController.deleteCV);

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
