/**
 * DishWashing - Мини-игра "Мытье посуды" с механикой Button Mashing
 * Быстро нажимай E, чтобы отмыть тарелку до того, как грязь вернется!
 */
export default class DishWashing {
    constructor() {
        this.container = null;
        this.onClose = null;
        this.isActive = false;
        this.keyHandler = null;

        // Игровое состояние
        this.cleanliness = 0; // От 0 до 100
        this.isVictory = false;
        this.decayInterval = null;
        this.animationFrameId = null;

        // DOM элементы
        this.dirtyPlateElement = null;
        this.progressBar = null;
        this.progressText = null;
        this.instructionText = null;

        // Аудио (один длинный файл с debounce)
        this.audioRef = null;
        this.stopSoundTimer = null;
        this.SOUND_STOP_DELAY = 150; // Задержка перед остановкой звука (мс)

        // Константы игры
        this.SCRUB_POWER = 4; // Сколько чистоты добавляет одно нажатие
        this.DECAY_RATE = 1.5; // Сколько чистоты теряется каждый тик
        this.DECAY_INTERVAL = 100; // Интервал decay в миллисекундах
        this.VICTORY_THRESHOLD = 100; // Порог победы
    }

    /**
     * Открыть мини-игру
     * @param {Function} onCloseCallback - Колбэк при закрытии
     */
    open(onCloseCallback) {
        if (this.isActive) return;

        this.isActive = true;
        this.onClose = onCloseCallback;
        this.cleanliness = 0;
        this.isVictory = false;

        this.createContainer();
        this.setupAudio();
        this.setupKeyboardListener();
        this.startDecaySystem();
        this.startRenderLoop();

        console.log('[DishWashing] Mini-game started!');
    }

    /**
     * Закрыть мини-игру
     */
    close() {
        if (!this.isActive) return;

        this.isActive = false;

        // Останавливаем системы
        this.stopDecaySystem();
        this.stopRenderLoop();
        this.removeKeyboardListener();

        // Останавливаем звук и очищаем таймер
        if (this.stopSoundTimer !== null) {
            clearTimeout(this.stopSoundTimer);
            this.stopSoundTimer = null;
        }

        if (this.audioRef) {
            this.audioRef.pause();
            this.audioRef.currentTime = 0;
            this.audioRef = null;
        }

        // Удаляем контейнер
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        // Вызываем колбэк
        if (this.onClose) {
            this.onClose();
        }

        console.log('[DishWashing] Mini-game closed');
    }

    /**
     * Создать UI мини-игры
     */
    createContainer() {
        // Основной контейнер - полноэкранный оверлей
        this.container = document.createElement('div');
        this.container.id = 'dishwashing-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.85);
            z-index: 100;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: 'Press Start 2P', cursive;
        `;

        // Заголовок
        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 28px;
            color: #ff6b00;
            text-align: center;
            margin-bottom: 30px;
            text-shadow:
                3px 3px 0px #000,
                0 0 20px rgba(255, 107, 0, 0.7);
            letter-spacing: 2px;
        `;
        title.textContent = 'ОТМОЙ ЭТУ ТАРЕЛКУ!';

        // Контейнер для тарелки
        const plateContainer = document.createElement('div');
        plateContainer.style.cssText = `
            position: relative;
            width: 400px;
            height: 400px;
            margin: 20px 0;
        `;

        // Слой 1: Чистая тарелка (снизу)
        const cleanPlate = document.createElement('img');
        cleanPlate.src = '/assets/ui/plate_clean.png';
        cleanPlate.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            image-rendering: pixelated;
        `;

        // Слой 2: Грязная тарелка (сверху, с прозрачностью)
        this.dirtyPlateElement = document.createElement('img');
        this.dirtyPlateElement.src = '/assets/ui/plate_dirty.png';
        this.dirtyPlateElement.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            image-rendering: pixelated;
            opacity: 1;
            transition: opacity 0.05s ease-out;
        `;

        // Слой 3: Цифра "9" (улика для кода ванной)
        this.clueDigit = document.createElement('div');
        this.clueDigit.textContent = '9';
        this.clueDigit.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 80px;
            font-weight: bold;
            color: #8B4513;
            opacity: 0;
            transition: opacity 0.5s ease-in;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            pointer-events: none;
            font-family: 'Georgia', serif;
        `;

        plateContainer.appendChild(cleanPlate);
        plateContainer.appendChild(this.clueDigit);
        plateContainer.appendChild(this.dirtyPlateElement);

        // Прогресс-бар контейнер
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            width: 400px;
            margin: 20px 0;
        `;

        // Текст "ЧИСТОТА"
        const progressLabel = document.createElement('div');
        progressLabel.style.cssText = `
            font-size: 14px;
            color: #00ffff;
            text-align: center;
            margin-bottom: 10px;
            text-shadow: 2px 2px 0px #000;
        `;
        progressLabel.textContent = 'ЧИСТОТА';

        // Прогресс-бар фон
        const progressBarBg = document.createElement('div');
        progressBarBg.style.cssText = `
            width: 100%;
            height: 30px;
            background: #1a1a1a;
            border: 4px solid #00ffff;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8);
        `;

        // Прогресс-бар заполнение
        this.progressBar = document.createElement('div');
        this.progressBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #00ff00 0%, #00ffff 100%);
            transition: width 0.1s ease-out, background 0.3s;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
        `;

        // Текст процента
        this.progressText = document.createElement('div');
        this.progressText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 14px;
            color: #ffffff;
            text-shadow:
                2px 2px 0px #000,
                -1px -1px 0px #000,
                1px -1px 0px #000,
                -1px 1px 0px #000;
            font-weight: bold;
            z-index: 1;
        `;
        this.progressText.textContent = '0%';

        progressBarBg.appendChild(this.progressBar);
        progressBarBg.appendChild(this.progressText);
        progressContainer.appendChild(progressLabel);
        progressContainer.appendChild(progressBarBg);

        // Инструкция (мигающая)
        this.instructionText = document.createElement('div');
        this.instructionText.style.cssText = `
            font-size: 18px;
            color: #ffff00;
            text-align: center;
            margin-top: 30px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            letter-spacing: 1px;
            animation: blink 0.8s infinite;
        `;
        this.instructionText.textContent = 'ЖМИ [E] КАК МОЖНО БЫСТРЕЕ!';

        // CSS анимация мигания
        const style = document.createElement('style');
        style.textContent = `
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
            @keyframes victory-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        `;
        document.head.appendChild(style);

        // Собираем все вместе
        this.container.appendChild(title);
        this.container.appendChild(plateContainer);
        this.container.appendChild(progressContainer);
        this.container.appendChild(this.instructionText);
        document.body.appendChild(this.container);
    }

    /**
     * Настроить аудио
     * Создаем один звуковой файл с зацикливанием
     */
    setupAudio() {
        this.audioRef = new Audio('/assets/sounds/scrub.mp3');
        this.audioRef.volume = 0.5;
        this.audioRef.preload = 'auto';
        this.audioRef.loop = true; // Зацикливаем звук

        // Обработчик успешной загрузки
        this.audioRef.addEventListener('canplaythrough', () => {
            console.log('[DishWashing] Scrub sound loaded successfully (16s looped)');
        });

        // Обработчик ошибки загрузки
        this.audioRef.addEventListener('error', (e) => {
            console.error('[DishWashing] Failed to load scrub sound:', e);
        });
    }

    /**
     * Настроить обработчик клавиатуры
     */
    setupKeyboardListener() {
        this.keyHandler = (e) => {
            if (!this.isActive || this.isVictory) return;

            // Нажатие E - мытье тарелки
            if (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') {
                e.preventDefault();
                e.stopPropagation();
                this.scrubPlate();
            }

            // ESC - выход (только если не победа)
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            }
        };

        window.addEventListener('keydown', this.keyHandler, { capture: true });
    }

    /**
     * Удалить обработчик клавиатуры
     */
    removeKeyboardListener() {
        if (this.keyHandler) {
            window.removeEventListener('keydown', this.keyHandler, { capture: true });
            this.keyHandler = null;
        }
    }

    /**
     * Действие: Тереть тарелку
     * Логика Debounce для звука
     */
    scrubPlate() {
        // Увеличиваем чистоту
        this.cleanliness = Math.min(this.VICTORY_THRESHOLD, this.cleanliness + this.SCRUB_POWER);

        // Логика звука с Debounce
        if (this.audioRef) {
            try {
                // Шаг 1: Отменяем предыдущий таймер остановки (если есть)
                if (this.stopSoundTimer !== null) {
                    clearTimeout(this.stopSoundTimer);
                    this.stopSoundTimer = null;
                }

                // Шаг 2: Если звук на паузе — запускаем его
                if (this.audioRef.paused) {
                    // НЕ сбрасываем currentTime - пусть продолжает с того места
                    const playPromise = this.audioRef.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(err => {
                            console.warn('[DishWashing] Audio play failed:', err);
                        });
                    }
                }

                // Шаг 3: Устанавливаем новый таймер остановки
                this.stopSoundTimer = setTimeout(() => {
                    if (this.audioRef && !this.audioRef.paused) {
                        this.audioRef.pause();
                    }
                    this.stopSoundTimer = null;
                }, this.SOUND_STOP_DELAY);

            } catch (err) {
                console.warn('[DishWashing] Audio error:', err);
            }
        }

        // Проверяем победу
        if (this.cleanliness >= this.VICTORY_THRESHOLD && !this.isVictory) {
            this.triggerVictory();
        }
    }

    /**
     * Запустить систему "регенерации грязи"
     */
    startDecaySystem() {
        this.decayInterval = setInterval(() => {
            if (this.isVictory) return;

            // Грязь возвращается, если тарелка не идеально чистая
            if (this.cleanliness > 0 && this.cleanliness < this.VICTORY_THRESHOLD) {
                this.cleanliness = Math.max(0, this.cleanliness - this.DECAY_RATE);
            }
        }, this.DECAY_INTERVAL);
    }

    /**
     * Остановить систему decay
     */
    stopDecaySystem() {
        if (this.decayInterval) {
            clearInterval(this.decayInterval);
            this.decayInterval = null;
        }
    }

    /**
     * Запустить цикл рендера (обновление визуала)
     */
    startRenderLoop() {
        const render = () => {
            if (!this.isActive) return;

            this.updateVisuals();
            this.animationFrameId = requestAnimationFrame(render);
        };

        render();
    }

    /**
     * Остановить цикл рендера
     */
    stopRenderLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Обновить визуальные элементы
     */
    updateVisuals() {
        // Обновляем прозрачность грязной тарелки
        const dirtOpacity = 1 - (this.cleanliness / 100);
        if (this.dirtyPlateElement) {
            this.dirtyPlateElement.style.opacity = dirtOpacity.toFixed(3);
        }

        // Постепенно проявляем цифру "9" от 50% до 100%
        if (this.clueDigit) {
            if (this.cleanliness >= 50) {
                // Вычисляем прозрачность: от 0 при 50% до 1 при 100%
                const clueOpacity = (this.cleanliness - 50) / 50;
                this.clueDigit.style.opacity = clueOpacity.toFixed(3);
            } else {
                this.clueDigit.style.opacity = '0';
            }
        }

        // Обновляем прогресс-бар
        if (this.progressBar) {
            this.progressBar.style.width = `${this.cleanliness}%`;

            // Меняем цвет по мере прогресса
            if (this.cleanliness >= 80) {
                this.progressBar.style.background = 'linear-gradient(90deg, #00ff00 0%, #7fff00 100%)';
            } else if (this.cleanliness >= 50) {
                this.progressBar.style.background = 'linear-gradient(90deg, #ffff00 0%, #00ff00 100%)';
            } else {
                this.progressBar.style.background = 'linear-gradient(90deg, #ff6b00 0%, #ffff00 100%)';
            }
        }

        // Обновляем текст процента
        if (this.progressText) {
            this.progressText.textContent = `${Math.floor(this.cleanliness)}%`;
        }
    }

    /**
     * Победа!
     */
    triggerVictory() {
        this.isVictory = true;
        this.cleanliness = 100;

        console.log('[DishWashing] Victory!');

        // Останавливаем decay
        this.stopDecaySystem();

        // Останавливаем звук мытья
        if (this.stopSoundTimer !== null) {
            clearTimeout(this.stopSoundTimer);
            this.stopSoundTimer = null;
        }
        if (this.audioRef && !this.audioRef.paused) {
            this.audioRef.pause();
        }

        // Меняем текст
        if (this.instructionText) {
            this.instructionText.textContent = '✨ ИДЕАЛЬНО ЧИСТО! ✨';
            this.instructionText.style.animation = 'victory-pulse 0.5s infinite';
            this.instructionText.style.color = '#00ff00';
            this.instructionText.style.fontSize = '22px';
        }

        // Победный звук (системный beep или можно добавить отдельный файл)
        this.playVictorySound();

        // Закрываем через 2 секунды
        setTimeout(() => {
            this.close();
        }, 2000);
    }

    /**
     * Проиграть победный звук
     */
    playVictorySound() {
        // Можно использовать Web Audio API для генерации простого "успешного" звука
        // Или загрузить отдельный файл победы
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (err) {
            console.warn('[DishWashing] Victory sound failed:', err);
        }
    }
}
