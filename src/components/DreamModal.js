/**
 * DreamModal - Компонент для механики Сна
 * Отображает видео в облачной рамке, создавая эффект магического видения
 */
export default class DreamModal {
    constructor(onCloseCallback, onVideoEndCallback) {
        this.onCloseCallback = onCloseCallback;
        this.onVideoEndCallback = onVideoEndCallback; // Колбэк при окончании видео
        this.container = null;
        this.videoElement = null;
        this.isOpen = false;

        // Привязываем методы к контексту
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleVideoEnd = this.handleVideoEnd.bind(this);
    }

    /**
     * Открыть окно сна
     */
    open() {
        this.isOpen = true;

        // Скрываем панель чата
        if (window.chatPanel) {
            window.chatPanel.hide();
        }

        // Создаем контейнер
        this.container = document.createElement('div');
        this.container.id = 'dream-modal';
        this.container.className = 'dream-overlay';

        // Создаем содержимое
        this.container.innerHTML = `
            <div class="dream-container">
                <!-- СЛОЙ 2: Видео (z-index: 10) -->
                <video
                    id="dream-video"
                    src="./assets/dream/dream_video.mp4"
                    class="cloud-video"
                    autoplay
                    playsinline
                ></video>

                <!-- СЛОЙ 1: Рамка (z-index: 20) -->
                <img
                    src="./assets/ui/cloud_frame.webp"
                    class="cloud-frame"
                    alt="Cloud Frame"
                />
            </div>

            <!-- Текст-подсказка снизу -->
            <div class="dream-hint">[ ESC ] ПРОСНУТЬСЯ</div>
        `;

        // Добавляем в DOM
        document.body.appendChild(this.container);

        // Получаем ссылку на видео элемент
        this.videoElement = document.getElementById('dream-video');

        // Включаем звук видео
        this.videoElement.muted = false;
        this.videoElement.volume = 0.25; // 25% громкости

        // Настраиваем обработчики событий
        this.setupEventListeners();

        console.log('[DreamModal] Opened');
    }

    /**
     * Закрыть окно сна
     */
    close() {
        // Защита от повторного вызова
        if (!this.isOpen) {
            console.log('[DreamModal] Already closed, ignoring');
            return;
        }

        this.isOpen = false;

        // Останавливаем и очищаем видео
        if (this.videoElement) {
            this.videoElement.removeEventListener('ended', this.handleVideoEnd);
            this.videoElement.pause();
            this.videoElement.currentTime = 0;
            this.videoElement.src = ''; // Освобождаем ресурсы
            this.videoElement = null;
        }

        // Удаляем обработчики с window
        window.removeEventListener('keydown', this.handleKeyDown);

        // Удаляем DOM элемент
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        // Показываем панель чата
        if (window.chatPanel) {
            window.chatPanel.show();
        }

        console.log('[DreamModal] Closed');

        // Вызываем колбэк при закрытии
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
        // Глобальный перехват клавиатуры
        window.addEventListener('keydown', this.handleKeyDown);

        // Обработчик окончания видео
        if (this.videoElement) {
            this.videoElement.addEventListener('ended', this.handleVideoEnd);
        }
    }

    /**
     * Обработка окончания видео
     */
    handleVideoEnd() {
        console.log('[DreamModal] Video ended, closing...');

        // Вызываем колбэк окончания видео (для показа фразы)
        if (this.onVideoEndCallback) {
            this.onVideoEndCallback();
        }

        // Закрываем модалку
        this.close();
    }

    /**
     * Обработка нажатий клавиш
     */
    handleKeyDown(event) {
        // Если окно закрыто, не обрабатываем события
        if (!this.isOpen) {
            return;
        }

        const key = event.key.toLowerCase();

        // Проверяем только Escape
        const isOurKey = key === 'escape';

        if (!isOurKey) {
            return;
        }

        // Останавливаем событие
        event.stopPropagation();
        event.preventDefault();

        console.log(`[DreamModal] Key pressed - key: ${key}`);

        // Закрываем модалку при нажатии Escape
        if (key === 'escape') {
            console.log('[DreamModal] ESC pressed, waking up early...');

            // Вызываем колбэк окончания видео (для показа фразы и озвучки)
            if (this.onVideoEndCallback) {
                this.onVideoEndCallback();
            }

            // Закрываем модалку
            this.close();
        }
    }
}
