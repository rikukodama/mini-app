const { Response } = require('../utils/response');
const telegramService = require('../services/telegram');
const logger = require('../utils/logger');
const socketService = require('../services/socket');

class TelegramController {
  async handleUpdate(req, res) {
    try {
      await telegramService.getBot().handleUpdate(req.body);
      return res.json(new Response().ok(true));
    } catch (error) {
      logger.error('Telegram Update Error:', error);
      return res.status(500).json(new Response().error('Failed to handle telegram update'));
    }
  }

  async handlePaymentWebhook(req, res) {
    try {
      const order = await telegramService.handlePayment(req.body);
      
      // Emit order update to connected clients
      await socketService.emitToUser(order.user_id, 'order', order);
      
      return res.json(new Response().ok(true));
    } catch (error) {
      logger.error('Payment Webhook Error:', error);
      return res.status(500).json(new Response().error('Failed to process payment webhook'));
    }
  }

  async generateDeepLink(req, res) {
    try {
      const { referralCode } = req.body;
      const link = `https://t.me/${process.env.BOT_USERNAME}/app?startapp=${referralCode}`;
      
      return res.json(new Response().data({ link }));
    } catch (error) {
      logger.error('Generate Deep Link Error:', error);
      return res.status(500).json(new Response().error('Failed to generate deep link'));
    }
  }
}

module.exports = new TelegramController();