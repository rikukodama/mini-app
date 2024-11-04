const prisma = require('../config/database');

class GameModel {
  static async getGameData(userId) {
    return prisma.game_data.findUnique({
      where: { user_id: userId },
      include: {
        level_data: true
      }
    });
  }

  static async createGameData(userId) {
    return prisma.game_data.create({
      data: {
        user_id: userId,
        lives: 3,
        power_up_count: {
          addMoreMoves: 0,
          universal: 0,
          powerUpRing: 0
        },
        unlocked_badge_data: [],
        unlocked_monster_data: [],
        level_data: {
          create: {
            number: 1,
            user_id: userId
          }
        }
      }
    });
  }

  static async updateGameData(userId, data) {
    return prisma.game_data.update({
      where: { user_id: userId },
      data
    });
  }

  static async getLevelData(userId, levelNumber) {
    return prisma.level_data.findUnique({
      where: {
        user_id_number: {
          user_id: userId,
          number: levelNumber
        }
      }
    });
  }

  static async createOrUpdateLevelData(userId, levelNumber, data) {
    return prisma.level_data.upsert({
      where: {
        user_id_number: {
          user_id: userId,
          number: levelNumber
        }
      },
      update: data,
      create: {
        ...data,
        user_id: userId,
        number: levelNumber
      }
    });
  }
}

module.exports = GameModel;