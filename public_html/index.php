<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>💦 ПОШЛЫЙ КВИЗ ДЛЯ ДВОИХ 💦</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💋 ПОШЛЯТИНА <span>18+</span></h1>
        </div>
        
        <!-- Экран входа -->
        <div id="login-screen" class="screen">
            <div class="card">
                <h2>🔞 Вход в игру</h2>
                <input type="text" id="player-name" placeholder="Твое имя" value="Игрок">
                
                <div class="room-actions">
                    <input type="text" id="room-id" placeholder="Название комнаты" value="poshly">
                    <button onclick="createRoom()" class="btn-primary">✨ Создать</button>
                    <button onclick="joinRoom()" class="btn-secondary">🚪 Присоединиться</button>
                </div>
            </div>
        </div>
        
        <!-- Экран ожидания -->
        <div id="waiting-screen" class="screen hidden">
            <div class="card">
                <h2 id="room-name">Комната: <span></span></h2>
                
                <div class="players-box">
                    <div class="player" id="player1">
                        <div class="player-name">...</div>
                        <div class="player-status">ожидание</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="player" id="player2">
                        <div class="player-name">...</div>
                        <div class="player-status">ожидание</div>
                    </div>
                </div>
                
                <div id="invite-block">
                    <p class="invite-text">👇 Отправь ссылку другу:</p>
                    <div class="link-box">
                        <input type="text" id="room-link" readonly>
                        <button onclick="copyLink()" class="btn-copy">📋</button>
                    </div>
                </div>
                
                <div id="waiting-message" class="waiting-message">Ожидание второго игрока...</div>
                
                <button onclick="leaveRoom()" class="btn-secondary">← Назад</button>
            </div>
        </div>
        
        <!-- Экран игры -->
        <div id="game-screen" class="screen hidden">
            <div class="card">
                <div class="game-header">
                    <div class="game-player" id="game-player1">
                        <span class="player-name">...</span>
                        <span class="player-turn" id="turn1">ждет</span>
                    </div>
                    <div class="game-vs">🍑</div>
                    <div class="game-player" id="game-player2">
                        <span class="player-name">...</span>
                        <span class="player-turn" id="turn2">ждет</span>
                    </div>
                </div>
                
                <div class="question-counter" id="question-counter">Вопрос 1/10</div>
                
                <div id="question-block" class="question-block hidden">
                    <div class="question-text" id="question-text"></div>
                    <textarea id="answer-input" placeholder="Твой ответ..." rows="3"></textarea>
                    <button onclick="submitAnswer()" class="btn-primary">💬 Ответить</button>
                </div>
                
                <div id="waiting-block" class="waiting-block">
                    <div class="spinner">⏳</div>
                    <div id="wait-message">Ожидание...</div>
                </div>
                
                <div id="answer-block" class="answer-block hidden">
                    <div class="answer-question" id="answer-question"></div>
                    <div class="answer-text" id="answer-text"></div>
                    <div class="answer-from" id="answer-from"></div>
                </div>
                
                <button onclick="leaveGame()" class="btn-secondary">🚪 Выйти</button>
            </div>
        </div>
    </div>
    
    <script src="/socket.io/socket.io.js"></script>
    <script src="script.js"></script>
</body>
</html>