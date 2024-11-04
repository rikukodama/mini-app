const { Response } = require('../utils/response');
const authService = require('../services/auth');
const logger = require('../utils/logger');

class AuthController {
  async login(req, res) {
    try {
      const isValid = await authService.verifyTelegramAuth(req.query);
      if (!isValid) {
        return res.status(401).json(new Response().error('Invalid authentication'));
      }

      const user = await authService.handleUserLogin(JSON.parse(req.query.user));
      const tokens = await authService.generateTokens(user);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.json(new Response().data({
        accessToken: tokens.accessToken,
        user
      }));
    } catch (error) {
      logger.error('Login Error:', error);
      return res.status(500).json(new Response().error('Authentication failed'));
    }
  }

  async refresh(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json(new Response().error('No refresh token'));
      }

      const tokens = await authService.refreshTokens(refreshToken);
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json(new Response().data({
        accessToken: tokens.accessToken
      }));
    } catch (error) {
      logger.error('Refresh Token Error:', error);
      return res.status(401).json(new Response().error('Invalid refresh token'));
    }
  }
}

module.exports = new AuthController();