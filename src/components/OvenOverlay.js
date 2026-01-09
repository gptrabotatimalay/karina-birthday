/**
 * OvenOverlay - Полноэкранный оверлей для взаимодействия с духовкой
 * Показывает видео готовящейся курочки с красивой рамкой в стиле дверцы духовки
 */
export default class OvenOverlay {
    constructor() {
        this.container = null;
        this.videoElement = null;
        this.onClose = null;
        this.isActive = false;
        this.keyHandler = null;
    }

    /**
     * Открыть оверлей духовки
     * @param {Function} onCloseCallback - Колбэк при закрытии
     */
    open(onCloseCallback) {
        if (this.isActive) return;

        this.isActive = true;
        this.onClose = onCloseCallback;

        this.createContainer();
        this.setupKeyboardListener();
    }

    /**
     * Закрыть оверлей
     */
    close() {
        if (!this.isActive) return;

        this.isActive = false;

        // НЕ останавливаем видео - пусть продолжает играть для плавного перехода
        // Браузер автоматически остановит его при удалении из DOM

        // Удаляем обработчик клавиатуры
        this.removeKeyboardListener();

        // Удаляем контейнер
        if (this.container) {
            this.container.remove();
            this.container = null;
            this.videoElement = null;
        }

        // Вызываем колбэк (возвращаем управление игроку)
        if (this.onClose) {
            this.onClose();
        }
    }

    /**
     * Создать основной контейнер оверлея
     */
    createContainer() {
        // Основной контейнер - полноэкранный черный фон
        this.container = document.createElement('div');
        this.container.id = 'oven-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 100;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Press Start 2P', cursive;
        `;

        // Контейнер для видео с рамкой "духовки"
        const ovenFrame = document.createElement('div');
        ovenFrame.style.cssText = `
            position: relative;
            width: 900px;
            height: 650px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 30px;
            background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
            border: 8px solid #ff6b00;
            border-radius: 12px;
            box-shadow:
                0 0 0 4px #8b4513,
                0 0 0 8px #ff6b00,
                0 0 40px rgba(255, 107, 0, 0.5),
                inset 0 0 30px rgba(0, 0, 0, 0.8);
        `;

        // Внутренняя рамка "стекла духовки"
        const glassFrame = document.createElement('div');
        glassFrame.style.cssText = `
            position: relative;
            width: 100%;
            max-width: 800px;
            height: 500px;
            background: #000000;
            border: 6px solid #4a4a4a;
            border-radius: 8px;
            overflow: hidden;
            box-shadow:
                inset 0 0 20px rgba(255, 107, 0, 0.3),
                0 4px 15px rgba(0, 0, 0, 0.7);
        `;

        // Видео элемент
        this.videoElement = document.createElement('video');
        this.videoElement.src = '/assets/video/oven_chicken.mp4';
        this.videoElement.autoplay = true;
        this.videoElement.loop = true;
        this.videoElement.playsInline = true; // Для мобильных устройств
        this.videoElement.muted = false;
        this.videoElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;

        // Устанавливаем громкость на 50%
        this.videoElement.volume = 0.5;

        // Обработчик для гарантированного зацикливания
        this.videoElement.addEventListener('ended', () => {
            console.log('[OvenOverlay] Video ended, restarting...');
            this.videoElement.currentTime = 0;
            this.videoElement.play();
        });

        // Обработчик ошибок загрузки видео
        this.videoElement.addEventListener('error', (e) => {
            console.error('[OvenOverlay] Video error:', e);
        });

        // Текст подсказки
        const hintText = document.createElement('div');
        hintText.style.cssText = `
            margin-top: 25px;
            color: #ffff00;
            font-size: 16px;
            text-align: center;
            letter-spacing: 2px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            line-height: 1.6;
            font-family: 'Press Start 2P', cursive;
        `;
        hintText.innerHTML = 'М-м-м... Почти готово!<br>[ ESC - ЗАКРЫТЬ ]';

        // Собираем все вместе
        glassFrame.appendChild(this.videoElement);
        ovenFrame.appendChild(glassFrame);
        ovenFrame.appendChild(hintText);
        this.container.appendChild(ovenFrame);
        document.body.appendChild(this.container);

        console.log('[OvenOverlay] Overlay opened');
    }

    /**
     * Настроить обработчик клавиатуры
     */
    setupKeyboardListener() {
        this.keyHandler = (e) => {
            if (!this.isActive) return;

            // Закрытие только на ESC
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            }
        };

        // Используем capture фазу для перехвата событий
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
}
