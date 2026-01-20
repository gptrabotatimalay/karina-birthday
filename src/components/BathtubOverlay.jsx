/**
 * BathtubOverlay - Оверлей наполнения ванны горячей водой
 * Этап 1: Видео на паузе, текст "[ E ] ОТКРЫТЬ КРАН"
 * Этап 2: Видео воспроизводится, текст "Наполняется..."
 * Финал: Текст "Готово! [ ПРОБЕЛ - ЗАКРЫТЬ ]", вызывается onFinish
 */
export default class BathtubOverlay {
    constructor() {
        this.container = null;
        this.video = null;
        this.hintText = null;
        this.onFinish = null;
        this.onClose = null;
        this.isOpen = false;
        this.keyHandler = null;
        this.stage = 'initial'; // 'initial' | 'filling' | 'finished'
    }

    /**
     * Открыть оверлей ванны
     * @param {Function} onFinishCallback - Колбэк при завершении наполнения (ванна горячая)
     * @param {Function} onCloseCallback - Колбэк при закрытии
     */
    open(onFinishCallback, onCloseCallback) {
        if (this.isOpen) return;

        this.isOpen = true;
        this.onFinish = onFinishCallback;
        this.onClose = onCloseCallback;
        this.stage = 'initial';

        // Скрываем панель чата
        if (window.chatPanel) {
            window.chatPanel.hide();
        }

        this.createContainer();
        this.setupKeyboardListener();

        console.log('[BathtubOverlay] Opened - Stage: initial');
    }

    /**
     * Создать UI оверлея
     */
    createContainer() {
        // Основной контейнер - полноэкранный оверлей
        this.container = document.createElement('div');
        this.container.id = 'bathtub-overlay';
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

        // Контейнер для видео
        const videoContainer = document.createElement('div');
        videoContainer.style.cssText = `
            position: relative;
            width: 90vw;
            height: 80vh;
            max-width: 1200px;
            max-height: 800px;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Видео наполнения ванны
        this.video = document.createElement('video');
        this.video.src = './assets/video/bathtub_fill.mp4';
        this.video.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
        `;
        this.video.loop = false;
        this.video.muted = false;
        this.video.controls = false;

        // Останавливаем на первом кадре
        this.video.pause();
        this.video.currentTime = 0;

        // Обработчик окончания видео
        this.video.addEventListener('ended', () => {
            this.onVideoEnded();
        });

        // Текст-подсказка
        this.hintText = document.createElement('div');
        this.hintText.style.cssText = `
            position: absolute;
            bottom: 20px;
            font-size: 16px;
            color: #00ffff;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            padding: 10px 20px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 5px;
        `;
        this.updateHintText();

        // Собираем все вместе
        videoContainer.appendChild(this.video);
        videoContainer.appendChild(this.hintText);
        this.container.appendChild(videoContainer);
        document.body.appendChild(this.container);
    }

    /**
     * Обновить текст подсказки в зависимости от этапа
     */
    updateHintText() {
        if (!this.hintText) return;

        switch (this.stage) {
            case 'initial':
                this.hintText.textContent = '[ E ] ОТКРЫТЬ КРАН';
                break;
            case 'filling':
                this.hintText.textContent = 'Наполняется...';
                break;
            case 'finished':
                this.hintText.textContent = 'Готово! [ ПРОБЕЛ - ЗАКРЫТЬ ]';
                this.hintText.style.color = '#00ff00';
                break;
        }
    }

    /**
     * Обработчик окончания видео
     */
    onVideoEnded() {
        console.log('[BathtubOverlay] Video ended - bath is now hot!');
        this.stage = 'finished';
        this.updateHintText();

        // Вызываем колбэк завершения (ванна стала горячей)
        if (this.onFinish) {
            this.onFinish();
        }
    }

    /**
     * Настроить обработчик клавиатуры
     */
    setupKeyboardListener() {
        this.keyHandler = (e) => {
            if (!this.isOpen) return;

            // E - открыть кран (только на начальном этапе)
            if ((e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') && this.stage === 'initial') {
                e.preventDefault();
                e.stopPropagation();
                this.startFilling();
            }

            // ПРОБЕЛ - закрыть (только когда видео закончилось)
            if (e.key === ' ' && this.stage === 'finished') {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            }

            // ESC - закрыть в любой момент
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            }
        };

        window.addEventListener('keydown', this.keyHandler, { capture: true });
    }

    /**
     * Начать наполнение ванны (запустить видео)
     */
    startFilling() {
        console.log('[BathtubOverlay] Starting to fill the bathtub...');
        this.stage = 'filling';
        this.updateHintText();

        // Запускаем видео
        if (this.video) {
            this.video.play();
        }
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

        // Останавливаем видео
        if (this.video) {
            this.video.pause();
            this.video.removeEventListener('ended', this.onVideoEnded);
        }

        // Удаляем контейнер
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        // Показываем панель чата
        if (window.chatPanel) {
            window.chatPanel.show();
        }

        console.log('[BathtubOverlay] Closed');

        // Вызываем колбэк закрытия
        if (this.onClose) {
            this.onClose();
        }
    }
}
