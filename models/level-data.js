const prisma = require('../config/database');

class LevelDataModel {
  static async getCurrentLevel(userId) {
    return prisma.level_data.findFirst({
      where: { user_id: userId },
      orderBy: { number: 'desc' }
    });
  }

  static async getAllLevels(userId) {
    return prisma.level_data.findMany({
      where: { user_id: userId },
      orderBy: { number: 'asc' }
    });
  }

  static async createLevel(data) {
    return prisma.level_data.create({
      data
    });
  }

  static async updateLevel(userId, levelNumber, data) {
    return prisma.level_data.update({
      where: {
        user_id_number: {
          user_id: userId,
          number: levelNumber
        }
      },
      data
    });
  }

  static async deleteLevelData(userId, levelNumber) {
    return prisma.level_data.delete({
      where: {
        user_id_number: {
          user_id: userId,
          number: levelNumber
        }
      }
    });
  }
}

module.exports = LevelDataModel;