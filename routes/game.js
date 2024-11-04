const { Router } = require('express');
const { body, param } = require('express-validator');
const gameController = require('../controllers/game');
const { validate } = require('../utils/middleware/validation');
const { authenticate } = require('../utils/middleware/auth');

const router = Router();

// Validation middlewares
const levelValidation = [
  param('levelNumber').isInt({ min: 1 }).withMessage('Invalid level number'),
  validate
];

const powerUpValidation = [
  param('powerUpType').isIn(['addMoreMoves', 'universal', 'powerUpRing']).withMessage('Invalid power-up type'),
  body('count').optional().isInt().withMessage('Count must be an integer'),
  validate
];

const contentValidation = [
  param('contentType').isIn(['badge', 'monster']).withMessage('Invalid content type'),
  param('contentId').isString().notEmpty().withMessage('Content ID is required'),
  validate
];

// Routes
router.use(authenticate);

router.get('/data', gameController.getGameData);

router.put('/progress', 
  [
    body('lives').optional().isInt({ min: 0 }),
    body('power_up_count').optional().isObject(),
    body('unlocked_badge_data').optional().isArray(),
    body('unlocked_monster_data').optional().isArray(),
    validate
  ],
  gameController.updateProgress
);

router.put('/level/:levelNumber', levelValidation, gameController.updateLevel);

router.post('/power-up/:powerUpType/use', powerUpValidation, gameController.usePowerUp);

router.post('/unlock/:contentType/:contentId', contentValidation, gameController.unlockContent);

module.exports = router;