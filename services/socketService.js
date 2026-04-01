const {
  getSocketServer,
  getConnectedSocketIdsByUser,
} = require("../config/socket");

function sendToUser(userId, event, data) {
  const io = getSocketServer();
  if (!io || !userId || !event) {
    return 0;
  }

  const socketIds = getConnectedSocketIdsByUser(userId);
  for (const socketId of socketIds) {
    io.to(socketId).emit(event, data);
  }

  return socketIds.length;
}

module.exports = {
  sendToUser,
};
