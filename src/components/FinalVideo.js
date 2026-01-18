/**
 * FinalVideo - Торжественная игровая кат-сцена с финальным видеопоздравлением
 * Плавное появление + золотая рамка + мигающий текст
 * После видео показывается финальный экран с поздравлением и статистикой
 */
export default class FinalVideo {
    constructor() {
        this.overlay = null;
        this.video = null;
        this.injectStyles();
    }

    /**
     * Внедряем CSS стили для кат-сцены
     */
    injectStyles() {
        // Проверяем, не добавлены ли уже стили
        if (document.getElementById('final-video-styles')) return;

        const style = document.createElement('style');
        style.id = 'final-video-styles';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

            .final-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                width: 100vw;
                height: 100vh;
                /* Космический градиентный фон как в главном меню */
                background: radial-gradient(ellipse at center, #2a2d4e 0%, #1a1c2c 70%, #0d0e1a 100%);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 1.5s ease-in-out;
                overflow: hidden;
            }

            .final-overlay.visible {
                opacity: 1;
            }

            /* Мерцающие звёзды на фоне */
            .final-stars {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }

            .final-star {
                position: absolute;
                width: 3px;
                height: 3px;
                background: #fff;
                border-radius: 50%;
                animation: starTwinkle 2s ease-in-out infinite;
            }

            @keyframes starTwinkle {
                0%, 100% { opacity: 0.2; transform: scale(1); }
                50% { opacity: 0.9; transform: scale(1.3); }
            }

            .video-frame {
                position: relative;
                display: inline-block;
                z-index: 10;

                /* Белая рамка в космическом стиле */
                border: 4px solid rgba(255, 255, 255, 0.9);
                outline: none;

                /* Статичное свечение без анимации */
                box-shadow:
                    0 0 15px rgba(255, 255, 255, 0.3),
                    0 0 30px rgba(136, 146, 176, 0.2);

                /* Острые углы для пиксель-арт стиля */
                border-radius: 0;
            }

            @keyframes frameGlow {
                from {
                    box-shadow:
                        0 0 15px rgba(255, 255, 255, 0.3),
                        0 0 30px rgba(136, 146, 176, 0.2),
                        inset 0 0 10px rgba(255, 255, 255, 0.05);
                }
                to {
                    box-shadow:
                        0 0 20px rgba(255, 255, 255, 0.4),
                        0 0 40px rgba(136, 146, 176, 0.3),
                        inset 0 0 15px rgba(255, 255, 255, 0.08);
                }
            }

            .video-frame video {
                display: block;
                max-width: 85vw;
                max-height: 65vh;
                object-fit: contain;
                background-color: #0d0e1a;
            }

            .final-text {
                margin-top: 30px;
                font-family: 'Press Start 2P', cursive;
                font-size: clamp(16px, 3vw, 32px);
                color: #ffffff;
                text-align: center;
                text-shadow:
                    0 0 10px rgba(255, 255, 255, 0.5),
                    0 0 20px rgba(136, 146, 176, 0.4),
                    2px 2px 0 #2a2d4e;
                z-index: 10;

                /* Мягкая анимация пульсации */
                animation: textPulse 3s ease-in-out infinite;

                /* Предотвращаем выделение текста */
                user-select: none;
            }

            @keyframes textPulse {
                0%, 100% {
                    opacity: 1;
                    text-shadow:
                        0 0 10px rgba(255, 255, 255, 0.5),
                        0 0 20px rgba(136, 146, 176, 0.4),
                        2px 2px 0 #2a2d4e;
                }
                50% {
                    opacity: 0.85;
                    text-shadow:
                        0 0 15px rgba(255, 255, 255, 0.6),
                        0 0 30px rgba(136, 146, 176, 0.5),
                        2px 2px 0 #2a2d4e;
                }
            }

            /* Декоративные звёздочки по углам рамки */
            .video-frame::before,
            .video-frame::after {
                content: '✦';
                position: absolute;
                font-size: 18px;
                color: rgba(255, 255, 255, 0.8);
                text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
                animation: cornerStarPulse 2s ease-in-out infinite;
            }

            .video-frame::before {
                top: -18px;
                left: -18px;
            }

            .video-frame::after {
                bottom: -18px;
                right: -18px;
            }

            @keyframes cornerStarPulse {
                0%, 100% { opacity: 0.6; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
            }

            /* Дополнительные звёзды через JS */
            .corner-star {
                position: absolute;
                font-size: 18px;
                color: rgba(255, 255, 255, 0.8);
                text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
                animation: cornerStarPulse 2s ease-in-out infinite reverse;
            }

            .corner-star.top-right {
                top: -18px;
                right: -18px;
            }

            .corner-star.bottom-left {
                bottom: -18px;
                left: -18px;
            }

            /* Scanlines эффект как в главном меню */
            .final-scanlines {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: repeating-linear-gradient(
                    0deg,
                    rgba(0, 0, 0, 0.1),
                    rgba(0, 0, 0, 0.1) 1px,
                    transparent 1px,
                    transparent 2px
                );
                pointer-events: none;
                z-index: 100;
            }

            /* ===== FINAL SCREEN STYLES ===== */
            .final-screen-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 30px;
                z-index: 10;
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 1s ease, transform 1s ease;
            }

            .final-screen-content.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .final-congrats-title {
                font-family: 'Press Start 2P', cursive;
                font-size: clamp(24px, 4vw, 48px);
                color: #ffd700;
                text-align: center;
                text-shadow:
                    4px 4px 0 #b8860b,
                    8px 8px 0 #8b6914,
                    0 0 30px rgba(255, 215, 0, 0.5);
                margin: 0;
                animation: titleGlow 4s ease-in-out infinite;
            }

            @keyframes titleGlow {
                0%, 100% {
                    text-shadow:
                        4px 4px 0 #b8860b,
                        8px 8px 0 #8b6914,
                        0 0 30px rgba(255, 215, 0, 0.4);
                }
                50% {
                    text-shadow:
                        4px 4px 0 #b8860b,
                        8px 8px 0 #8b6914,
                        0 0 50px rgba(255, 215, 0, 0.7);
                }
            }

            .final-congrats-subtitle {
                font-family: 'Press Start 2P', cursive;
                font-size: clamp(14px, 2vw, 24px);
                color: #ffffff;
                text-align: center;
                text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                margin: 0;
            }

            .final-stats-box {
                background: rgba(0, 0, 0, 0.4);
                border: 4px solid rgba(255, 255, 255, 0.6);
                padding: 30px 50px;
                text-align: center;
            }

            .final-stats-title {
                font-family: 'Press Start 2P', cursive;
                font-size: clamp(12px, 1.5vw, 18px);
                color: #8892b0;
                margin: 0 0 20px 0;
                text-transform: uppercase;
                letter-spacing: 4px;
            }

            .final-stats-time {
                font-family: 'Press Start 2P', cursive;
                font-size: clamp(20px, 3vw, 36px);
                color: #00e436;
                text-shadow: 0 0 15px rgba(0, 228, 54, 0.6);
                margin: 0;
            }

            .final-menu-btn {
                font-family: 'Press Start 2P', monospace;
                font-size: clamp(14px, 2vw, 20px);
                color: #fff;
                background: rgba(255, 255, 255, 0.1);
                border: 4px solid #fff;
                padding: 18px 40px;
                cursor: pointer;
                transition: all 0.3s ease;
                border-radius: 0;
                box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
                margin-top: 20px;
            }

            .final-menu-btn:hover {
                transform: scale(1.08);
                box-shadow: 0 0 35px rgba(255, 255, 255, 0.7);
                background: rgba(255, 255, 255, 0.2);
            }

            .final-menu-btn:active {
                transform: scale(1.03);
            }

            .final-menu-btn .btn-bracket {
                color: #00e436;
            }

            .final-footer-text {
                font-family: 'Press Start 2P', cursive;
                font-size: clamp(10px, 1.2vw, 14px);
                color: #5a5d7a;
                margin-top: 30px;
            }

            .final-footer-text .heart {
                color: #ff6b6b;
                display: inline-block;
                animation: heartBeat 2s ease-in-out infinite;
            }

            @keyframes heartBeat {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.15); opacity: 1; }
            }

            /* Hide video container class */
            .video-container-hidden {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Показать финальное видео
     */
    show() {
        // Record end time
        if (window.gameStats) {
            window.gameStats.endTime = Date.now();
        }

        // Создаем оверлей
        this.overlay = document.createElement('div');
        this.overlay.className = 'final-overlay';

        // Создаём контейнер для звёзд
        const starsContainer = document.createElement('div');
        starsContainer.className = 'final-stars';
        this.createStars(starsContainer, 60);
        this.overlay.appendChild(starsContainer);

        // Контейнер для видео (будет скрыт после окончания)
        this.videoContainer = document.createElement('div');
        this.videoContainer.className = 'video-container';

        // Создаем рамку для видео
        const videoFrame = document.createElement('div');
        videoFrame.className = 'video-frame';

        // Создаем видео (без controls!)
        this.video = document.createElement('video');
        this.video.src = '/assets/video/final_greeting.mp4';
        this.video.autoplay = true;
        this.video.playsInline = true;
        this.video.muted = false;

        // Добавляем дополнительные звёздочки по углам
        const starTopRight = document.createElement('span');
        starTopRight.className = 'corner-star top-right';
        starTopRight.textContent = '✦';

        const starBottomLeft = document.createElement('span');
        starBottomLeft.className = 'corner-star bottom-left';
        starBottomLeft.textContent = '✦';

        // Собираем структуру рамки
        videoFrame.appendChild(this.video);
        videoFrame.appendChild(starTopRight);
        videoFrame.appendChild(starBottomLeft);

        // Создаем текст поздравления под видео
        const finalText = document.createElement('div');
        finalText.className = 'final-text';
        finalText.textContent = 'С ДНЁМ РОЖДЕНИЯ, КАРИНА!';

        // Добавляем в контейнер видео
        this.videoContainer.appendChild(videoFrame);
        this.videoContainer.appendChild(finalText);

        // Создаём scanlines эффект
        const scanlines = document.createElement('div');
        scanlines.className = 'final-scanlines';

        // Собираем всё вместе
        this.overlay.appendChild(this.videoContainer);
        this.overlay.appendChild(scanlines);

        // Добавляем в DOM
        document.body.appendChild(this.overlay);

        // Запускаем плавное появление
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.overlay.classList.add('visible');
            });
        });

        // Слушаем окончание видео
        this.video.addEventListener('ended', () => {
            this.showFinalScreen();
        });

        // Fallback: если видео не загрузилось, показываем финальный экран через 5 сек
        this.video.addEventListener('error', () => {
            console.warn('[FinalVideo] Video failed to load, showing final screen');
            setTimeout(() => this.showFinalScreen(), 2000);
        });

        console.log('[FinalVideo] Cinematic cutscene started');
    }

    /**
     * Показать финальный экран после видео
     */
    showFinalScreen() {
        // Скрываем видео контейнер
        this.videoContainer.classList.add('video-container-hidden');

        // Создаем контент финального экрана
        const finalContent = document.createElement('div');
        finalContent.className = 'final-screen-content';

        // Заголовок поздравления
        const congratsTitle = document.createElement('h1');
        congratsTitle.className = 'final-congrats-title';
        congratsTitle.textContent = 'ПОЗДРАВЛЯЕМ!';

        const congratsSubtitle = document.createElement('p');
        congratsSubtitle.className = 'final-congrats-subtitle';
        congratsSubtitle.textContent = 'Ты прошла игру!';

        // Блок статистики
        const statsBox = document.createElement('div');
        statsBox.className = 'final-stats-box';

        const statsTitle = document.createElement('p');
        statsTitle.className = 'final-stats-title';
        statsTitle.textContent = 'Время прохождения';

        const statsTime = document.createElement('p');
        statsTime.className = 'final-stats-time';
        statsTime.textContent = this.formatPlayTime();

        statsBox.appendChild(statsTitle);
        statsBox.appendChild(statsTime);

        // Кнопка возврата в меню
        const menuBtn = document.createElement('button');
        menuBtn.className = 'final-menu-btn';
        menuBtn.innerHTML = '<span class="btn-bracket">[</span> НАЧАТЬ ЗАНОВО <span class="btn-bracket">]</span>';
        menuBtn.addEventListener('click', () => {
            window.location.reload();
        });

        // Футер
        const footer = document.createElement('p');
        footer.className = 'final-footer-text';
        footer.innerHTML = 'Создано с <span class="heart">❤️</span> для Карины';

        // Собираем финальный экран
        finalContent.appendChild(congratsTitle);
        finalContent.appendChild(congratsSubtitle);
        finalContent.appendChild(statsBox);
        finalContent.appendChild(menuBtn);
        finalContent.appendChild(footer);

        // Вставляем перед scanlines
        const scanlines = this.overlay.querySelector('.final-scanlines');
        this.overlay.insertBefore(finalContent, scanlines);

        // Анимируем появление
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                finalContent.classList.add('visible');
            });
        });

        console.log('[FinalVideo] Final screen displayed');
    }

    /**
     * Форматирует время прохождения игры
     */
    formatPlayTime() {
        if (!window.gameStats || !window.gameStats.startTime || !window.gameStats.endTime) {
            return '??:??';
        }

        const elapsed = window.gameStats.endTime - window.gameStats.startTime;
        const totalSeconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const minStr = minutes.toString().padStart(2, '0');
        const secStr = seconds.toString().padStart(2, '0');

        return `${minStr}:${secStr}`;
    }

    /**
     * Создаём мерцающие звёзды
     */
    createStars(container, count) {
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'final-star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 3}s`;
            star.style.animationDuration = `${2 + Math.random() * 2}s`;
            container.appendChild(star);
        }
    }

    /**
     * Скрыть финальное видео (если понадобится)
     */
    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('visible');

            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                    this.overlay = null;
                    this.video = null;
                }
            }, 1500);
        }
    }
}

// Глобальная функция для вызова из Phaser сцены
window.showFinalVideo = function() {
    const finalVideo = new FinalVideo();
    finalVideo.show();
    return finalVideo;
};
