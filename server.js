const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();

const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
      origin: "*",
      methods: ["GET", "POST"]
  }
});

let messages = [];
const maxUsers = 15; // Definir un número máximo de usuarios que pueden conectarse simultáneamente
let availableIDs = Array.from({length: maxUsers}, (_, i) => i + 1); // Crear una cola de IDs disponibles
let socketToIDMap = new Map(); // Mapa para relacionar el socket del usuario con su ID

let connectedUsers = 0; // Contador de usuarios conectados

io.on('connection', socket => {
  console.log('Nuevo usuario conectado');
  connectedUsers++; // Incrementar el contador cuando un usuario se conecta
  
  // Emitir la cantidad actual de usuarios conectados
  io.emit('updateUserCount', connectedUsers);

  // Si hay IDs disponibles, asignar uno al usuario
  if (availableIDs.length > 0) {
    const assignedID = availableIDs.shift();
    socketToIDMap.set(socket, assignedID);
    socket.emit('receiveUserNumber', assignedID);
  }

  socket.emit('messages', messages);

  socket.on('sendMessage', message => {
    if (messages.length >= 100) {
      messages.shift();
    }
    messages.push(message);
    io.emit('newMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
    connectedUsers--;
    const releasedID = socketToIDMap.get(socket);
    if (releasedID) {
      availableIDs.push(releasedID);
      socketToIDMap.delete(socket);
    }
    io.emit('updateUserCount', connectedUsers);
  });
});

const port = 3001;

server.listen(port, () => {
  console.log(`Servidor en ejecución en el puerto ${port}`);
});
