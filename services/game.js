const prisma = require('../config/database');
const logger = require('../utils/logger');

class GameService {
  async getGameData(userId) {
    try {
      return await prisma.game_data.findFirst({
        where: { user_id: userId },
        include: {
          level_data: true
        }
      });
    } catch (error) {
      logger.error('Get Game Data Error:', error);
      throw new Error('Failed to fetch game data');
    }
  }

  async updateGameProgress(userId, progressData) {
    try {
      const { lives, power_up_count, unlocked_badge_data, unlocked_monster_data } = progressData;
      
      return await prisma.game_data.update({
        where: { user_id: userId },
        data: {
          lives,
          power_up_count,
          unlocked_badge_data,
          unlocked_monster_data,
        }
      });
    } catch (error) {
      logger.error('Update Game Progress Error:', error);
      throw new Error('Failed to update game progress');
    }
  }

  async updateLevel(userId, levelNumber, levelData) {
    try {
      return await prisma.level_data.upsert({
        where: {
          user_id_number: {
            user_id: userId,
            number: levelNumber
          }
        },
        update: levelData,
        create: {
          ...levelData,
          user_id: userId,
          number: levelNumber
        }
      });
    } catch (error) {
      logger.error('Update Level Error:', error);
      throw new Error('Failed to update level data');
    }
  }

  async updatePowerUps(userId, powerUpType, count) {
    try {
      const gameData = await prisma.game_data.findFirst({
        where: { user_id: userId }
      });

      const power_up_count = {
        ...gameData.power_up_count,
        [powerUpType]: (gameData.power_up_count[powerUpType] || 0) + count
      };

      return await prisma.game_data.update({
        where: { user_id: userId },
        data: { power_up_count }
      });
    } catch (error) {
      logger.error('Update Power Ups Error:', error);
      throw new Error('Failed to update power ups');
    }
  }

  async unlockContent(userId, contentType, contentId) {
    try {
      const gameData = await prisma.game_data.findFirst({
        where: { user_id: userId }
      });

      let updateField;
      let currentData;

      if (contentType === 'badge') {
        updateField = 'unlocked_badge_data';
        currentData = gameData.unlocked_badge_data;
      } else if (contentType === 'monster') {
        updateField = 'unlocked_monster_data';
        currentData = gameData.unlocked_monster_data;
      } else {
        throw new Error('Invalid content type');
      }

      if (!currentData.includes(contentId)) {
        currentData.push(contentId);
      }

      return await prisma.game_data.update({
        where: { user_id: userId },
        data: { [updateField]: currentData }
      });
    } catch (error) {
      logger.error('Unlock Content Error:', error);
      throw new Error('Failed to unlock content');
    }
  }
}

module.exports = new GameService();