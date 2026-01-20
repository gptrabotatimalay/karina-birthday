import FootballMatch from './FootballMatch.jsx';

/**
 * ConsoleOverlay - Интерфейс игровой консоли с мини-играми
 * Стиль: Экран телевизора/портативной консоли с темной рамкой
 */
export default class ConsoleOverlay {
    constructor() {
        this.container = null;
        this.onClose = null;
        this.currentGame = null; // 'menu', 'snake', 'tictactoe', 'pes'
        this.isActive = false;

        // Состояния игр
        this.snakeState = null;
        this.ticTacToeState = null;
        this.pesState = null;
        this.footballMatch = null;

        // Обработчики клавиатуры
        this.keyHandlers = [];

        // Навигация по меню (теперь это индекс игры в карусели)
        this.selectedIndex = 0;

        // Массив игр с обложками
        this.games = [
            { id: 'snake', title: 'SNAKE PARTY', img: 'assets/ui/cover_snake.webp' },
            { id: 'tictactoe', title: 'TIC-TAC-TOE', img: 'assets/ui/cover_tictactoe.webp' },
            { id: 'pes', title: 'PES 2026', img: 'assets/ui/cover_pes.webp' } // ПОДСКАЗКА: финальный счет 5:0
        ];
    }

    /**
     * Открыть консоль
     * @param {Function} onCloseCallback - Колбэк при закрытии
     */
    open(onCloseCallback) {
        if (this.isActive) return;

        this.isActive = true;
        this.onClose = onCloseCallback;
        this.currentGame = 'menu';

        // Скрываем панель чата
        if (window.chatPanel) {
            window.chatPanel.hide();
        }

        this.createContainer();
        this.renderMainMenu();
        this.setupKeyboardListeners();
    }

    /**
     * Закрыть консоль
     */
    close() {
        if (!this.isActive) return;

        this.isActive = false;
        this.removeKeyboardListeners();

        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        // Очистка состояний игр
        this.cleanupCurrentGame();

        // Показываем панель чата
        if (window.chatPanel) {
            window.chatPanel.show();
        }

        if (this.onClose) {
            this.onClose();
        }
    }

    /**
     * Создать основной контейнер консоли
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'console-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000000;
            z-index: 100;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Press Start 2P', cursive;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
        `;

        // Экран консоли (Retro NES style)
        const screen = document.createElement('div');
        screen.id = 'console-screen';
        screen.style.cssText = `
            width: 900px;
            height: 650px;
            background: #1a1c2c;
            border: 6px solid #ffffff;
            border-radius: 0px;
            box-shadow:
                0 0 0 2px #000000,
                0 0 0 8px #ffffff,
                0 8px 0 8px #000000;
            position: relative;
            overflow: hidden;
        `;

        // Внутренняя область для контента
        const content = document.createElement('div');
        content.id = 'console-content';
        content.style.cssText = `
            width: 100%;
            height: 100%;
            padding: 20px;
            overflow: hidden;
            color: #ffffff;
            background: #1a1c2c;
        `;

        screen.appendChild(content);
        this.container.appendChild(screen);
        document.body.appendChild(this.container);
    }

    /**
     * Отрендерить главное меню (КАРУСЕЛЬ С ОБЛОЖКАМИ)
     */
    renderMainMenu() {
        const content = document.getElementById('console-content');
        if (!content) return;

        const currentGame = this.games[this.selectedIndex];

        content.innerHTML = `
            <div style="
                text-align: center;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                padding: 30px 20px;
            ">
                <!-- Заголовок игры -->
                <div style="
                    font-size: 28px;
                    color: #ffff00;
                    letter-spacing: 3px;
                    line-height: 1.4;
                    font-family: 'Press Start 2P', cursive;
                    margin-bottom: 20px;
                    font-weight: normal;
                    -webkit-font-smoothing: none;
                    -moz-osx-font-smoothing: grayscale;
                ">
                    ${currentGame.title}
                </div>

                <!-- Слайдер (Карусель) -->
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 30px;
                    flex: 1;
                ">
                    <!-- Стрелка Влево -->
                    <button id="carousel-prev" style="
                        background: #000000;
                        border: 4px solid #ffffff;
                        color: #ffffff;
                        font-size: 48px;
                        width: 80px;
                        height: 80px;
                        cursor: pointer;
                        font-family: 'Press Start 2P', cursive;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: none;
                    ">
                        &lt;
                    </button>

                    <!-- Обложка игры -->
                    <div style="
                        width: 250px;
                        height: 250px;
                        border: 4px solid #ffffff;
                        background: #000000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                    ">
                        <img
                            src="${currentGame.img}"
                            alt="${currentGame.title}"
                            style="
                                width: 100%;
                                height: 100%;
                                object-fit: cover;
                                image-rendering: pixelated;
                                image-rendering: -moz-crisp-edges;
                                image-rendering: crisp-edges;
                            "
                        />
                    </div>

                    <!-- Стрелка Вправо -->
                    <button id="carousel-next" style="
                        background: #000000;
                        border: 4px solid #ffffff;
                        color: #ffffff;
                        font-size: 48px;
                        width: 80px;
                        height: 80px;
                        cursor: pointer;
                        font-family: 'Press Start 2P', cursive;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: none;
                    ">
                        &gt;
                    </button>
                </div>

                <!-- Кнопка PRESS START -->
                <div style="display: flex; flex-direction: column; gap: 15px; align-items: center;">
                    <button id="carousel-start" style="
                        background: #ffff00;
                        border: 4px solid #ffffff;
                        color: #000000;
                        padding: 20px 60px;
                        font-size: 18px;
                        cursor: pointer;
                        font-family: 'Press Start 2P', cursive;
                        letter-spacing: 2px;
                        transition: none;
                        animation: pulse 1s infinite;
                    ">
                        PRESS START
                    </button>

                    <button id="carousel-exit" style="
                        background: #000000;
                        border: 4px solid #ff0000;
                        color: #ff0000;
                        padding: 15px 40px;
                        font-size: 14px;
                        cursor: pointer;
                        font-family: 'Press Start 2P', cursive;
                        letter-spacing: 2px;
                        transition: none;
                    ">
                        EXIT
                    </button>

                    <div style="
                        margin-top: 10px;
                        color: #9badb7;
                        font-size: 10px;
                        font-family: 'Press Start 2P', cursive;
                        line-height: 1.8;
                    ">
                        A/D SELECT &nbsp;&nbsp; E START
                    </div>
                </div>
            </div>

            <style>
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }

                #carousel-prev:hover,
                #carousel-next:hover {
                    background: #ffffff;
                    color: #000000;
                }

                #carousel-start:hover {
                    background: #ffffff;
                    color: #000000;
                }

                #carousel-exit:hover {
                    background: #ff0000;
                    color: #ffffff;
                }
            </style>
        `;

        // Обработчики для кнопок
        document.getElementById('carousel-prev').addEventListener('click', () => this.prevGame());
        document.getElementById('carousel-next').addEventListener('click', () => this.nextGame());
        document.getElementById('carousel-start').addEventListener('click', () => this.startSelectedGame());
        document.getElementById('carousel-exit').addEventListener('click', () => this.close());
    }

    /**
     * Предыдущая игра в карусели (циклично)
     */
    prevGame() {
        this.selectedIndex = (this.selectedIndex - 1 + this.games.length) % this.games.length;
        this.renderMainMenu();
    }

    /**
     * Следующая игра в карусели (циклично)
     */
    nextGame() {
        this.selectedIndex = (this.selectedIndex + 1) % this.games.length;
        this.renderMainMenu();
    }

    /**
     * Запустить выбранную игру из карусели
     */
    startSelectedGame() {
        const selectedGame = this.games[this.selectedIndex];
        this.startGame(selectedGame.id);
    }

    /**
     * Получить CSS стиль для кнопки
     */
    getButtonStyle(color = '#ffffff') {
        return `
            background: #000000;
            border: 4px solid #ffffff;
            color: ${color};
            padding: 20px 40px;
            font-size: 16px;
            border-radius: 0px;
            cursor: pointer;
            transition: none;
            min-width: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Press Start 2P', cursive;
            font-weight: normal;
            box-shadow: none;
            letter-spacing: 2px;
        `;
    }

    /**
     * Запустить выбранную игру
     */
    startGame(gameName) {
        this.cleanupCurrentGame();
        this.currentGame = gameName;

        switch(gameName) {
            case 'snake':
                this.startSnake();
                break;
            case 'tictactoe':
                this.startTicTacToe();
                break;
            case 'pes':
                this.startPES();
                break;
        }
    }

    /**
     * Очистить текущую игру
     */
    cleanupCurrentGame() {
        if (this.snakeState && this.snakeState.interval) {
            clearInterval(this.snakeState.interval);
        }
        if (this.footballMatch) {
            // Убираем callback перед destroy, чтобы избежать двойного вызова backToMenu
            this.footballMatch.setBackCallback(null);
            this.footballMatch.destroy();
        }
        this.snakeState = null;
        this.ticTacToeState = null;
        this.pesState = null;
        this.footballMatch = null;
    }

    /**
     * Вернуться в главное меню
     */
    backToMenu() {
        this.cleanupCurrentGame();
        this.currentGame = 'menu';
        this.selectedIndex = 0; // Сбрасываем выбор в карусели

        // Восстанавливаем padding для контента
        const content = document.getElementById('console-content');
        if (content) {
            content.style.padding = '20px';
        }

        this.renderMainMenu();
    }

    /**
     * ИГРА: Змейка
     */
    startSnake() {
        const content = document.getElementById('console-content');
        if (!content) return;

        // Инициализация состояния
        // Canvas 450x450, cellSize 25 = gridSize 18
        const gridSize = 18;
        const cellSize = 25;

        this.snakeState = {
            gridSize: gridSize,
            cellSize: cellSize,
            snake: [{x: 9, y: 9}],
            direction: {x: 1, y: 0},
            nextDirection: {x: 1, y: 0},
            food: this.generateFood(gridSize, [{x: 9, y: 9}]),
            score: 0,
            gameOver: false,
            interval: null
        };

        content.innerHTML = `
            <div style="text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 20px; letter-spacing: 2px;">SNAKE GAME</h2>
                <div style="font-size: 14px; margin-bottom: 15px; color: #ffffff; font-family: 'Press Start 2P', cursive;">
                    SCORE: <span id="snake-score">0</span>
                </div>
                <canvas id="snake-canvas" width="450" height="450" style="
                    border: 4px solid #ffffff;
                    background: #0f380f;
                    box-shadow: none;
                    image-rendering: pixelated;
                    image-rendering: -moz-crisp-edges;
                    image-rendering: crisp-edges;
                "></canvas>
                <div style="margin-top: 15px; color: #9badb7; font-size: 10px; font-family: 'Press Start 2P', cursive; line-height: 1.6;">
                    USE WASD OR ARROWS
                </div>
                <button id="snake-back" style="${this.getButtonStyle('#ff0000')}; margin-top: 15px; min-width: 300px; padding: 12px 24px; font-size: 12px;">
                    BACK TO MENU
                </button>
            </div>
        `;

        document.getElementById('snake-back').addEventListener('click', () => this.backToMenu());

        // Запуск игрового цикла
        this.snakeState.interval = setInterval(() => this.updateSnake(), 150);
    }

    /**
     * Генерация еды для змейки
     */
    generateFood(gridSize, snake) {
        let food;
        let attempts = 0;
        const maxAttempts = 1000;

        do {
            food = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize)
            };
            attempts++;

            if (attempts > maxAttempts) {
                console.error('[Snake] Could not generate food after', maxAttempts, 'attempts');
                // В крайнем случае ищем первую свободную клетку
                for (let x = 0; x < gridSize; x++) {
                    for (let y = 0; y < gridSize; y++) {
                        if (!snake.some(segment => segment.x === x && segment.y === y)) {
                            food = { x, y };
                            console.log('[Snake] Food placed at fallback position:', food);
                            return food;
                        }
                    }
                }
                break;
            }
        } while (snake.some(segment => segment.x === food.x && segment.y === food.y));

        console.log('[Snake] Food generated at:', food, 'attempts:', attempts);
        return food;
    }

    /**
     * Обновление змейки
     */
    updateSnake() {
        if (!this.snakeState || this.snakeState.gameOver) return;

        const state = this.snakeState;
        state.direction = state.nextDirection;

        // Новая позиция головы
        const newHead = {
            x: state.snake[0].x + state.direction.x,
            y: state.snake[0].y + state.direction.y
        };

        // Проверка столкновения со стеной
        if (newHead.x < 0 || newHead.x >= state.gridSize ||
            newHead.y < 0 || newHead.y >= state.gridSize) {
            this.gameOverSnake();
            return;
        }

        // Проверка столкновения с собой
        if (state.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
            this.gameOverSnake();
            return;
        }

        // Добавляем новую голову
        state.snake.unshift(newHead);

        // Проверка поедания еды
        if (newHead.x === state.food.x && newHead.y === state.food.y) {
            state.score += 10;
            state.food = this.generateFood(state.gridSize, state.snake);
            document.getElementById('snake-score').textContent = state.score;
        } else {
            // Убираем хвост
            state.snake.pop();
        }

        this.renderSnake();
    }

    /**
     * Отрисовка змейки
     */
    renderSnake() {
        const canvas = document.getElementById('snake-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const state = this.snakeState;

        // Очистка (GameBoy зеленый экран)
        ctx.fillStyle = '#0f380f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Рисуем змейку (пиксельные блоки)
        state.snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? '#9bbc0f' : '#8bac0f'; // GameBoy зеленые оттенки
            ctx.fillRect(
                segment.x * state.cellSize,
                segment.y * state.cellSize,
                state.cellSize - 1,
                state.cellSize - 1
            );
        });

        // Рисуем еду (торт 🎂) - КРУПНЕЕ!
        ctx.font = '22px Arial';
        ctx.fillText('🎂',
            state.food.x * state.cellSize + 1,
            state.food.y * state.cellSize + 20
        );
    }

    /**
     * Конец игры в змейку
     */
    gameOverSnake() {
        this.snakeState.gameOver = true;
        clearInterval(this.snakeState.interval);

        const canvas = document.getElementById('snake-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff0000';
        ctx.font = '24px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Press Start 2P"';
        ctx.fillText(`SCORE: ${this.snakeState.score}`, canvas.width / 2, canvas.height / 2 + 20);
    }

    /**
     * ИГРА: Крестики-Нолики
     */
    startTicTacToe() {
        const content = document.getElementById('console-content');
        if (!content) return;

        // Инициализация состояния
        this.ticTacToeState = {
            board: Array(9).fill(null),
            currentPlayer: 'X',
            gameOver: false,
            winner: null
        };

        content.innerHTML = `
            <div style="text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 18px; letter-spacing: 2px;">TIC-TAC-TOE</h2>
                <div style="font-size: 12px; margin-bottom: 15px; color: #ffffff; font-family: 'Press Start 2P', cursive; line-height: 1.8;">
                    TURN: <span id="ttt-current">X (YOU)</span>
                </div>
                <div id="ttt-board" style="
                    display: grid;
                    grid-template-columns: repeat(3, 110px);
                    gap: 8px;
                    justify-content: center;
                    margin-bottom: 15px;
                "></div>
                <div id="ttt-result" style="font-size: 16px; color: #ffffff; margin-bottom: 15px; min-height: 40px; font-family: 'Press Start 2P', cursive; line-height: 1.6;"></div>
                <button id="ttt-back" style="${this.getButtonStyle('#ff0000')}; min-width: 300px; padding: 12px 24px; font-size: 12px;">
                    BACK TO MENU
                </button>
            </div>
        `;

        document.getElementById('ttt-back').addEventListener('click', () => this.backToMenu());

        this.renderTicTacToe();
    }

    /**
     * Отрисовка крестиков-ноликов
     */
    renderTicTacToe() {
        const boardEl = document.getElementById('ttt-board');
        if (!boardEl) return;

        boardEl.innerHTML = '';

        this.ticTacToeState.board.forEach((cell, index) => {
            const cellEl = document.createElement('div');
            cellEl.style.cssText = `
                width: 110px;
                height: 110px;
                background: #000000;
                border: 4px solid #ffffff;
                border-radius: 0px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 60px;
                cursor: ${this.ticTacToeState.gameOver || cell ? 'default' : 'pointer'};
                transition: none;
            `;

            cellEl.textContent = cell === 'X' ? '❌' : cell === 'O' ? '⭕' : '';

            if (!this.ticTacToeState.gameOver && !cell) {
                cellEl.addEventListener('mouseenter', () => {
                    cellEl.style.background = '#ffffff';
                });
                cellEl.addEventListener('mouseleave', () => {
                    cellEl.style.background = '#000000';
                });
                cellEl.addEventListener('click', () => this.handleTicTacToeClick(index));
            }

            boardEl.appendChild(cellEl);
        });
    }

    /**
     * Обработка клика в крестики-нолики
     */
    handleTicTacToeClick(index) {
        if (this.ticTacToeState.gameOver || this.ticTacToeState.board[index]) return;

        // Ход игрока
        this.ticTacToeState.board[index] = 'X';
        this.renderTicTacToe();

        // Проверка победы
        if (this.checkTicTacToeWinner('X')) {
            this.endTicTacToe('YOU WIN!');
            return;
        }

        if (this.ticTacToeState.board.every(cell => cell !== null)) {
            this.endTicTacToe('DRAW!');
            return;
        }

        // Ход компьютера
        this.ticTacToeState.currentPlayer = 'O';
        document.getElementById('ttt-current').textContent = 'O (COMP)';

        setTimeout(() => {
            this.computerTicTacToeMove();
        }, 500);
    }

    /**
     * Ход компьютера в крестики-нолики
     */
    computerTicTacToeMove() {
        const state = this.ticTacToeState;

        // Простой AI: пытаемся заблокировать или найти случайную клетку
        let move = this.findBlockingMove('X'); // Блокируем игрока
        if (move === -1) move = this.findBlockingMove('O'); // Или побеждаем сами
        if (move === -1) {
            // Случайный ход
            const available = state.board.map((cell, idx) => cell === null ? idx : -1).filter(idx => idx !== -1);
            move = available[Math.floor(Math.random() * available.length)];
        }

        if (move !== undefined && move !== -1) {
            state.board[move] = 'O';
            this.renderTicTacToe();

            if (this.checkTicTacToeWinner('O')) {
                this.endTicTacToe('COMP WINS!');
                return;
            }

            if (state.board.every(cell => cell !== null)) {
                this.endTicTacToe('DRAW!');
                return;
            }

            state.currentPlayer = 'X';
            document.getElementById('ttt-current').textContent = 'X (YOU)';
        }
    }

    /**
     * Найти блокирующий/побеждающий ход
     */
    findBlockingMove(player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Горизонтали
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Вертикали
            [0, 4, 8], [2, 4, 6]             // Диагонали
        ];

        for (const pattern of winPatterns) {
            const cells = pattern.map(i => this.ticTacToeState.board[i]);
            const count = cells.filter(c => c === player).length;
            const emptyIndex = cells.findIndex(c => c === null);

            if (count === 2 && emptyIndex !== -1) {
                return pattern[emptyIndex];
            }
        }

        return -1;
    }

    /**
     * Проверка победителя
     */
    checkTicTacToeWinner(player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        return winPatterns.some(pattern =>
            pattern.every(index => this.ticTacToeState.board[index] === player)
        );
    }

    /**
     * Конец игры в крестики-нолики
     */
    endTicTacToe(message) {
        this.ticTacToeState.gameOver = true;
        document.getElementById('ttt-result').textContent = message;
    }

    /**
     * ИГРА: PES 2026 (2D симулятор матча)
     */
    startPES() {
        const content = document.getElementById('console-content');
        if (!content) return;

        // Очищаем контейнер и создаем новый компонент FootballMatch
        content.innerHTML = '';
        content.style.padding = '0';

        this.footballMatch = new FootballMatch(content);
        this.footballMatch.setBackCallback(() => this.backToMenu());
    }

    /**
     * Настройка обработчиков клавиатуры
     */
    setupKeyboardListeners() {
        // Обработчик для навигации по карусели
        const menuNavigationHandler = (e) => {
            if (!this.isActive || this.currentGame !== 'menu') return;

            // ВАЖНО: Используем event.code для работы с любой раскладкой клавиатуры
            const code = e.code;

            // Навигация влево/вправо по карусели (A/D)
            if (code === 'KeyA') {
                e.preventDefault();
                e.stopPropagation();
                this.prevGame();
            } else if (code === 'KeyD') {
                e.preventDefault();
                e.stopPropagation();
                this.nextGame();
            } else if (code === 'KeyE') {
                e.preventDefault();
                e.stopPropagation();
                this.startSelectedGame();
            }
        };

        // Обработчик для змейки
        const snakeKeyHandler = (e) => {
            // ВАЖНО: Используем event.code для работы с любой раскладкой клавиатуры
            const code = e.code;
            const key = e.key.toLowerCase();

            // Проверяем, является ли это клавишей управления (используем code для WASD)
            const isControlKey = [
                'KeyW', 'KeyA', 'KeyS', 'KeyD',
                'arrowup', 'arrowdown', 'arrowleft', 'arrowright'
            ].includes(code) || ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key);

            if (!isControlKey) return;

            // Проверяем условия для змейки
            if (!this.isActive || this.currentGame !== 'snake' || !this.snakeState) return;

            const state = this.snakeState;

            // Блокируем событие только для клавиш управления
            e.preventDefault();
            e.stopPropagation();

            console.log('[Snake] Key pressed - code:', code, 'key:', key);

            // Предотвращаем разворот на 180 градусов
            if ((code === 'KeyW' || key === 'arrowup') && state.direction.y === 0) {
                state.nextDirection = {x: 0, y: -1};
                console.log('[Snake] Direction changed to UP');
            } else if ((code === 'KeyS' || key === 'arrowdown') && state.direction.y === 0) {
                state.nextDirection = {x: 0, y: 1};
                console.log('[Snake] Direction changed to DOWN');
            } else if ((code === 'KeyA' || key === 'arrowleft') && state.direction.x === 0) {
                state.nextDirection = {x: -1, y: 0};
                console.log('[Snake] Direction changed to LEFT');
            } else if ((code === 'KeyD' || key === 'arrowright') && state.direction.x === 0) {
                state.nextDirection = {x: 1, y: 0};
                console.log('[Snake] Direction changed to RIGHT');
            }
        };

        // Обработчик для выхода (ESC)
        const escapeHandler = (e) => {
            if (!this.isActive) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();

                if (this.currentGame === 'menu') {
                    this.close();
                } else {
                    // Для всех игр (включая PES/футбол) - возвращаемся в меню
                    this.backToMenu();
                }
            }
        };

        // Используем capture фазу для перехвата событий ДО того, как их получит Phaser
        window.addEventListener('keydown', menuNavigationHandler, { capture: true });
        window.addEventListener('keydown', snakeKeyHandler, { capture: true });
        window.addEventListener('keydown', escapeHandler, { capture: true });

        this.keyHandlers.push(
            { type: 'keydown', handler: menuNavigationHandler },
            { type: 'keydown', handler: snakeKeyHandler },
            { type: 'keydown', handler: escapeHandler }
        );
    }

    /**
     * Удаление обработчиков клавиатуры
     */
    removeKeyboardListeners() {
        this.keyHandlers.forEach(({ type, handler }) => {
            window.removeEventListener(type, handler, { capture: true });
        });
        this.keyHandlers = [];
    }
}
