const { Bot, InlineKeyboard } = require("grammy");
const logger = require('../utils/logger');
const prisma = require('../config/database');

class TelegramService {
  constructor() {
    this.bot = new Bot(process.env.BOT_TOKEN);
    this.setupBot();
  }

  setupBot() {
    // Set up basic error handling
    this.bot.catch((err) => {
      logger.error('Telegram Bot Error:', err);
    });

    // Bot commands
    this.setupCommands();

    // Bot webhook (for production)
    if (process.env.NODE_ENV === "production") {
      this.setupWebhook();
    }
  }

  async setupCommands() {
    try {
      await this.bot.api.setMyCommands([
        { command: "start", description: "Start the bot" },
        { command: "menu", description: "Show main menu" }
      ]);
    } catch (error) {
      logger.error('Setup Commands Error:', error);
    }
  }

  async setupWebhook() {
    const webhookUrl = `${process.env.BASE_HOST}/webhook/telegram-bot`;
    const webhookInfo = await this.bot.api.getWebhookInfo();

    if (webhookInfo.url !== webhookUrl) {
      await this.bot.api.deleteWebhook({ drop_pending_updates: true });
      await this.bot.api.setWebhook(webhookUrl);
    }
  }

  async handleStart(ctx) {
    try {
      const inlineKeyboard = new InlineKeyboard()
        .row()
        .webApp("Open Game", process.env.APP_URL);

      await ctx.replyWithPhoto(
        `${process.env.BASE_HOST}/images/intro.jpg`,
        {
          caption: "Welcome to the game! Click the button below to start playing.",
          reply_markup: inlineKeyboard,
          parse_mode: "HTML"
        }
      );
    } catch (error) {
      logger.error('Handle Start Error:', error);
      await ctx.reply("Sorry, something went wrong. Please try again later.");
    }
  }

  async handleInvite(ctx) {
    try {
      const code = ctx.match[1];
      const imageSource = `${process.env.BASE_HOST}/images/intro.jpg`;

      await ctx.answerInlineQuery([{
        id: "invite",
        type: "photo",
        photo_url: imageSource,
        thumbnail_url: imageSource,
        title: "Invite Link",
        description: "Join the game!",
        reply_markup: new InlineKeyboard()
          .row()
          .url("OPEN APP", `https://t.me/${process.env.BOT_USERNAME}/app?startapp=${code}`)
      }], {
        is_personal: true
      });
    } catch (error) {
      logger.error('Handle Invite Error:', error);
    }
  }

  async handlePayment(ctx) {
    try {
      const payload = ctx.message?.successful_payment?.invoice_payload;
      if (!payload) {
        throw new Error('No payment payload found');
      }

      const order = await prisma.orders.update({
        where: { order_no: payload },
        data: { status: "confirmed" }
      });

      await ctx.reply('✅ Payment successful! Your coins have been added to your account.');
      
      return order;
    } catch (error) {
      logger.error('Handle Payment Error:', error);
      await ctx.reply('⚠️ There was an issue processing your payment. Please contact support.');
      throw error;
    }
  }

  getBot() {
    return this.bot;
  }
}

module.exports = new TelegramService();