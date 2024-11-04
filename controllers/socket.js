const { Response } = require('../utils/response');
const socketService = require('../services/socket');
const logger = require('../utils/logger');

class SocketController {
  async emit(req, res) {
    try {
      const { name, data } = req.body;
      
      if (!socketService.connected) {
        await socketService.connect();
      }

      switch (name) {
        case 'game:progress':
          socketService.emitGameProgress(data);
          break;
        case 'game:achievement':
          socketService.emitAchievement(data);
          break;
        case 'order:update':
          socketService.emitOrderUpdate(data);
          break;
        default:
          throw new Error('Invalid event name');
      }

      return res.json(new Response().ok(true));
    } catch (error) {
      logger.error('Socket Emit Error:', error);
      return res.status(500).json(new Response().error('Failed to emit socket event'));
    }
  }

  async getStatus(req, res) {
    try {
      const status = {
        connected: socketService.connected,
        reconnectAttempts: socketService.reconnectAttempts
      };

      return res.json(new Response().data(status));
    } catch (error) {
      logger.error('Socket Status Error:', error);
      return res.status(500).json(new Response().error('Failed to get socket status'));
    }
  }

  async reconnect(req, res) {
    try {
      await socketService.connect();
      return res.json(new Response().ok(true));
    } catch (error) {
      logger.error('Socket Reconnect Error:', error);
      return res.status(500).json(new Response().error('Failed to reconnect socket'));
    }
  }
}

module.exports = new SocketController();