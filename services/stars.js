const { Bot } = require("grammy");
const prisma = require("../config/database");
const logger = require('../utils/logger');

class StarsService {
  constructor() {
    this.name = 'stars';
  }

  async loadKeys(key) {
    try {
      const app = await prisma.apps.findFirst({
        select: { 
          email: true, 
          payments: { 
            select: { 
              keys: true, 
              payment: true 
            } 
          } 
        }, 
        where: { key }
      });
      
      const keys = app.payments.find((p) => p.payment === this.name).keys;
      this.telegramId = keys.telegram_id;
      this.token = keys.token;
    } catch (error) {
      logger.error('Stars Service Key Loading Error:', error);
      throw new Error('Failed to load Stars payment keys');
    }
  }

  async create({ telegramId, name, description, amount, orderNo }) {
    try {
      const prices = [{ 
        label: name, 
        amount: parseInt(amount) 
      }];

      const bot = new Bot(this.token);
      const result = await bot.api.sendInvoice(
        telegramId,
        name,
        description,
        orderNo,
        process.env.PROVIDER_TOKEN,
        "JOOY",
        prices
      );

      return { 
        id: result.message_id.toString() 
      };
    } catch (error) {
      logger.error('Stars Payment Creation Error:', error);
      throw new Error('Failed to create Stars payment');
    }
  }

  async verifyPayment(payload) {
    try {
      // Implement payment verification logic
      return true; // Replace with actual verification
    } catch (error) {
      logger.error('Stars Payment Verification Error:', error);
      return false;
    }
  }
}

module.exports = new StarsService();