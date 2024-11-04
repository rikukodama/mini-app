const io = require('socket.io-client');
const logger = require('../utils/logger');

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
  }

  async connect() {
    if (this.socket) {
      return this.socket;
    }

    return new Promise((resolve, reject) => {
      try {
        const host = process.env.SOCKET_HOST;
        if (!host) {
          throw new Error('Socket host is required');
        }

        this.socket = io(host, {
          transports: ['websocket'],
          upgrade: false,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay
        });

        this.setupEventHandlers(resolve, reject);
      } catch (error) {
        logger.error('Socket Connection Error:', error);
        reject(error);
      }
    });
  }

  setupEventHandlers(resolve, reject) {
    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      logger.info('Socket connected successfully');
      resolve(this.socket);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      logger.warn('Socket disconnected');
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Socket Connection Error:', error);
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        reject(error);
      }
    });

    this.setupGameEvents();
    this.setupOrderEvents();
    this.setupSystemEvents();
  }

  setupGameEvents() {
    this.socket.on('game:progress:update', (data) => {
      logger.debug('Game Progress Update:', data);
    });

    this.socket.on('achievement:unlocked', (data) => {
      logger.debug('Achievement Unlocked:', data);
    });
  }

  setupOrderEvents() {
    this.socket.on('order:status', (data) => {
      logger.debug('Order Status Update:', data);
    });

    this.socket.on('payment:confirmed', (data) => {
      logger.debug('Payment Confirmed:', data);
    });
  }

  setupSystemEvents() {
    this.socket.on('system:maintenance', (data) => {
      logger.warn('System Maintenance:', data);
    });

    this.socket.on('system:error', (error) => {
      logger.error('System Error:', error);
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        logger.info(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect().catch((error) => {
          logger.error('Reconnection attempt failed:', error);
        });
      }, this.reconnectDelay);
    } else {
      logger.error('Max reconnection attempts reached');
    }
  }

  // Public methods for emitting events
  emitGameProgress(data) {
    if (!this.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('game:progress', data);
  }

  emitAchievement(data) {
    if (!this.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('game:achievement', data);
  }

  emitOrderUpdate(data) {
    if (!this.connected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('order:update', data);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

module.exports = new SocketService();