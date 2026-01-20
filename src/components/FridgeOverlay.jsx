/**
 * FridgeOverlay - Оверлей холодильника с магнитиками-городами
 * Улика: Ровно 3 города (цифра 3 для кода ванной)
 * Магнитики: Москва 🏛️, Париж 🗼, Токио 🗾
 */
export default class FridgeOverlay {
    constructor() {
        this.container = null;
        this.onClose = null;
        this.isOpen = false;
        this.keyHandler = null;
    }

    /**
     * Открыть оверлей холодильника
     * @param {Function} onCloseCallback - Колбэк при закрытии
     */
    open(onCloseCallback) {
        if (this.isOpen) return;

        this.isOpen = true;
        this.onClose = onCloseCallback;

        // Скрываем панель чата
        if (window.chatPanel) {
            window.chatPanel.hide();
        }

        this.createContainer();
        this.setupKeyboardListener();

        console.log('[FridgeOverlay] Opened');
    }

    /**
     * Создать UI оверлея
     */
    createContainer() {
        // Основной контейнер - полноэкранный оверлей
        this.container = document.createElement('div');
        this.container.id = 'fridge-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 100;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: 'Press Start 2P', cursive;
        `;

        // Контейнер для изображения холодильника
        const fridgeContainer = document.createElement('div');
        fridgeContainer.style.cssText = `
            position: relative;
            width: 90vw;
            height: 90vh;
            max-width: 1200px;
            max-height: 900px;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Изображение холодильника
        const fridgeImage = document.createElement('img');
        fridgeImage.src = '/assets/ui/fridge_zoom.webp';
        fridgeImage.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            image-rendering: pixelated;
        `;

        // Инструкция закрытия
        const exitHint = document.createElement('div');
        exitHint.style.cssText = `
            position: absolute;
            bottom: 20px;
            font-size: 14px;
            color: #ffffff;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        `;
        exitHint.textContent = 'Нажми [E] или [ESC] чтобы закрыть';

        // Собираем все вместе
        fridgeContainer.appendChild(fridgeImage);
        this.container.appendChild(fridgeContainer);
        this.container.appendChild(exitHint);
        document.body.appendChild(this.container);
    }

    /**
     * Настроить обработчик клавиатуры
     */
    setupKeyboardListener() {
        this.keyHandler = (e) => {
            if (!this.isOpen) return;

            // E или ESC - закрыть
            if (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У' || e.key === 'Escape') {
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
     * Закрыть оверлей
     */
    close() {
        if (!this.isOpen) return;

        this.isOpen = false;

        // Удаляем обработчик клавиш
        this.removeKeyboardListener();

        // Удаляем контейнер
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        // Показываем панель чата
        if (window.chatPanel) {
            window.chatPanel.show();
        }

        console.log('[FridgeOverlay] Closed');

        // Вызываем колбэк
        if (this.onClose) {
            this.onClose();
        }
    }
}
