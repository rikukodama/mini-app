const { Router } = require('express');
const { body } = require('express-validator');
const socketController = require('../controllers/socket');
const { validate } = require('../utils/middleware/validation');
const { authenticate } = require('../utils/middleware/auth');

const router = Router();

router.use(authenticate);

// Validation middleware
const emitValidation = [
  body('name').isString().notEmpty().withMessage('Event name is required'),
  body('data').exists().withMessage('Event data is required'),
  validate
];

router.post('/emit', emitValidation, socketController.emit);
router.get('/status', socketController.getStatus);
router.post('/reconnect', socketController.reconnect);

module.exports = router;