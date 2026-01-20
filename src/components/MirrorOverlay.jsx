/**
 * MirrorOverlay - Оверлей зеркала в ванной
 * Если isSteamy === false: Показывает чистое зеркало (mirror_clean.png)
 * Если isSteamy === true: Показывает запотевшее зеркало с кодом 1902 (mirror_foggy.png)
 */
export default class MirrorOverlay {
    constructor() {
        this.container = null;
        this.onClose = null;
        this.isOpen = false;
        this.keyHandler = null;
        this.isSteamy = false;
    }

    /**
     * Открыть оверлей зеркала
     * @param {Boolean} isSteamy - Запотело ли зеркало (после наполнения ванны)
     * @param {Function} onCloseCallback - Колбэк при закрытии
     */
    open(isSteamy, onCloseCallback) {
        if (this.isOpen) return;

        this.isOpen = true;
        this.isSteamy = isSteamy;
        this.onClose = onCloseCallback;

        // Скрываем панель чата
        if (window.chatPanel) {
            window.chatPanel.hide();
        }

        this.createContainer();
        this.setupKeyboardListener();

        console.log(`[MirrorOverlay] Opened - Steamy: ${isSteamy}`);
    }

    /**
     * Создать UI оверлея
     */
    createContainer() {
        // Основной контейнер - полноэкранный оверлей
        this.container = document.createElement('div');
        this.container.id = 'mirror-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            z-index: 100;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: 'Press Start 2P', cursive;
        `;

        // Контейнер для изображения зеркала
        const mirrorContainer = document.createElement('div');
        mirrorContainer.style.cssText = `
            position: relative;
            width: 90vw;
            height: 90vh;
            max-width: 1200px;
            max-height: 900px;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Изображение зеркала (чистое или запотевшее)
        const mirrorImage = document.createElement('img');
        mirrorImage.src = this.isSteamy
            ? './assets/ui/mirror_foggy.png'
            : './assets/ui/mirror_clean.png';
        mirrorImage.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            image-rendering: pixelated;
        `;

        // Текст-подсказка (зависит от состояния)
        const hintText = document.createElement('div');
        hintText.style.cssText = `
            position: absolute;
            bottom: 20px;
            font-size: 14px;
            color: ${this.isSteamy ? '#00ff00' : '#ffffff'};
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            padding: 10px 20px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 5px;
            max-width: 80%;
        `;

        if (this.isSteamy) {
            hintText.textContent = 'Ого! На стекле проступили цифры...';
        } else {
            hintText.textContent = 'Я выгляжу отлично!';
        }

        // Инструкция закрытия
        const exitHint = document.createElement('div');
        exitHint.style.cssText = `
            position: absolute;
            bottom: 60px;
            font-size: 12px;
            color: #aaaaaa;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        `;
        exitHint.textContent = '[E] или [ESC] - закрыть';

        // Собираем все вместе
        mirrorContainer.appendChild(mirrorImage);
        mirrorContainer.appendChild(hintText);
        mirrorContainer.appendChild(exitHint);
        this.container.appendChild(mirrorContainer);
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

        console.log('[MirrorOverlay] Closed');

        // Вызываем колбэк
        if (this.onClose) {
            this.onClose();
        }
    }
}
