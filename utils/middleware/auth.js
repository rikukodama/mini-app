const jwt = require('jsonwebtoken');
const { Response } = require('../response');
const logger = require('../logger');

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json(new Response().error('No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Auth Middleware Error:', error);
    return res.status(401).json(new Response().error('Invalid token'));
  }
};

const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    logger.error('Socket Auth Error:', error);
    next(new Error('Invalid token'));
  }
};

module.exports = {
  authenticate,
  socketAuth
};