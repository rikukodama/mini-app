const { Context, InlineKeyboard } = require("grammy");
const logger = require('../logger');

class GameBotContext extends Context {
  constructor(update, api, me) {
    super(update, api, me);
  }

  async Menu() {
    try {
      const inlineKeyboard = new InlineKeyboard()
        .row()
        .webApp("Open Game", process.env.APP_URL)
        .row()
        .url("Support", process.env.SUPPORT_URL);

      const introMessage = `
🎮 Welcome to the Game!

🌟 Play and earn rewards
🎯 Complete challenges
🏆 Compete with others
💫 Unlock special content

Click the button below to start your adventure!`;

      return await this.replyWithPhoto(
        `${process.env.BASE_HOST}/images/intro.jpg`,
        {
          caption: introMessage,
          reply_markup: inlineKeyboard,
          parse_mode: "HTML"
        }
      );
    } catch (error) {
      logger.error('Menu Context Error:', error);
      await this.reply("Sorry, something went wrong. Please try again.");
    }
  }

  async sendPaymentSuccessMessage(coins) {
    try {
      await this.reply(
        `✨ Congratulations! ${coins} coins have been added to your account.\n\n` +
        `🎮 Keep playing and enjoying the game!`
      );
    } catch (error) {
      logger.error('Payment Success Message Error:', error);
    }
  }

  async sendAchievementMessage(achievement) {
    try {
      await this.reply(
        `🏆 Achievement Unlocked: ${achievement.name}!\n\n` +
        `${achievement.description}\n\n` +
        `🎮 Keep up the great work!`
      );
    } catch (error) {
      logger.error('Achievement Message Error:', error);
    }
  }
}

module.exports = GameBotContext;