const { Router } = require('express');
const { body } = require('express-validator');
const walletController = require('../controllers/wallet');
const { validate } = require('../utils/middleware/validation');
const { authenticate } = require('../utils/middleware/auth');

const router = Router();

// Validation middleware
const connectValidation = [
  body('account.address').notEmpty().withMessage('Wallet address is required'),
  body('account.publicKey').notEmpty().withMessage('Public key is required'),
  body('connectItems.tonProof').exists().withMessage('TON proof is required'),
  validate
];

// Protected routes
router.use(authenticate);

router.post('/connect', connectValidation, walletController.connect);
router.get('/balance', walletController.getBalance);
router.post('/generate-payload', walletController.generatePayload);
router.post('/disconnect', walletController.disconnect);

module.exports = router;