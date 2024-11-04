const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");
const { socketAuth } = require('./utils/middleware/auth');
const logger = require('./utils/logger');

class SocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGINS.split(','),
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupRedis();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  async setupRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.pubClient = new Redis(process.env.REDIS_URL);
        this.subClient = this.pubClient.duplicate();

        this.pubClient.on('error', (err) => logger.error('Redis Pub Error:', err));
        this.subClient.on('error', (err) => logger.error('Redis Sub Error:', err));

        await Promise.all([
          this.pubClient.connect(),
          this.subClient.connect()
        ]);

        this.io.adapter(createAdapter(this.pubClient, this.subClient));
        logger.info('Redis adapter configured for Socket.IO');
      }
    } catch (error) {
      logger.error('Redis Setup Error:', error);
    }
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(socketAuth);

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const clientId = socket.handshake.auth.userId || socket.handshake.address;
      const currentCount = this.connectionCounter.get(clientId) || 0;
      
      if (currentCount > 50) { // Max 50 connections per minute
        next(new Error('Rate limit exceeded'));
        return;
      }
      
      this.connectionCounter.set(clientId, currentCount + 1);
      next();
    });
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => this.handleConnection(socket));
  }

  handleConnection(socket) {
    const userId = socket.user.id;
    logger.info(`User connected: ${userId}`);

    // Join user to their private room
    socket.join(`user:${userId}`);

    // Handle events
    socket.on("game:progress", (data) => this.handleGameProgress(socket, data));
    socket.on("game:achievement", (data) => this.handleAchievement(socket, data));
    socket.on("order:update", (data) => this.handleOrderUpdate(socket, data));
    socket.on("error", (error) => this.handleError(socket, error));
    socket.on("disconnect", () => this.handleDisconnect(socket));
  }

  handleGameProgress(socket, data) {
    try {
      const userId = socket.user.id;
      this.io.to(`user:${userId}`).emit("game:progress:update", data);
      logger.debug('Game Progress Update:', { userId, data });
    } catch (error) {
      logger.error('Game Progress Handler Error:', error);
      socket.emit("error", { message: "Failed to update game progress" });
    }
  }

  handleAchievement(socket, data) {
    try {
      const userId = socket.user.id;
      this.io.to(`user:${userId}`).emit("achievement:unlocked", data);
      logger.debug('Achievement Unlocked:', { userId, achievement: data });
    } catch (error) {
      logger.error('Achievement Handler Error:', error);
      socket.emit("error", { message: "Failed to process achievement" });
    }
  }

  handleOrderUpdate(socket, data) {
    try {
      const userId = socket.user.id;
      this.io.to(`user:${userId}`).emit("order:status", data);
      logger.debug('Order Update:', { userId, orderId: data.orderId });
    } catch (error) {
      logger.error('Order Update Handler Error:', error);
      socket.emit("error", { message: "Failed to update order status" });
    }
  }

  handleError(socket, error) {
    logger.error('Socket Error:', { userId: socket.user.id, error });
    socket.emit("error", { message: "An error occurred" });
  }

  handleDisconnect(socket) {
    const userId = socket.user.id;
    logger.info(`User disconnected: ${userId}`);
    socket.leave(`user:${userId}`);
  }

  // Public methods
  emitToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  broadcastEvent(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = SocketServer;