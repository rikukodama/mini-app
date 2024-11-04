const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    this.accessSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTime = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTime = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  async generateTokens(user) {
    const accessToken = jwt.sign(
      { id: user.id, address: user.address },
      this.accessSecret,
      { expiresIn: this.accessTime }
    );

    const refreshToken = jwt.sign(
      { id: user.id, address: user.address },
      this.refreshSecret,
      { expiresIn: this.refreshTime }
    );

    return { accessToken, refreshToken };
  }

  async verifyTelegramAuth(telegramData) {
    try {
      const { hash, ...data } = telegramData;
      const generatedHash = await generateHex(data, process.env.BOT_TOKEN);
      return hash === generatedHash;
    } catch (error) {
      logger.error('Telegram Auth Error:', error);
      return false;
    }
  }

  async handleUserLogin(telegramData) {
    const telegramId = telegramData.id.toString();
    let user = await prisma.users.findFirst({
      where: { telegram_id: telegramId }
    });

    if (!user) {
      user = await this.createNewUser(telegramData);
    } else {
      user = await this.updateExistingUser(user.id, telegramData);
    }

    return user;
  }

  async createNewUser(telegramData) {
    const referralCode = this.generateReferralCode();
    return await prisma.users.create({
      data: {
        telegram_id: telegramData.id.toString(),
        username: telegramData.username,
        referralCode,
        gameData: {
          create: {
            lives: 3,
            power_up_count: {
              addMoreMoves: 0,
              universal: 0,
              powerUpRing: 0
            },
            unlocked_badge_data: [],
            unlocked_monster_data: [],
          }
        }
      }
    });
  }

  generateReferralCode() {
    return require('crypto').randomBytes(8).toString('hex');
  }
}

module.exports = new AuthService();