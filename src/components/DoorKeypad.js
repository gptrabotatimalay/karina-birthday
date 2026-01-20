/**
 * DoorKeypad - Механический кодовый замок для двери на кухню
 * Правильный код: 7454
 * Подсказки: [⭐] [Р] [⚽️] [📕]
 * Управление: A/D - выбор барабана, W/S - прокрутка цифр
 */
export default class DoorKeypad {
    constructor(onUnlockCallback, onCloseCallback) {
        this.onUnlockCallback = onUnlockCallback;
        this.onCloseCallback = onCloseCallback;
        this.container = null;
        this.isOpen = false;
        this.isUnlocked = false; // Флаг успешной разблокировки

        // Механические барабаны (4 позиции, каждая от 0 до 9)
        this.drums = [0, 0, 0, 0];
        this.selectedDrum = 0; // Индекс выбранного барабана (0-3)
        this.correctCode = [7, 4, 5, 4];
        this.hintIcons = ['⭐', 'Р', '⚽️', '📕']; // Подсказки по умолчанию
        this.hintText = null; // Текстовая подсказка (если есть, заменяет иконки)

        // Звук трещотки механического замка
        this.lockClickAudio = new Audio('./assets/sounds/lock_click.mp3');
        this.lockClickAudio.volume = 0.3;

        // Привязываем методы к контексту
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Открыть кодовый замок
     */
    open() {
        this.isOpen = true;
        this.isUnlocked = false; // Сбрасываем флаг разблокировки
        this.drums = [0, 0, 0, 0];
        this.selectedDrum = 0;

        // Скрываем панель чата
        if (window.chatPanel) {
            window.chatPanel.hide();
        }

        // Создаем контейнер
        this.container = document.createElement('div');
        this.container.id = 'door-keypad-overlay';
        this.container.className = 'door-keypad-overlay';

        // Создаем содержимое
        this.render();

        // Добавляем в DOM
        document.body.appendChild(this.container);

        // Настраиваем обработчики событий
        this.setupEventListeners();

        console.log('[DoorKeypad] Opened (Mechanical)');
    }

    /**
     * Рендер механического замка
     */
    render() {
        // Определяем, какой тип подсказки использовать
        const hintsHTML = this.hintText
            ? `<div class="keypad-hint-text">${this.hintText}</div>`
            : `<div class="keypad-hints">
                    <div class="keypad-hint-item">${this.hintIcons[0]}</div>
                    <div class="keypad-hint-item">${this.hintIcons[1]}</div>
                    <div class="keypad-hint-item">${this.hintIcons[2]}</div>
                    <div class="keypad-hint-item">${this.hintIcons[3]}</div>
               </div>`;

        this.container.innerHTML = `
            <div class="keypad-panel mechanical">
                <div class="keypad-header">
                    <div class="keypad-title">КОДОВЫЙ ЗАМОК</div>
                </div>

                ${hintsHTML}

                <div class="mechanical-lock">
                    ${this.drums.map((value, index) => this.renderDrum(index, value)).join('')}
                </div>

                <div class="keypad-message" id="keypad-message"></div>

                <div class="keypad-controls mechanical-controls">
                    <div class="control-row">
                        <div class="control-hint">A / D — Выбрать барабан</div>
                    </div>
                    <div class="control-row">
                        <div class="control-hint">W / S — Крутить барабан</div>
                    </div>
                    <div class="control-row">
                        <button class="keypad-control-btn enter-btn" id="keypad-enter">ПРОВЕРИТЬ (E)</button>
                    </div>
                </div>

                <div class="keypad-exit-hint">ESC - Закрыть</div>
            </div>
        `;

        // Устанавливаем обработчики кнопок
        this.setupButtons();
    }

    /**
     * Рендер одного барабана
     */
    renderDrum(index, value) {
        const isSelected = index === this.selectedDrum;

        // Вычисляем предыдущее и следующее значение для эффекта прокрутки
        const prevValue = (value - 1 + 10) % 10;
        const nextValue = (value + 1) % 10;

        return `
            <div class="drum-container ${isSelected ? 'selected' : ''}" data-drum="${index}">
                <div class="drum-window">
                    <div class="drum-roller">
                        <div class="drum-digit prev">${prevValue}</div>
                        <div class="drum-digit current">${value}</div>
                        <div class="drum-digit next">${nextValue}</div>
                    </div>
                </div>
                ${isSelected ? '<div class="drum-selector">◄ ►</div>' : ''}
            </div>
        `;
    }

    /**
     * Обновить отображение барабанов
     */
    updateDisplay() {
        const mechanicalLock = this.container.querySelector('.mechanical-lock');
        if (mechanicalLock) {
            mechanicalLock.innerHTML = this.drums.map((value, index) =>
                this.renderDrum(index, value)
            ).join('');
        }
    }

    /**
     * Показать сообщение
     */
    showMessage(message, color) {
        const messageEl = document.getElementById('keypad-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.style.color = color;
            messageEl.style.opacity = '1';

            setTimeout(() => {
                messageEl.style.opacity = '0';
            }, 2000);
        }
    }

    /**
     * Настройка кнопок
     */
    setupButtons() {
        // Кнопка проверки
        const enterBtn = document.getElementById('keypad-enter');
        if (enterBtn) {
            enterBtn.addEventListener('click', () => this.checkCode());
        }
    }

    /**
     * Переместить выбор барабана влево
     */
    selectLeft() {
        this.selectedDrum = (this.selectedDrum - 1 + 4) % 4;
        this.playSelectSound();
        this.updateDisplay();
        console.log('[DoorKeypad] Selected drum:', this.selectedDrum);
    }

    /**
     * Переместить выбор барабана вправо
     */
    selectRight() {
        this.selectedDrum = (this.selectedDrum + 1) % 4;
        this.playSelectSound();
        this.updateDisplay();
        console.log('[DoorKeypad] Selected drum:', this.selectedDrum);
    }

    /**
     * Воспроизвести звук выбора барабана
     */
    playSelectSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;

            // Мягкий звук выбора
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, now);

            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

            oscillator.start(now);
            oscillator.stop(now + 0.08);
        } catch (error) {
            // Игнорируем ошибки звука
        }
    }

    /**
     * Прокрутить барабан вверх (уменьшить цифру - цифры "уходят вверх")
     */
    rollUp() {
        this.drums[this.selectedDrum] = (this.drums[this.selectedDrum] - 1 + 10) % 10;
        this.playClickSound();
        this.updateDisplay();
        console.log('[DoorKeypad] Drum', this.selectedDrum, 'rolled up to:', this.drums[this.selectedDrum]);
    }

    /**
     * Прокрутить барабан вниз (увеличить цифру - цифры "приходят снизу")
     */
    rollDown() {
        this.drums[this.selectedDrum] = (this.drums[this.selectedDrum] + 1) % 10;
        this.playClickSound();
        this.updateDisplay();
        console.log('[DoorKeypad] Drum', this.selectedDrum, 'rolled down to:', this.drums[this.selectedDrum]);
    }

    /**
     * Воспроизвести звук трещотки механического барабана
     */
    playClickSound() {
        try {
            // Сбрасываем время и воспроизводим звук
            this.lockClickAudio.currentTime = 0;
            this.lockClickAudio.play().catch(() => {
                // Игнорируем ошибки воспроизведения
            });
        } catch (error) {
            // Игнорируем ошибки звука
        }
    }

    /**
     * Проверить код
     */
    checkCode() {
        const isCorrect = this.drums.every((value, index) => value === this.correctCode[index]);

        if (isCorrect) {
            // Правильный код
            this.isUnlocked = true; // Устанавливаем флаг успешной разблокировки
            console.log('[DoorKeypad] ✓ Correct code entered');

            this.showMessage('✓ ДОСТУП РАЗРЕШЕН', '#00ff00');

            // Звук успеха
            this.playSuccessSound();

            // Сохраняем колбэк для вызова после закрытия
            const unlockCallback = this.onUnlockCallback;

            // Закрываем замок с анимацией
            setTimeout(() => {
                this.close(() => {
                    // Вызываем колбэк разблокировки ПОСЛЕ завершения fadeOut
                    if (unlockCallback) {
                        unlockCallback();
                    }
                });
            }, 1500);
        } else {
            // Неправильный код
            this.showMessage('✗ НЕВЕРНЫЙ КОД', '#ff0000');

            // Звук ошибки
            this.playErrorSound();

            // Тряска замка при ошибке
            const panel = this.container.querySelector('.keypad-panel');
            if (panel) {
                panel.classList.add('shake');
                setTimeout(() => {
                    panel.classList.remove('shake');
                }, 500);
            }
        }
    }

    /**
     * Воспроизвести звук успеха (позитивный, восходящий)
     */
    playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;

            // Создаем осциллятор для мелодии успеха
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Тип волны - синусоида для приятного звука
            oscillator.type = 'sine';

            // Восходящая мелодия: C5 -> E5 -> G5
            const notes = [523.25, 659.25, 783.99]; // Частоты нот
            const noteDuration = 0.1;

            notes.forEach((freq, index) => {
                const startTime = now + index * noteDuration;
                oscillator.frequency.setValueAtTime(freq, startTime);

                // Огибающая громкости для каждой ноты
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);
            });

            oscillator.start(now);
            oscillator.stop(now + notes.length * noteDuration);

            console.log('[DoorKeypad] Success sound played');
        } catch (error) {
            console.error('[DoorKeypad] Error playing success sound:', error);
        }
    }

    /**
     * Воспроизвести звук ошибки (негативный, низкий)
     */
    playErrorSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioContext.currentTime;

            // Создаем осциллятор для звука ошибки
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Тип волны - квадратная для более резкого звука
            oscillator.type = 'square';

            // Нисходящий звук ошибки
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.3);

            // Огибающая громкости
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

            oscillator.start(now);
            oscillator.stop(now + 0.3);

            console.log('[DoorKeypad] Error sound played');
        } catch (error) {
            console.error('[DoorKeypad] Error playing error sound:', error);
        }
    }

    /**
     * Закрыть замок
     * @param {Function} afterFadeCallback - Опциональный колбэк, который вызывается после завершения fadeOut
     */
    close(afterFadeCallback) {
        if (!this.isOpen) {
            console.log('[DoorKeypad] Already closed, ignoring');
            return;
        }

        this.isOpen = false;

        // Удаляем обработчики
        window.removeEventListener('keydown', this.handleKeyDown);

        // Добавляем анимацию fadeOut перед удалением
        if (this.container) {
            this.container.style.animation = 'fadeOut 0.3s ease';
            this.container.style.opacity = '0';

            // Удаляем DOM элемент после завершения анимации
            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
                this.container = null;

                // Вызываем afterFadeCallback если был передан (для unlock)
                if (afterFadeCallback) {
                    afterFadeCallback();
                }
            }, 300); // Соответствует длительности fadeOut анимации
        }

        // Показываем панель чата
        if (window.chatPanel) {
            window.chatPanel.show();
        }

        console.log('[DoorKeypad] Closed');

        // Вызываем колбэк закрытия только если замок не был успешно разблокирован
        if (!this.isUnlocked && this.onCloseCallback) {
            const callback = this.onCloseCallback;
            this.onCloseCallback = null;
            this.onUnlockCallback = null;
            callback();
        }
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        window.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Обработка нажатий клавиш
     */
    handleKeyDown(event) {
        if (!this.isOpen) return;

        const code = event.code;
        const key = event.key.toLowerCase();

        // Определяем наши клавиши
        const isOurKey =
            code === 'KeyW' ||
            code === 'KeyA' ||
            code === 'KeyS' ||
            code === 'KeyD' ||
            code === 'KeyE' ||
            key === 'escape';

        if (!isOurKey) return;

        event.stopPropagation();
        event.preventDefault();

        console.log(`[DoorKeypad] Key pressed - code: ${code}, key: ${key}`);

        // W - прокрутить вверх
        if (code === 'KeyW') {
            this.rollUp();
        }
        // S - прокрутить вниз
        else if (code === 'KeyS') {
            this.rollDown();
        }
        // A - выбрать барабан слева
        else if (code === 'KeyA') {
            this.selectLeft();
        }
        // D - выбрать барабан справа
        else if (code === 'KeyD') {
            this.selectRight();
        }
        // E - проверить код
        else if (code === 'KeyE') {
            this.checkCode();
        }
        // Escape - закрыть
        else if (key === 'escape') {
            this.close();
        }
    }
}
