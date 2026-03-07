const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = {};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('joinGame', ({ roomId, name }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: {}
      };
    }

    const room = rooms[roomId];

    if (Object.keys(room.players).length >= 2) {
      socket.emit('roomFull');
      return;
    }

    socket.join(roomId);

    room.players[socket.id] = {
      id: socket.id,
      name: name || `Player ${Object.keys(room.players).length + 1}`,
      x: socket.id === Object.keys(room.players)[0] ? 200 : 800,
      facing: socket.id === Object.keys(room.players)[0] ? 1 : -1,
      hp: 100,
      stamina: 100
    };

    // Send current players to the new player
    socket.emit('currentState', room.players);

    // Notify everyone in the room about the new player
    io.to(roomId).emit('playerJoined', {
      id: socket.id,
      player: room.players[socket.id]
    });
  });

  socket.on('startGame', (roomId) => {
    if (rooms[roomId] && Object.keys(rooms[roomId].players).length === 2) {
      io.to(roomId).emit('gameStart');
    }
  });

  socket.on('playerInput', (data) => {
    const roomId = Array.from(socket.rooms).find(r => r !== socket.id);
    if (!roomId || !rooms[roomId]) return;

    const player = rooms[roomId].players[socket.id];
    if (!player) return;

    if (data.left)  player.x -= 6;
    if (data.right) player.x += 6;
    player.facing = data.facing ?? player.facing;

    io.to(roomId).emit('playerUpdate', {
      id: socket.id,
      x: player.x,
      facing: player.facing
    });
  });

  socket.on('attackHit', (data) => {
    const roomId = Array.from(socket.rooms).find(r => r !== socket.id);
    if (!roomId) return;

    io.to(roomId).emit('applyDamage', data);
  });

  socket.on('leaveRoom', (roomId) => {
    if (rooms[roomId]) {
      delete rooms[roomId].players[socket.id];
      io.to(roomId).emit('playerLeft', socket.id);
      if (Object.keys(rooms[roomId].players).length === 0) {
        delete rooms[roomId];
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      if (rooms[roomId].players[socket.id]) {
        delete rooms[roomId].players[socket.id];
        io.to(roomId).emit('playerLeft', socket.id);
        if (Object.keys(rooms[roomId].players).length === 0) {
          delete rooms[roomId];
        }
        break;
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
