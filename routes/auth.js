const { Router } = require('express');
const authController = require('../controllers/auth');
const { validateTelegramAuth } = require('../utils/middleware/validation');

const router = Router();

router.post('/login', validateTelegramAuth, authController.login);
router.post('/refresh', authController.refresh);

module.exports = router;