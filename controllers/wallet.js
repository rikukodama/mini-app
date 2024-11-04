const { Response } = require('../utils/response');
const walletService = require('../services/wallet');
const prisma = require('../config/database');
const logger = require('../utils/logger');

class WalletController {
  async connect(req, res) {
    try {
      const walletInfo = req.body;
      const result = await walletService.verifyConnection(walletInfo);
      
      if (!result.valid) {
        return res.status(400).json(new Response().error(result.message));
      }

      const user = await prisma.users.update({
        where: { id: req.user.id },
        data: { 
          address: result.address,
          wallet_connected_at: new Date()
        }
      });

      return res.json(new Response().data(user));
    } catch (error) {
      logger.error('Wallet Connect Error:', error);
      return res.status(400).json(new Response().error('Failed to connect wallet'));
    }
  }

  async getBalance(req, res) {
    try {
      if (!req.user.address) {
        return res.status(400).json(new Response().error('Wallet not connected'));
      }

      const balance = await walletService.getBalance(req.user.address);
      return res.json(new Response().data(balance));
    } catch (error) {
      logger.error('Get Balance Error:', error);
      return res.status(400).json(new Response().error('Failed to fetch balance'));
    }
  }

  async generatePayload(req, res) {
    try {
      const payload = await walletService.generatePayload();
      return res.json(new Response().data(payload));
    } catch (error) {
      logger.error('Generate Payload Error:', error);
      return res.status(400).json(new Response().error('Failed to generate payload'));
    }
  }

  async disconnect(req, res) {
    try {
      await prisma.users.update({
        where: { id: req.user.id },
        data: { 
          address: null,
          wallet_connected_at: null
        }
      });

      return res.json(new Response().ok(true));
    } catch (error) {
      logger.error('Wallet Disconnect Error:', error);
      return res.status(400).json(new Response().error('Failed to disconnect wallet'));
    }
  }
}

module.exports = new WalletController();