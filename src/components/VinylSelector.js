/**
 * VinylSelector - Компонент для выбора пластинок
 * Отображает карусель с обложками альбомов в стиле Retro Pixel
 */
export default class VinylSelector {
    constructor(onSelectCallback, onCloseCallback) {
        this.onSelectCallback = onSelectCallback;
        this.onCloseCallback = onCloseCallback; // Колбэк при закрытии (например, Escape)
        this.currentIndex = 0;
        this.container = null;
        this.isOpen = false; // Флаг состояния окна

        // ===== ДАННЫЕ ПЛАСТИНОК =====
        this.records = [
            {
                id: 'queen',
                name: 'Queen - Greatest Hits',
                cover: '/assets/vinyls/cover_queen.jpeg',
                track: '/assets/music/song_queen.mp3'
            },
            {
                id: 'panic',
                name: 'Panic! At The Disco',
                cover: '/assets/vinyls/cover_panic.jpeg',
                track: '/assets/music/song_panic.mp3'
            },
            {
                id: 'am',
                name: 'Arctic Monkeys - AM',
                cover: '/assets/vinyls/cover_am.jpeg',
                track: '/assets/music/song_am.mp3'
            },
            {
                id: 'ghibli',
                name: 'Studio Ghibli Collection',
                cover: '/assets/vinyls/cover_ghibli.jpeg',
                track: '/assets/music/song_ghibli.mp3'
            }
        ];

        // Привязываем методы к контексту
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Открыть окно выбора
     */
    open() {
        this.isOpen = true; // Устанавливаем флаг

        // Скрываем панель чата
        if (window.chatPanel) {
            window.chatPanel.hide();
        }

        // Создаем контейнер
        this.container = document.createElement('div');
        this.container.id = 'vinyl-selector';
        this.container.className = 'vinyl-selector-overlay';

        // Создаем содержимое
        this.container.innerHTML = `
            <div class="vinyl-selector-window">
                <div class="vinyl-selector-header">
                    <h2>ВЫБЕРИ ПЛАСТИНКУ</h2>
                </div>

                <div class="vinyl-carousel">
                    <button class="carousel-arrow left" id="vinyl-arrow-left">◄</button>

                    <div class="carousel-center">
                        <img
                            id="vinyl-cover-img"
                            src="${this.records[this.currentIndex].cover}"
                            alt="${this.records[this.currentIndex].name}"
                            class="vinyl-cover"
                        />
                        <div class="vinyl-title">${this.records[this.currentIndex].name}</div>
                    </div>

                    <button class="carousel-arrow right" id="vinyl-arrow-right">►</button>
                </div>

                <div class="vinyl-controls">
                    <div class="vinyl-hint">Используй A/D или ◄/► для навигации</div>
                    <button class="vinyl-select-btn" id="vinyl-select-btn">
                        (E) ВЫБРАТЬ
                    </button>
                </div>
            </div>
        `;

        // Добавляем в DOM
        document.body.appendChild(this.container);

        // Настраиваем обработчики событий
        this.setupEventListeners();

        console.log('[VinylSelector] Opened');
    }

    /**
     * Закрыть окно выбора
     */
    close() {
        // Защита от повторного вызова
        if (!this.isOpen) {
            console.log('[VinylSelector] Already closed, ignoring');
            return;
        }

        this.isOpen = false; // Сбрасываем флаг

        // Удаляем обработчики с window
        window.removeEventListener('keydown', this.handleKeyDown);

        // Удаляем DOM элемент (это автоматически удалит все обработчики кнопок)
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        // Показываем панель чата
        if (window.chatPanel) {
            window.chatPanel.show();
        }

        console.log('[VinylSelector] Closed');

        // ВАЖНО: Вызываем колбэк при закрытии В КОНЦЕ
        // Сохраняем колбэк и очищаем его, чтобы избежать повторного вызова
        const callback = this.onCloseCallback;
        this.onCloseCallback = null;

        if (callback) {
            callback();
        }
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // ВАЖНО: Используем window вместо document для глобального перехвата
        window.addEventListener('keydown', this.handleKeyDown);

        // Кнопки
        const leftBtn = document.getElementById('vinyl-arrow-left');
        const rightBtn = document.getElementById('vinyl-arrow-right');
        const selectBtn = document.getElementById('vinyl-select-btn');

        leftBtn.addEventListener('click', () => this.navigate(-1));
        rightBtn.addEventListener('click', () => this.navigate(1));
        selectBtn.addEventListener('click', () => this.selectCurrent());
    }

    /**
     * Обработка нажатий клавиш
     */
    handleKeyDown(event) {
        // КРИТИЧЕСКИ ВАЖНО: Если окно закрыто, не обрабатываем события
        if (!this.isOpen) {
            return;
        }

        // ВАЖНО: Используем event.code вместо event.key для работы с любой раскладкой
        // event.code даёт физическое расположение клавиши (KeyA, KeyD, KeyE)
        // event.key даёт символ с учётом раскладки ('a', 'ф', и т.д.)
        const code = event.code;
        const key = event.key.toLowerCase();

        // Проверяем по code (физическая клавиша) и key (для стрелок)
        const isOurKey =
            code === 'KeyA' ||
            code === 'KeyD' ||
            code === 'KeyE' ||
            key === 'arrowleft' ||
            key === 'arrowright' ||
            key === 'enter' ||
            key === 'escape';

        // Если это не наша клавиша, игнорируем
        if (!isOurKey) {
            return;
        }

        // Останавливаем событие только для наших клавиш когда окно открыто
        event.stopPropagation();
        event.preventDefault();

        console.log(`[VinylSelector] Key pressed - code: ${code}, key: ${key}`);

        // Используем code для букв (работает с любой раскладкой)
        if (code === 'KeyA' || key === 'arrowleft') {
            this.navigate(-1);
        } else if (code === 'KeyD' || key === 'arrowright') {
            this.navigate(1);
        } else if (code === 'KeyE' || key === 'enter') {
            this.selectCurrent();
        } else if (key === 'escape') {
            this.close();
        }
    }

    /**
     * Навигация по карусели
     */
    navigate(direction) {
        // Обновляем индекс с циклическим переходом
        this.currentIndex = (this.currentIndex + direction + this.records.length) % this.records.length;

        // Обновляем отображение
        this.updateDisplay();

        console.log(`[VinylSelector] Navigated to: ${this.records[this.currentIndex].name}`);
    }

    /**
     * Обновить отображение текущей пластинки
     */
    updateDisplay() {
        const coverImg = document.getElementById('vinyl-cover-img');
        const titleDiv = document.querySelector('.vinyl-title');

        if (coverImg && titleDiv) {
            const current = this.records[this.currentIndex];

            // Анимация смены (fade out -> fade in)
            coverImg.style.opacity = '0';

            setTimeout(() => {
                coverImg.src = current.cover;
                coverImg.alt = current.name;
                titleDiv.textContent = current.name;
                coverImg.style.opacity = '1';
            }, 150);
        }
    }

    /**
     * Выбрать текущую пластинку
     */
    selectCurrent() {
        const selected = this.records[this.currentIndex];
        console.log(`[VinylSelector] Selected: ${selected.name}`);

        // Вызываем callback с выбранной пластинкой
        if (this.onSelectCallback) {
            this.onSelectCallback(selected);
        }
    }
}
