const socket = io();

// Состояние
let currentPlayer = {
    id: null,
    name: '',
    roomId: null
};

let gameState = null;

// DOM элементы
const loginScreen = document.getElementById('login-screen');
const waitingScreen = document.getElementById('waiting-screen');
const gameScreen = document.getElementById('game-screen');

// Создать комнату
function createRoom() {
    const playerName = document.getElementById('player-name').value.trim() || 'Игрок';
    const roomId = document.getElementById('room-id').value.trim() || 'room-' + Date.now();
    
    currentPlayer.name = playerName;
    currentPlayer.roomId = roomId;
    
    socket.emit('createRoom', { roomId, playerName });
}

// Присоединиться к комнате
function joinRoom() {
    const playerName = document.getElementById('player-name').value.trim() || 'Игрок';
    const roomId = document.getElementById('room-id').value.trim();
    
    if (!roomId) {
        alert('Введите название комнаты');
        return;
    }
    
    currentPlayer.name = playerName;
    currentPlayer.roomId = roomId;
    
    socket.emit('joinRoom', { roomId, playerName });
}

// Комната создана
socket.on('roomCreated', (data) => {
    document.getElementById('room-name').querySelector('span').textContent = data.roomId;
    document.getElementById('player1').querySelector('.player-name').textContent = data.playerName;
    
    const link = window.location.origin + '?room=' + data.roomId;
    document.getElementById('room-link').value = link;
    
    loginScreen.classList.add('hidden');
    waitingScreen.classList.remove('hidden');
});

// Игрок присоединился
socket.on('playerJoined', (data) => {
    const players = data.players;
    
    if (players[0]) {
        document.getElementById('player1').querySelector('.player-name').textContent = players[0].name;
    }
    if (players[1]) {
        document.getElementById('player2').querySelector('.player-name').textContent = players[1].name;
        document.getElementById('player2').querySelector('.player-status').textContent = 'готов';
        document.getElementById('waiting-message').textContent = 'Друг присоединился! Игра начинается...';
        
        // Начинаем игру через 2 секунды
        setTimeout(() => {
            const questions = shuffleQuestions(QUESTIONS).slice(0, 10);
            socket.emit('startGame', { 
                roomId: currentPlayer.roomId, 
                questions: questions 
            });
        }, 2000);
    }
});

// Игра началась
socket.on('gameStarted', (data) => {
    gameState = {
        players: data.players,
        questions: data.questions,
        currentQuestion: 0,
        answers: {}
    };
    
    document.getElementById('game-player1').querySelector('.player-name').textContent = data.players[0].name;
    document.getElementById('game-player2').querySelector('.player-name').textContent = data.players[1].name;
    
    waitingScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    updateTurn();
});

// Обновление хода
function updateTurn() {
    const currentTurn = gameState.players[gameState.currentQuestion % 2].id;
    const isMyTurn = currentTurn === socket.id;
    
    if (isMyTurn) {
        document.getElementById('question-block').classList.remove('hidden');
        document.getElementById('waiting-block').classList.add('hidden');
        document.getElementById('answer-block').classList.add('hidden');
        
        document.getElementById('question-text').textContent = gameState.questions[gameState.currentQuestion];
        document.getElementById('question-counter').textContent = 
            `Вопрос ${gameState.currentQuestion + 1}/${gameState.questions.length}`;
    } else {
        document.getElementById('question-block').classList.add('hidden');
        document.getElementById('waiting-block').classList.remove('hidden');
        document.getElementById('answer-block').classList.add('hidden');
        document.getElementById('wait-message').textContent = 'Ожидание ответа партнера...';
    }
    
    // Обновляем статусы
    document.getElementById('turn1').textContent = 
        gameState.players[0].id === currentTurn ? 'отвечает' : 'ждет';
    document.getElementById('turn2').textContent = 
        gameState.players[1].id === currentTurn ? 'отвечает' : 'ждет';
}

// Отправить ответ
function submitAnswer() {
    const answer = document.getElementById('answer-input').value.trim();
    if (!answer) {
        alert('Напиши ответ!');
        return;
    }
    
    socket.emit('submitAnswer', {
        roomId: currentPlayer.roomId,
        answer: answer,
        questionIndex: gameState.currentQuestion
    });
    
    document.getElementById('question-block').classList.add('hidden');
    document.getElementById('waiting-block').classList.remove('hidden');
    document.getElementById('wait-message').textContent = 'Ждем ответ партнера...';
}

// Оба ответили
socket.on('bothAnswered', (data) => {
    const answers = data.answers;
    const players = data.players;
    
    let showCount = 0;
    
    function showNext() {
        if (showCount === 0) {
            document.getElementById('answer-question').textContent = 
                gameState.questions[data.questionIndex];
            document.getElementById('answer-text').textContent = 
                answers[players[0].id];
            document.getElementById('answer-from').textContent = 
                `— ${players[0].name}`;
            showCount++;
            setTimeout(showNext, 4000);
        } else if (showCount === 1) {
            document.getElementById('answer-text').textContent = 
                answers[players[1].id];
            document.getElementById('answer-from').textContent = 
                `— ${players[1].name}`;
            showCount++;
            setTimeout(showNext, 4000);
        } else {
            document.getElementById('answer-block').classList.add('hidden');
            document.getElementById('waiting-block').classList.remove('hidden');
            document.getElementById('wait-message').textContent = 'Следующий вопрос...';
        }
    }
    
    document.getElementById('waiting-block').classList.add('hidden');
    document.getElementById('answer-block').classList.remove('hidden');
    
    showNext();
});

// Следующий вопрос
socket.on('nextQuestion', (data) => {
    gameState.currentQuestion = data.questionIndex;
    gameState.currentTurn = data.currentTurn;
    updateTurn();
});

// Игра окончена
socket.on('gameOver', () => {
    document.getElementById('answer-block').classList.add('hidden');
    document.getElementById('waiting-block').classList.remove('hidden');
    document.getElementById('wait-message').innerHTML = `
        🎉 ИГРА ОКОНЧЕНА! 🎉<br><br>
        Спасибо за откровенность!
    `;
});

// Игрок отключился
socket.on('playerLeft', (data) => {
    alert('Партнер покинул игру');
    leaveRoom();
});

// Ошибка
socket.on('error', (msg) => {
    alert(msg);
});

// Выйти из комнаты
function leaveRoom() {
    window.location.reload();
}

function leaveGame() {
    leaveRoom();
}

// Копировать ссылку
function copyLink() {
    const link = document.getElementById('room-link');
    link.select();
    navigator.clipboard.writeText(link.value).then(() => {
        alert('Ссылка скопирована!');
    });
}

// Перемешать вопросы
function shuffleQuestions(questions) {
    return [...questions].sort(() => Math.random() - 0.5);
}

// Вопросы (первые 20, добавьте все 100)
const QUESTIONS = [
    "Что в моей внешности тебя зацепило в самую первую очередь?",
    "Какая часть моего тела кажется тебе самой сексуальной?",
    "Какой твой любимый предмет моего гардероба?",
    "О чем ты подумал, когда впервые увидел меня раздетым?",
    "Какой запах от тебя меня заводит?",
    "Где тебе нравится целовать меня больше всего?",
    "Какой вид поцелуя ты предпочитаешь?",
    "Что для тебя важнее: прелюдия или быстрый секс?",
    "Какое мое прикосновение сводит тебя с ума?",
    "Тебе нравится, когда я кусаю тебя?",
    "В какой момент ты понимаешь, что готова/готов?",
    "Что тебя заводит больше: шепот или прямые указания?",
    "Назови нашу любимую позу",
    "Какая поза для тебя самая удобная?",
    "В какой позе ты быстрее устаешь?",
    "Какая поза самая интимная для тебя?",
    "Какую позу мы еще не пробовали, но ты хочешь?",
    "Любишь быть сверху или снизу?",
    "Какая твоя главная эротическая фантазия?",
    "Фантазируешь обо мне, когда меня нет?"
];

// Инициализация
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    
    if (roomFromUrl) {
        document.getElementById('room-id').value = roomFromUrl;
    }
};