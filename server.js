const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

io.on('connection', (socket) => {
    console.log('Новый игрок:', socket.id);

    socket.on('createRoom', (data) => {
        const { roomId, playerName } = data;
        socket.join(roomId);
        rooms[roomId] = {
            id: roomId,
            players: [{
                id: socket.id,
                name: playerName,
                ready: false
            }],
            game: null
        };
        socket.emit('roomCreated', { roomId, playerName });
    });

    socket.on('joinRoom', (data) => {
        const { roomId, playerName } = data;
        if (!rooms[roomId]) {
            socket.emit('error', 'Комната не найдена');
            return;
        }
        if (rooms[roomId].players.length >= 2) {
            socket.emit('error', 'Комната уже заполнена');
            return;
        }
        socket.join(roomId);
        rooms[roomId].players.push({
            id: socket.id,
            name: playerName,
            ready: false
        });
        io.to(roomId).emit('playerJoined', {
            players: rooms[roomId].players
        });
    });

    socket.on('startGame', (data) => {
        const { roomId, questions } = data;
        if (!rooms[roomId]) return;
        rooms[roomId].game = {
            questions: questions,
            currentQuestion: 0,
            currentTurn: rooms[roomId].players[0].id,
            answers: {},
            players: rooms[roomId].players.map(p => p.id)
        };
        io.to(roomId).emit('gameStarted', {
            players: rooms[roomId].players,
            questions: questions
        });
    });

    socket.on('submitAnswer', (data) => {
        const { roomId, answer, questionIndex } = data;
        if (!rooms[roomId] || !rooms[roomId].game) return;
        const game = rooms[roomId].game;
        if (!game.answers[questionIndex]) {
            game.answers[questionIndex] = {};
        }
        game.answers[questionIndex][socket.id] = answer;
        const players = rooms[roomId].players.map(p => p.id);
        const bothAnswered = players.every(p => game.answers[questionIndex] && game.answers[questionIndex][p]);
        if (bothAnswered) {
            io.to(roomId).emit('bothAnswered', {
                questionIndex: questionIndex,
                answers: game.answers[questionIndex],
                players: rooms[roomId].players
            });
            setTimeout(() => {
                game.currentQuestion++;
                if (game.currentQuestion < game.questions.length) {
                    io.to(roomId).emit('nextQuestion', {
                        questionIndex: game.currentQuestion,
                        question: game.questions[game.currentQuestion],
                        currentTurn: game.players[game.currentQuestion % 2]
                    });
                } else {
                    io.to(roomId).emit('gameOver');
                }
            }, 5000);
        } else {
            io.to(roomId).emit('waitingForPartner', {
                from: socket.id
            });
        }
    });

    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    delete rooms[roomId];
                } else {
                    io.to(roomId).emit('playerLeft', {
                        players: room.players
                    });
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
