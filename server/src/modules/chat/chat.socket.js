const { Server } = require('socket.io');
const { verifyAccessToken } = require('../../services/tokenService');
const { findById } = require('../../models/userModel');
const svc = require('./chat.service');
const logger = require('../../utils/logger');

// Store online users: userId -> socket.id
const onlineUsers = new Map();

function initChatSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*', // Automatically aligns with gateway CORS
      methods: ['GET', 'POST']
    }
  });

  const chatNamespace = io.of('/chat');

  // Authentication middleware for Socket.IO connection
  chatNamespace.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Access denied: Authentication token required'));
    }

    try {
      const decoded = verifyAccessToken(token);
      const user = await findById(decoded.userId);

      if (!user) {
        return next(new Error('Access denied: User not found'));
      }

      if (user.status !== 'Active') {
        return next(new Error('Access denied: Account is suspended'));
      }

      // RBAC Enforce: Only Admins and Super Admins
      if (user.role_name !== 'Super Admin' && user.role_name !== 'Admin' && user.role_name !== 'Tenant Admin') {
        return next(new Error('Access denied: Unauthorized role for internal chat'));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.error('Socket authentication failed', { message: err.message });
      next(new Error('Authentication failed'));
    }
  });

  chatNamespace.on('connection', (socket) => {
    const userId = socket.user.id;
    onlineUsers.set(userId, socket.id);

    logger.info(`User connected to chat: ${socket.user.name} (${socket.user.role_name})`);

    // Join personal room for targeted messaging
    socket.join(`user:${userId}`);

    // Notify others that user is online
    socket.broadcast.emit('user-online', { userId });

    // Handle join conversation room
    socket.on('join-chat', ({ conversationId }) => {
      socket.join(`conv:${conversationId}`);
      logger.debug(`User ${userId} joined conversation: ${conversationId}`);
    });

    // Handle sending message
    socket.on('send-message', async (data, callback) => {
      const { conversationId, receiverId, message, messageType, attachmentUrl } = data;
      
      try {
        // Enforce RBAC Rules on message sender & receiver roles
        const receiver = await findById(receiverId);
        if (!receiver) {
          if (callback) callback({ success: false, error: 'Receiver not found' });
          return;
        }

        const senderRole = socket.user.role_name;
        const receiverRole = receiver.role_name;

        // Chat Rules verification
        // - Admin -> Super Admin (Allowed)
        // - Super Admin -> Admin (Allowed)
        // - Admin -> Admin (Blocked)
        const isAllowed = 
          (senderRole === 'Admin' && receiverRole === 'Super Admin') ||
          (senderRole === 'Super Admin' && receiverRole === 'Admin');

        if (!isAllowed) {
          if (callback) callback({ success: false, error: 'Forbidden: Chat rules violation' });
          return;
        }

        // Save to PostgreSQL DB
        const savedMsg = await svc.saveMessage(
          conversationId,
          userId,
          receiverId,
          message,
          messageType || 'text',
          attachmentUrl || null
        );

        // Deliver to receiver's personal room only
        chatNamespace.to(`user:${receiverId}`).emit('receive-message', savedMsg);

        // Return saved message to sender via callback (sender adds it locally)
        if (callback) callback({ success: true, message: savedMsg });
      } catch (err) {
        logger.error('Error handling send-message socket event', { message: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Typing Indicators
    socket.on('typing-start', ({ conversationId, receiverId }) => {
      chatNamespace.to(`user:${receiverId}`).emit('typing', {
        conversationId,
        senderId: userId,
        isTyping: true
      });
    });

    socket.on('typing-stop', ({ conversationId, receiverId }) => {
      chatNamespace.to(`user:${receiverId}`).emit('typing', {
        conversationId,
        senderId: userId,
        isTyping: false
      });
    });

    // Read Receipts
    socket.on('mark-read', async ({ conversationId, senderId }) => {
      try {
        await svc.markMessagesAsRead(conversationId, userId);
        chatNamespace.to(`user:${senderId}`).emit('message-read', {
          conversationId,
          readerId: userId
        });
      } catch (err) {
        logger.error('Error handling mark-read socket event', { message: err.message });
      }
    });

    // Query online status list
    socket.on('get-online-users', (callback) => {
      if (callback) {
        callback(Array.from(onlineUsers.keys()));
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      logger.info(`User disconnected from chat: ${socket.user.name}`);
      socket.broadcast.emit('user-offline', { userId });
    });
  });

  return io;
}

module.exports = { initChatSocket, onlineUsers };
