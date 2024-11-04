const { Router } = require('express');
const { body } = require('express-validator');
const telegramController = require('../controllers/telegram');
const { validate } = require('../utils/middleware/validation');
const { authenticate } = require('../utils/middleware/auth');

const router = Router();

// Public routes
router.post('/webhook', telegramController.handleUpdate);
router.post('/payment-webhook', telegramController.handlePaymentWebhook);

// Protected routes
router.use(authenticate);

router.post('/deep-link', 
  [
    body('referralCode').isString().notEmpty().withMessage('Referral code is required'),
    validate
  ],
  telegramController.generateDeepLink
);

module.exports = router;