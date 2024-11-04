const { Router } = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/payment');
const { validate } = require('../utils/middleware/validation');
const { authenticate } = require('../utils/middleware/auth');

const router = Router();

// Validation middleware
const createPaymentValidation = [
  body('coins').isInt({ min: 100, max: 10000 }).withMessage('Invalid coin amount'),
  body('currencyToken').isIn(['ton', 'usdt', 'stars']).withMessage('Invalid currency'),
  body('amount').isFloat({ min: 0.1 }).withMessage('Invalid amount'),
  validate
];

router.use(authenticate);

router.get('/items', paymentController.getPaymentItems);

router.post(
  '/:payment/create',
  createPaymentValidation,
  paymentController.createPayment
);

router.post(
  '/:payment/confirm/:id',
  [
    body('transactionId').notEmpty().withMessage('Transaction ID is required'),
    validate
  ],
  paymentController.confirmPayment
);

module.exports = router;