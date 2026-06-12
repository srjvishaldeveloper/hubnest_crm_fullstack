const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const { verifyAccessToken } = require('../../services/tokenService');
const { findById } = require('../../models/userModel');
const svc = require('./orgChat.service');
const logger = require('../../utils/logger');

const onlineUsers = new Map(); // userId -> socket.id

function initOrgChatSocket(server) {
  const io = new Server(server, {
    path: '/org-socket.io',
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  const chat = io.of('/org-chat');

  chat.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyAccessToken(token);
      const user = await findById(decoded.userId);
      if (!user) return next(new Error('User not found'));
      if (user.status !== 'Active') return next(new Error('Account is suspended'));
      socket.user = user;
      next();
    } catch (err) {
      logger.error('OrgChat Socket auth failed', { message: err.message });
      next(new Error('Authentication failed'));
    }
  });

  chat.on('connection', (socket) => {
    const { id: userId, tenant_id: tenantId, department_id: departmentId, role_name: roleName } = socket.user;
    const isAdmin = roleName === 'Tenant Admin' || roleName === 'Admin';

    onlineUsers.set(userId, socket.id);
    logger.info(`OrgChat connected: ${socket.user.name} (${roleName})`);

    socket.join(`user:${userId}`);
    socket.join(`org:${tenantId}`);
    if (departmentId) socket.join(`dept:${departmentId}`);

    socket.to(`org:${tenantId}`).emit('user-online', { userId });

    // Send current online users list to the newly connected user
    socket.emit('online-users', { userIds: Array.from(onlineUsers.keys()) });

    socket.on('join-room', ({ conversationId }) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave-room', ({ conversationId }) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('send-message', async (data, callback) => {
      const { conversationId, message, type = 'text', attachmentUrl } = data;
      try {
        const savedMsg = await svc.saveMessage(conversationId, userId, message, type, attachmentUrl);
        savedMsg.sender_name = socket.user.name;
        savedMsg.sender_photo = socket.user.photo_url;
        savedMsg.reactions = [];

        chat.to(`conv:${conversationId}`).emit('receive-message', savedMsg);
        if (callback) callback({ success: true, message: savedMsg });
      } catch (err) {
        logger.error('Error sending org message', { error: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('edit-message', async ({ messageId, conversationId, message }, callback) => {
      try {
        const updated = await svc.editMessage(messageId, userId, message);
        if (!updated) {
          if (callback) callback({ success: false, error: 'Cannot edit this message' });
          return;
        }
        chat.to(`conv:${conversationId}`).emit('message-edited', {
          messageId,
          conversationId,
          message,
          is_edited: true
        });
        if (callback) callback({ success: true });
      } catch (err) {
        logger.error('Error editing org message', { error: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('delete-message', async ({ messageId, conversationId }, callback) => {
      try {
        const deleted = await svc.deleteMessage(messageId, userId, isAdmin);
        if (!deleted) {
          if (callback) callback({ success: false, error: 'Cannot delete this message' });
          return;
        }
        chat.to(`conv:${conversationId}`).emit('message-deleted', { messageId, conversationId });
        if (callback) callback({ success: true });
      } catch (err) {
        logger.error('Error deleting org message', { error: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('pin-message', async ({ messageId, conversationId }, callback) => {
      try {
        await svc.pinMessage(conversationId, messageId, userId);
        chat.to(`conv:${conversationId}`).emit('message-pinned', { messageId, conversationId, pinnedBy: socket.user.name });
        if (callback) callback({ success: true });
      } catch (err) {
        logger.error('Error pinning org message', { error: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('unpin-message', async ({ messageId, conversationId }, callback) => {
      try {
        await svc.unpinMessage(conversationId, messageId);
        chat.to(`conv:${conversationId}`).emit('message-unpinned', { messageId, conversationId });
        if (callback) callback({ success: true });
      } catch (err) {
        logger.error('Error unpinning org message', { error: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('typing-start', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing', {
        conversationId, senderId: userId, senderName: socket.user.name, isTyping: true
      });
    });

    socket.on('typing-stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing', {
        conversationId, senderId: userId, senderName: socket.user.name, isTyping: false
      });
    });

    socket.on('mark-read', async ({ conversationId }) => {
      try {
        await svc.markMessagesAsRead(conversationId, userId);
        socket.to(`conv:${conversationId}`).emit('message-read', { conversationId, readerId: userId });
      } catch (err) {
        logger.error('Error marking messages read', { error: err.message });
      }
    });

    socket.on('send-reaction', async ({ messageId, conversationId, reaction }) => {
      try {
        const action = await svc.addReaction(messageId, userId, reaction);
        chat.to(`conv:${conversationId}`).emit('message-reaction', { messageId, userId, reaction, action });
      } catch (err) {
        logger.error('Error sending reaction', { error: err.message });
      }
    });

    socket.on('admin-broadcast', async ({ target, targetId, targetLabel, message }, callback) => {
      if (!isAdmin) {
        if (callback) callback({ success: false, error: 'Unauthorized' });
        return;
      }

      try {
        const saved = await svc.saveAnnouncement(tenantId, userId, message, target || 'all', targetId, targetLabel);

        const broadcastMsg = {
          ...saved,
          sender_name: socket.user.name,
          sender_photo: socket.user.photo_url,
          type: 'announcement',
        };

        if (target === 'department' && targetId) {
          chat.to(`dept:${targetId}`).emit('announcement-created', broadcastMsg);
        } else {
          chat.to(`org:${tenantId}`).emit('announcement-created', broadcastMsg);
        }

        if (callback) callback({ success: true, announcement: broadcastMsg });
      } catch (err) {
        logger.error('Error saving broadcast', { error: err.message });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('get-online-users', (callback) => {
      if (callback) callback({ userIds: Array.from(onlineUsers.keys()) });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.to(`org:${tenantId}`).emit('user-offline', { userId });
      logger.info(`OrgChat disconnected: ${socket.user.name}`);
    });
  });

  return io;
}

module.exports = { initOrgChatSocket, onlineUsers };
