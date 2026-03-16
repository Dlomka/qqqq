const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

// Хранилище комнат
const rooms = {};

io.on('connection', (socket) => {
    console.log('Новый игрок:', socket.id);

    // Создать комнату
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
        console.log(`Комната ${roomId} создана игроком ${playerName}`);
    });

    // Присоединиться к комнате
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
        
        // Уведомляем всех в комнате
        io.to(roomId).emit('playerJoined', {
            players: rooms[roomId].players
        });
        
        console.log(`${playerName} присоединился к комнате ${roomId}`);
    });

    // Начать игру
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

    // Отправить ответ
    socket.on('submitAnswer', (data) => {
        const { roomId, answer, questionIndex } = data;
        
        if (!rooms[roomId] || !rooms[roomId].game) return;
        
        const game = rooms[roomId].game;
        
        if (!game.answers[questionIndex]) {
            game.answers[questionIndex] = {};
        }
        
        game.answers[questionIndex][socket.id] = answer;
        
        // Проверяем, ответили ли оба
        const players = rooms[roomId].players.map(p => p.id);
        const bothAnswered = players.every(p => game.answers[questionIndex] && game.answers[questionIndex][p]);
        
        if (bothAnswered) {
            // Отправляем ответы обоим
            io.to(roomId).emit('bothAnswered', {
                questionIndex: questionIndex,
                answers: game.answers[questionIndex],
                players: rooms[roomId].players
            });
            
            // Переходим к следующему вопросу
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
            // Ждем второго игрока
            io.to(roomId).emit('waitingForPartner', {
                from: socket.id
            });
        }
    });

    // Отключение
    socket.on('disconnect', () => {
        console.log('Игрок отключился:', socket.id);
        
        // Удаляем игрока из комнат
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});