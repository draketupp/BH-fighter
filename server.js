socket.on('startGame', (roomId) => {
  if (rooms[roomId] && Object.keys(rooms[roomId].players).length === 2) {
    io.to(roomId).emit('gameStart');
  }
});
