/**
 * FootballMatch - Простой экран матча с аудио-комментатором
 * Только крупный счёт и комментарии, синхронизированные с аудио
 */

export default class FootballMatch {
    constructor(container) {
        this.container = container;
        this.score = { karina: 0, dasha: 0 };
        this.onBack = null;
        this.isDestroyed = false; // Флаг для защиты от повторного destroy
        this.keyHandler = null; // Обработчик клавиатуры для Escape

        // АУДИО-СИСТЕМА: Фон и плейлист комментатора
        this.audio = {
            crowd: null,              // Фоновый шум стадиона
            currentClip: null,        // Текущая фраза комментатора
            playlist: [
                {
                    file: 'assets/sounds/comm_intro.mp3',
                    score: { karina: 0, dasha: 0 },
                    text: 'МАТЧ НАЧАЛСЯ!'
                },
                {
                    file: 'assets/sounds/comm_goal1.mp3',
                    score: { karina: 1, dasha: 0 },
                    text: 'Быстрый гол!'
                },
                {
                    file: 'assets/sounds/comm_goal2.mp3',
                    score: { karina: 2, dasha: 0 },
                    text: 'Даша спит?!'
                },
                {
                    file: 'assets/sounds/comm_goal3.mp3',
                    score: { karina: 3, dasha: 0 },
                    text: 'Разгром!'
                },
                {
                    file: 'assets/sounds/comm_goal4.mp3',
                    score: { karina: 4, dasha: 0 },
                    text: 'Неостановима!'
                },
                {
                    file: 'assets/sounds/comm_goal6.mp3',
                    score: { karina: 5, dasha: 0 },
                    text: 'ФИНАЛ!'
                }
            ],
            currentIndex: 0
        };

        // ТАЙМЕР: Для отсчёта игрового времени (0-90:00)
        this.matchTimer = {
            startTime: null,          // Время начала матча
            currentTime: 0,           // Текущее время в секундах (0-5400 = 90 минут)
            totalDuration: 40,        // Общая длительность всех клипов (будет обновлена после загрузки)
            interval: null            // Интервал для обновления таймера
        };

        this.render();
        this.startMatch();
        this.setupKeyboardListener();
    }

    /**
     * Настройка обработчика клавиатуры для выхода по Escape
     * ОТКЛЮЧЕНО: Обработка Escape теперь происходит в ConsoleOverlay
     */
    setupKeyboardListener() {
        // Escape обрабатывается в ConsoleOverlay.escapeHandler
        // Не добавляем свой обработчик, чтобы избежать конфликтов
    }

    /**
     * Удаление обработчика клавиатуры
     */
    removeKeyboardListener() {
        if (this.keyHandler) {
            window.removeEventListener('keydown', this.keyHandler, { capture: true });
            this.keyHandler = null;
        }
    }

    render() {
        this.container.innerHTML = `
            <style>
                @keyframes score-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }

                @keyframes commentary-appear {
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }

                @keyframes victory-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .scoreboard {
                    animation: score-pulse 0.5s ease;
                }

                .commentary-text {
                    animation: commentary-appear 0.5s ease;
                }

                #match-back:hover {
                    background: #ff0000;
                    color: #ffffff;
                    transform: scale(1.05);
                }

                #victory-back:hover {
                    background: #ffff00;
                    color: #000000;
                    transform: scale(1.05);
                }
            </style>

            <div style="
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 40px;
                background: #1a1c2c;
                position: relative;
            ">
                <!-- Таймер матча -->
                <div style="
                    position: absolute;
                    top: 30px;
                    background: #000000;
                    border: 4px solid #00ff00;
                    padding: 15px 40px;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 28px;
                    color: #00ff00;
                    letter-spacing: 3px;
                    text-shadow: 0 0 15px rgba(0, 255, 0, 0.8);
                " id="match-timer">
                    00:00
                </div>

                <!-- Крупное табло счета -->
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 60px;
                ">
                    <!-- Карина -->
                    <div style="
                        text-align: center;
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                    ">
                        <div style="
                            font-family: 'Press Start 2P', cursive;
                            font-size: 24px;
                            color: #ff3333;
                            letter-spacing: 2px;
                        ">КАРИНА</div>
                        <div id="score-karina" class="scoreboard" style="
                            font-family: 'Press Start 2P', cursive;
                            font-size: 120px;
                            color: #ffff00;
                            text-shadow: 0 0 20px rgba(255, 255, 0, 0.8);
                        ">0</div>
                    </div>

                    <!-- Разделитель -->
                    <div style="
                        font-family: 'Press Start 2P', cursive;
                        font-size: 80px;
                        color: #ffffff;
                        opacity: 0.5;
                    ">:</div>

                    <!-- Даша -->
                    <div style="
                        text-align: center;
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                    ">
                        <div style="
                            font-family: 'Press Start 2P', cursive;
                            font-size: 24px;
                            color: #3366ff;
                            letter-spacing: 2px;
                        ">ДАША</div>
                        <div id="score-dasha" class="scoreboard" style="
                            font-family: 'Press Start 2P', cursive;
                            font-size: 120px;
                            color: #ffff00;
                            text-shadow: 0 0 20px rgba(255, 255, 0, 0.8);
                        ">0</div>
                    </div>
                </div>

                <!-- Строка комментатора -->
                <div style="
                    width: 800px;
                    min-height: 80px;
                    background: #000000;
                    border: 4px solid #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Press Start 2P', cursive;
                    font-size: 14px;
                    color: #00ff00;
                    padding: 20px;
                    text-align: center;
                    line-height: 1.8;
                " id="commentary">
                    Матч начинается...
                </div>

                <!-- Кнопка выхода -->
                <button id="match-back" style="
                    background: #000000;
                    border: 4px solid #ff0000;
                    color: #ff0000;
                    padding: 15px 50px;
                    font-size: 14px;
                    cursor: pointer;
                    font-family: 'Press Start 2P', cursive;
                    letter-spacing: 2px;
                    transition: all 0.2s;
                    margin-top: 20px;
                ">
                    НАЗАД
                </button>

                <!-- Экран победы -->
                <div id="victory-screen" style="
                    display: none;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 1000;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 30px;
                ">
                    <div style="
                        font-family: 'Press Start 2P', cursive;
                        font-size: 60px;
                        color: #ffff00;
                        text-align: center;
                        line-height: 1.5;
                        animation: victory-pulse 1.5s ease infinite;
                        text-shadow: 0 0 30px rgba(255, 255, 0, 0.9);
                    ">
                        ПОБЕДА!
                    </div>
                    <div style="
                        font-family: 'Press Start 2P', cursive;
                        font-size: 48px;
                        color: #ff3333;
                        animation: victory-pulse 1.5s ease infinite;
                    ">
                        5 : 0
                    </div>
                    <div style="
                        font-family: 'Press Start 2P', cursive;
                        font-size: 20px;
                        color: #00ff00;
                        margin-top: 20px;
                    ">
                        КАРИНА ЧЕМПИОН!
                    </div>

                    <!-- Кнопка выхода на экране победы -->
                    <button id="victory-back" style="
                        background: #000000;
                        border: 4px solid #ffff00;
                        color: #ffff00;
                        padding: 15px 50px;
                        font-size: 14px;
                        cursor: pointer;
                        font-family: 'Press Start 2P', cursive;
                        letter-spacing: 2px;
                        transition: all 0.2s;
                        margin-top: 30px;
                    ">
                        НАЗАД В МЕНЮ
                    </button>
                </div>
            </div>
        `;

        document.getElementById('match-back').addEventListener('click', () => this.destroy());
        document.getElementById('victory-back').addEventListener('click', () => this.destroy());
    }

    startMatch() {
        // АУДИО: Запускаем аудио-систему
        this.initAudio();

        // ТАЙМЕР: Запускаем таймер матча
        this.startMatchTimer();
    }

    /**
     * ТАЙМЕР: Запуск таймера матча (00:00 - 90:00)
     */
    startMatchTimer() {
        this.matchTimer.startTime = Date.now();

        // Запускаем таймер, который будет обновляться до конца аудио
        this.matchTimer.interval = setInterval(() => {
            this.updateMatchTimer();
        }, 100);
    }

    /**
     * ТАЙМЕР: Обновление отображения таймера
     */
    updateMatchTimer() {
        const elapsed = (Date.now() - this.matchTimer.startTime) / 1000; // секунды

        // Вычисляем игровое время (0-5400 секунд = 0-90 минут)
        // Растягиваем реальное время на 90 минут игрового времени
        const gameTimeSeconds = Math.min((elapsed / this.matchTimer.totalDuration) * 5400, 5400);

        const minutes = Math.floor(gameTimeSeconds / 60);
        const seconds = Math.floor(gameTimeSeconds % 60);

        // Обновляем отображение в формате ММ:СС
        const timerEl = document.getElementById('match-timer');
        if (timerEl) {
            timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        this.matchTimer.currentTime = gameTimeSeconds;
    }

    /**
     * ТАЙМЕР: Установка общей длительности матча (вызывается когда известна длительность аудио)
     */
    setMatchDuration(durationSeconds) {
        this.matchTimer.totalDuration = durationSeconds;
        console.log(`[Timer] Установлена длительность матча: ${durationSeconds} секунд`);
    }

    /**
     * АУДИО: Инициализация аудио-системы
     */
    async initAudio() {
        // 1. Запускаем фоновый шум стадиона (зациклен)
        this.audio.crowd = new Audio('assets/sounds/stadium_crowd.mp3');
        this.audio.crowd.loop = true;
        this.audio.crowd.volume = 1.0;
        this.audio.crowd.play().catch(err => console.warn('Не удалось запустить фон стадиона:', err));

        // 2. Вычисляем общую длительность всех клипов
        await this.calculateTotalAudioDuration();

        // 3. Запускаем плейлист с первой фразы (comm_intro)
        this.playNextClip();
    }

    /**
     * АУДИО: Вычисление общей длительности всех аудиоклипов
     */
    async calculateTotalAudioDuration() {
        let totalDuration = 0;
        const pauseBetweenClips = 0.5; // Пауза между клипами в секундах

        // Загружаем метаданные всех клипов для получения длительности
        const durationPromises = this.audio.playlist.map(clip => {
            return new Promise((resolve) => {
                const audio = new Audio(clip.file);
                audio.addEventListener('loadedmetadata', () => {
                    resolve(audio.duration);
                });
                audio.addEventListener('error', () => {
                    console.warn(`Не удалось загрузить метаданные для ${clip.file}, используем 5 сек`);
                    resolve(5); // Дефолтное значение если ошибка
                });
            });
        });

        try {
            const durations = await Promise.all(durationPromises);
            totalDuration = durations.reduce((sum, duration) => sum + duration, 0);

            // Добавляем паузы между клипами
            totalDuration += pauseBetweenClips * (this.audio.playlist.length - 1);

            console.log(`[Audio] Общая длительность аудио: ${totalDuration.toFixed(2)} секунд`);
            console.log(`[Audio] Длительности клипов:`, durations.map(d => d.toFixed(2)));

            // Устанавливаем длительность для таймера
            this.setMatchDuration(totalDuration);
        } catch (error) {
            console.error('[Audio] Ошибка при вычислении длительности:', error);
            // Используем примерное значение
            this.setMatchDuration(40);
        }
    }

    /**
     * АУДИО: Воспроизведение следующего клипа из плейлиста
     */
    playNextClip() {
        const { playlist, currentIndex } = this.audio;

        // Проверяем, есть ли ещё клипы
        if (currentIndex >= playlist.length) {
            console.log('[Audio] Плейлист завершён');
            return;
        }

        const clip = playlist[currentIndex];
        console.log(`[Audio] Воспроизведение клипа ${currentIndex + 1}/${playlist.length}: ${clip.file}`);

        // Показываем только текст комментария в начале
        this.setCommentary(clip.text, clip.score.karina === 5 ? '#ffff00' : '#00ff00');

        // Создаём аудио-элемент
        this.audio.currentClip = new Audio(clip.file);
        this.audio.currentClip.volume = 1.0;

        // Флаг для отслеживания, обновлён ли счёт
        let scoreUpdated = false;

        // Отслеживаем воспроизведение и обновляем счёт в середине клипа
        this.audio.currentClip.ontimeupdate = () => {
            const audio = this.audio.currentClip;
            if (!scoreUpdated && audio.currentTime >= audio.duration / 2) {
                // Обновляем счёт в середине клипа
                console.log(`[Audio] Обновление счёта в середине клипа ${currentIndex + 1}`);
                this.score.karina = clip.score.karina;
                this.score.dasha = clip.score.dasha;
                this.updateScoreboard();
                scoreUpdated = true;
            }
        };

        // Когда клип закончится, запускаем следующий
        this.audio.currentClip.onended = () => {
            console.log(`[Audio] Клип ${currentIndex + 1} завершён`);
            this.audio.currentIndex++;

            // Если это был последний клип - показываем победу
            if (this.audio.currentIndex >= playlist.length) {
                this.showVictoryScreen();
            } else {
                // Иначе воспроизводим следующий клип через небольшую паузу
                setTimeout(() => this.playNextClip(), 500);
            }
        };

        // Запускаем воспроизведение
        this.audio.currentClip.play().catch(err => {
            console.warn(`Не удалось воспроизвести ${clip.file}:`, err);
            // Если ошибка, переходим к следующему клипу
            this.audio.currentIndex++;
            setTimeout(() => this.playNextClip(), 500);
        });
    }

    /**
     * АУДИО: Показать экран победы с fade out фона
     */
    showVictoryScreen() {
        console.log('[Victory] Показываем экран победы');

        // Устанавливаем таймер на 90:00
        this.matchTimer.currentTime = 5400; // 90 минут = 5400 секунд
        const timerEl = document.getElementById('match-timer');
        if (timerEl) {
            timerEl.textContent = "90:00";
        }

        // Останавливаем таймер
        if (this.matchTimer.interval) {
            clearInterval(this.matchTimer.interval);
            this.matchTimer.interval = null;
        }

        // Показываем экран победы
        const victoryScreen = document.getElementById('victory-screen');
        if (victoryScreen) {
            victoryScreen.style.display = 'flex';
        }

        // Плавно заглушаем фон стадиона (fade out)
        this.fadeOutCrowd();
    }

    /**
     * АУДИО: Плавное затухание фона стадиона
     */
    fadeOutCrowd() {
        if (!this.audio.crowd) return;

        const fadeInterval = setInterval(() => {
            if (this.audio.crowd.volume > 0.05) {
                this.audio.crowd.volume -= 0.05;
            } else {
                this.audio.crowd.volume = 0;
                this.audio.crowd.pause();
                clearInterval(fadeInterval);
                console.log('[Audio] Фон стадиона заглушен');
            }
        }, 100); // Уменьшаем громкость каждые 100мс
    }

    /**
     * Обновление табло счёта
     */
    updateScoreboard() {
        const karinaEl = document.getElementById('score-karina');
        const dashaEl = document.getElementById('score-dasha');

        if (karinaEl) {
            karinaEl.textContent = this.score.karina;
            karinaEl.classList.remove('scoreboard');
            setTimeout(() => karinaEl.classList.add('scoreboard'), 10);
        }

        if (dashaEl) {
            dashaEl.textContent = this.score.dasha;
            dashaEl.classList.remove('scoreboard');
            setTimeout(() => dashaEl.classList.add('scoreboard'), 10);
        }
    }

    /**
     * Обновление комментария
     */
    setCommentary(text, color = '#00ff00') {
        const commentary = document.getElementById('commentary');
        if (commentary) {
            commentary.textContent = text;
            commentary.style.color = color;
            commentary.classList.remove('commentary-text');
            setTimeout(() => commentary.classList.add('commentary-text'), 10);
        }
    }

    /**
     * Очистка и выход
     */
    destroy() {
        // Защита от повторного вызова
        if (this.isDestroyed) return;
        this.isDestroyed = true;

        // КЛАВИАТУРА: Удаляем обработчик
        this.removeKeyboardListener();

        // ТАЙМЕР: Останавливаем таймер матча
        if (this.matchTimer.interval) {
            clearInterval(this.matchTimer.interval);
            this.matchTimer.interval = null;
        }

        // АУДИО: Останавливаем все аудио при выходе
        if (this.audio.crowd) {
            this.audio.crowd.pause();
            this.audio.crowd = null;
        }
        if (this.audio.currentClip) {
            this.audio.currentClip.pause();
            this.audio.currentClip = null;
        }

        // Вызываем callback если он установлен
        if (this.onBack) {
            this.onBack();
        }
    }

    setBackCallback(callback) {
        this.onBack = callback;
    }
}
