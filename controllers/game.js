const { Response } = require('../utils/response');
const gameService = require('../services/game');
const logger = require('../utils/logger');
const socketService = require('../services/socket');

class GameController {
  async getGameData(req, res) {
    try {
      const gameData = await gameService.getGameData(req.user.id);
      return res.json(new Response().data(gameData));
    } catch (error) {
      logger.error('Get Game Data Error:', error);
      return res.status(500).json(new Response().error('Failed to fetch game data'));
    }
  }

  async updateProgress(req, res) {
    try {
      const { lives, power_up_count, unlocked_badge_data, unlocked_monster_data } = req.body;
      
      const updatedData = await gameService.updateGameProgress(req.user.id, {
        lives,
        power_up_count,
        unlocked_badge_data,
        unlocked_monster_data
      });

      // Emit progress update event
      socketService.emitToUser(req.user.id, 'gameProgressUpdate', updatedData);

      return res.json(new Response().data(updatedData));
    } catch (error) {
      logger.error('Update Progress Error:', error);
      return res.status(500).json(new Response().error('Failed to update progress'));
    }
  }

  async updateLevel(req, res) {
    try {
      const { levelNumber } = req.params;
      const levelData = req.body;

      const updatedLevel = await gameService.updateLevel(
        req.user.id,
        parseInt(levelNumber),
        levelData
      );

      // Emit level update event
      socketService.emitToUser(req.user.id, 'levelUpdate', updatedLevel);

      return res.json(new Response().data(updatedLevel));
    } catch (error) {
      logger.error('Update Level Error:', error);
      return res.status(500).json(new Response().error('Failed to update level'));
    }
  }

  async usePowerUp(req, res) {
    try {
      const { powerUpType } = req.params;
      const { count = -1 } = req.body; // Default to using 1 power-up

      const updatedData = await gameService.updatePowerUps(
        req.user.id,
        powerUpType,
        count
      );

      // Emit power-up update event
      socketService.emitToUser(req.user.id, 'powerUpUpdate', {
        powerUpType,
        newCount: updatedData.power_up_count[powerUpType]
      });

      return res.json(new Response().data(updatedData));
    } catch (error) {
      logger.error('Use Power Up Error:', error);
      return res.status(500).json(new Response().error('Failed to use power-up'));
    }
  }

  async unlockContent(req, res) {
    try {
      const { contentType, contentId } = req.params;

      const updatedData = await gameService.unlockContent(
        req.user.id,
        contentType,
        contentId
      );

      // Emit content unlock event
      socketService.emitToUser(req.user.id, 'contentUnlock', {
        contentType,
        contentId
      });

      return res.json(new Response().data(updatedData));
    } catch (error) {
      logger.error('Unlock Content Error:', error);
      return res.status(500).json(new Response().error('Failed to unlock content'));
    }
  }
}

module.exports = new GameController();