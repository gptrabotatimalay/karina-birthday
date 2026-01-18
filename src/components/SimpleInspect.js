/**
 * SimpleInspect - Компонент для осмотра объектов в пиксельном стиле
 * Полноэкранный overlay с картинкой и текстом в стиле "полароид"
 */
export default class SimpleInspect {
    constructor(options = {}) {
        this.imageSrc = options.imageSrc || '';
        this.text = options.text || '';
        this.onClose = options.onClose || (() => {});

        this.container = null;
        this.isOpen = false;
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Открыть окно осмотра
     */
    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        // Скрываем панель чата
        if (window.chatPanel) {
            window.chatPanel.hide();
        }

        // Создаем DOM-контейнер
        this.container = document.createElement('div');
        this.container.id = 'simple-inspect-overlay';
        this.container.innerHTML = this.createHTML();

        // Добавляем стили
        this.addStyles();

        // Добавляем в DOM
        document.body.appendChild(this.container);

        // Анимация появления
        requestAnimationFrame(() => {
            this.container.style.opacity = '1';
        });

        // Слушаем клавиши
        document.addEventListener('keydown', this.boundHandleKeyDown);

        console.log('[SimpleInspect] Opened');
    }

    /**
     * Закрыть окно осмотра
     */
    close() {
        if (!this.isOpen) return;
        this.isOpen = false;

        // Убираем слушатель
        document.removeEventListener('keydown', this.boundHandleKeyDown);

        // Показываем панель чата
        if (window.chatPanel) {
            window.chatPanel.show();
        }

        // Анимация исчезновения
        if (this.container) {
            this.container.style.opacity = '0';

            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
                this.container = null;
                this.onClose();
            }, 300);
        }

        console.log('[SimpleInspect] Closed');
    }

    /**
     * Обработка нажатий клавиш
     */
    handleKeyDown(event) {
        if (event.code === 'Space' || event.code === 'KeyE' || event.code === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.close();
        }
    }

    /**
     * Создание HTML-разметки
     */
    createHTML() {
        return `
            <div class="inspect-backdrop">
                <div class="inspect-content">
                    <div class="inspect-polaroid">
                        <img src="${this.imageSrc}" alt="Осмотр" class="inspect-image" />
                    </div>
                    <div class="inspect-text">${this.text}</div>
                </div>
                <div class="inspect-hint">[ ПРОБЕЛ ] ЗАКРЫТЬ</div>
            </div>
        `;
    }

    /**
     * Добавление стилей
     */
    addStyles() {
        // Проверяем, не добавлены ли уже стили
        if (document.getElementById('simple-inspect-styles')) return;

        const style = document.createElement('style');
        style.id = 'simple-inspect-styles';
        style.textContent = `
            #simple-inspect-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: auto;
            }

            .inspect-backdrop {
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.92);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
            }

            .inspect-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 24px;
                max-width: 90%;
                max-height: 80%;
            }

            .inspect-polaroid {
                background: transparent;
                padding: 0;
            }

            .inspect-image {
                display: block;
                max-width: 6000px;
                max-height: 480px;
                width: auto;
                height: auto;
                image-rendering: pixelated;
                image-rendering: crisp-edges;
                border: 6px solid #000000;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            }

            .inspect-text {
                font-family: 'Press Start 2P', monospace;
                font-size: 16px;
                color: #fffacd;
                text-align: center;
                text-shadow:
                    2px 2px 0 #000000,
                    -1px -1px 0 #000000,
                    1px -1px 0 #000000,
                    -1px 1px 0 #000000;
                line-height: 1.8;
                max-width: 600px;
            }

            .inspect-hint {
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
                color: #888888;
                text-shadow: 1px 1px 0 #000000;
                animation: blink 1.5s infinite;
            }

            @keyframes blink {
                0%, 50%, 100% { opacity: 1; }
                25%, 75% { opacity: 0.5; }
            }

            /* Адаптация для маленьких экранов */
            @media (max-width: 768px) {
                .inspect-image {
                    max-width: 330px;
                    max-height: 275px;
                }

                .inspect-text {
                    font-size: 12px;
                }

                .inspect-hint {
                    font-size: 8px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
