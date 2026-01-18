/**
 * MainMenu - Retro-styled main menu component (Dendy/Sega style)
 * Shows before game starts with animated loading bar
 */

export class MainMenu {
    constructor(onGameStart) {
        this.onGameStart = onGameStart;
        this.isLoading = false;
        this.progress = 0;
        this.overlay = null;
        this.progressBar = null;
        this.progressFill = null;
        this.startButton = null;
        this.loadingContainer = null;
        this.animationFrame = null;
    }

    create() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'main-menu-overlay';
        this.overlay.innerHTML = `
            <div class="main-menu-container">
                <div class="main-menu-stars"></div>

                <div class="main-menu-content">
                    <div class="main-menu-title-wrapper">
                        <h1 class="main-menu-title title-first">ПРИКЛЮЧЕНИЕ</h1>
                        <h1 class="main-menu-title title-second">КАРИНЫ</h1>
                    </div>

                    <p class="main-menu-subtitle">Пиксельный квест 2026</p>

                    <div class="main-menu-button-container">
                        <button class="main-menu-start-btn">
                            <span class="btn-bracket">[</span>
                            <span class="btn-text">НАЧАТЬ ИГРУ</span>
                            <span class="btn-bracket">]</span>
                        </button>
                        <p class="press-space-hint">- НАЖМИ ПРОБЕЛ -</p>
                    </div>

                    <div class="main-menu-loading-container" style="display: none;">
                        <p class="loading-text">ЗАГРУЗКА...</p>
                        <div class="main-menu-progress-bar">
                            <div class="main-menu-progress-fill"></div>
                        </div>
                        <p class="loading-percent">0%</p>
                    </div>
                </div>

                <footer class="main-menu-footer">
                    Создано с <span class="heart">❤️</span> от Timalay
                </footer>

                <div class="main-menu-scanlines"></div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Cache elements
        this.startButton = this.overlay.querySelector('.main-menu-start-btn');
        this.loadingContainer = this.overlay.querySelector('.main-menu-loading-container');
        this.buttonContainer = this.overlay.querySelector('.main-menu-button-container');
        this.progressFill = this.overlay.querySelector('.main-menu-progress-fill');
        this.progressText = this.overlay.querySelector('.loading-percent');

        // Add event listeners
        this.startButton.addEventListener('click', () => this.handleStart());

        // Keyboard listener for Space
        this.handleKeyDown = (e) => {
            if (e.code === 'Space' && !this.isLoading) {
                e.preventDefault();
                this.handleStart();
            }
        };
        document.addEventListener('keydown', this.handleKeyDown);

        // Create animated stars
        this.createStars();
    }

    createStars() {
        const starsContainer = this.overlay.querySelector('.main-menu-stars');
        const starCount = 50;

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 3}s`;
            star.style.animationDuration = `${2 + Math.random() * 3}s`;
            starsContainer.appendChild(star);
        }
    }

    handleStart() {
        if (this.isLoading) return;

        this.isLoading = true;

        // Mark that we're waiting for start (game will wait for this)
        if (window.gameLoadingState) {
            window.gameLoadingState.waitingForStart = true;
        }

        // Hide button, show loading bar
        this.buttonContainer.style.display = 'none';
        this.loadingContainer.style.display = 'flex';

        // Start tracking real loading progress
        this.trackLoadingProgress();
    }

    trackLoadingProgress() {
        const minDuration = 1500; // Minimum 1.5 seconds for smooth animation
        const startTime = Date.now();
        let displayProgress = 0;

        const animate = () => {
            const state = window.gameLoadingState || { progress: 0, isReady: false };
            const realProgress = state.progress * 100;
            const elapsed = Date.now() - startTime;

            // Calculate smooth progress based on time and real progress
            if (state.isReady) {
                // Game loaded - smoothly animate to 100%
                const timeProgress = Math.min(100, (elapsed / minDuration) * 100);
                displayProgress = Math.max(displayProgress, Math.min(100, timeProgress));
            } else {
                // Still loading - follow real progress but smooth it
                const targetProgress = realProgress;
                displayProgress += (targetProgress - displayProgress) * 0.1;
            }

            // Update progress bar
            this.progressFill.style.width = `${displayProgress}%`;
            this.progressText.textContent = `${Math.floor(displayProgress)}%`;

            // Check if we're done (both loaded and animation complete)
            if (state.isReady && displayProgress >= 99) {
                // Ensure we show 100%
                this.progressFill.style.width = '100%';
                this.progressText.textContent = '100%';
                // Small delay before transition
                setTimeout(() => this.completeLoading(), 300);
            } else {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    completeLoading() {
        // Fade out overlay
        this.overlay.classList.add('fade-out');

        setTimeout(() => {
            this.destroy();
            if (this.onGameStart) {
                this.onGameStart();
            }
        }, 500);
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (this.handleKeyDown) {
            document.removeEventListener('keydown', this.handleKeyDown);
            this.handleKeyDown = null;
        }
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
            this.overlay = null;
        }
    }
}

// CSS styles for Main Menu
export const mainMenuStyles = `
/* ===== MAIN MENU STYLES ===== */
.main-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #1a1c2c;
    transition: opacity 0.5s ease;
}

.main-menu-overlay.fade-out {
    opacity: 0;
}

.main-menu-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: radial-gradient(ellipse at center, #2a2d4e 0%, #1a1c2c 70%, #0d0e1a 100%);
    overflow: hidden;
}

/* Animated stars background */
.main-menu-stars {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.star {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #fff;
    animation: starTwinkle 2s ease-in-out infinite;
}

@keyframes starTwinkle {
    0%, 100% { opacity: 0.2; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.2); }
}

/* Scanlines effect */
.main-menu-scanlines {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0.15) 1px,
        transparent 1px,
        transparent 2px
    );
    pointer-events: none;
    z-index: 100;
}

/* Content */
.main-menu-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
    z-index: 10;
}

/* Title */
.main-menu-title-wrapper {
    text-align: center;
}

.main-menu-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 48px;
    color: #ffd700;
    text-shadow:
        4px 4px 0 #b8860b,
        8px 8px 0 #8b6914,
        0 0 30px rgba(255, 215, 0, 0.4),
        0 0 60px rgba(255, 215, 0, 0.2);
    letter-spacing: 4px;
    margin: 0;
    animation: titleGlow 4s ease-in-out infinite;
}

.main-menu-title.title-first {
    font-size: 32px;
}

.main-menu-title.title-second {
    font-size: 48px;
    margin-top: 10px;
}

@keyframes titleGlow {
    0%, 100% {
        text-shadow:
            4px 4px 0 #b8860b,
            8px 8px 0 #8b6914,
            0 0 30px rgba(255, 215, 0, 0.4),
            0 0 60px rgba(255, 215, 0, 0.2);
    }
    50% {
        text-shadow:
            4px 4px 0 #b8860b,
            8px 8px 0 #8b6914,
            0 0 50px rgba(255, 215, 0, 0.6),
            0 0 90px rgba(255, 215, 0, 0.35);
    }
}

/* Subtitle */
.main-menu-subtitle {
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    color: #8892b0;
    letter-spacing: 6px;
    text-transform: uppercase;
    margin: 0;
}

/* Start Button */
.main-menu-button-container {
    margin-top: 40px;
}

.main-menu-start-btn {
    font-family: 'Press Start 2P', monospace;
    font-size: 24px;
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    border: 4px solid #fff;
    padding: 20px 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    border-radius: 0;
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
}

.main-menu-start-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 0 40px rgba(255, 255, 255, 0.7);
}

.main-menu-start-btn:active {
    transform: scale(1.03);
}

.btn-bracket {
    color: #00e436;
}

.btn-text {
    margin: 0 10px;
}

.press-space-hint {
    font-family: 'Press Start 2P', monospace;
    font-size: 14px;
    color: #8892b0;
    margin: 20px 0 0 0;
    text-align: center;
    animation: pressSpacePulse 3s ease-in-out infinite;
}

@keyframes pressSpacePulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
}

/* Loading Container */
.main-menu-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin-top: 40px;
}

.loading-text {
    font-family: 'Press Start 2P', monospace;
    font-size: 18px;
    color: #fff;
    margin: 0;
    animation: loadingBlink 1s ease-in-out infinite;
}

@keyframes loadingBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Progress Bar */
.main-menu-progress-bar {
    width: 400px;
    height: 30px;
    background: #0d0e1a;
    border: 4px solid #fff;
    border-radius: 0;
    overflow: hidden;
    position: relative;
}

.main-menu-progress-fill {
    height: 100%;
    width: 0%;
    background: #00e436;
    transition: width 0.1s linear;
    box-shadow:
        0 0 10px rgba(0, 228, 54, 0.8),
        inset 0 0 10px rgba(255, 255, 255, 0.3);
    position: relative;
}

.main-menu-progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
        90deg,
        transparent,
        transparent 8px,
        rgba(0, 0, 0, 0.2) 8px,
        rgba(0, 0, 0, 0.2) 16px
    );
}

.loading-percent {
    font-family: 'Press Start 2P', monospace;
    font-size: 16px;
    color: #00e436;
    margin: 0;
    text-shadow: 0 0 10px rgba(0, 228, 54, 0.8);
}

/* Footer */
.main-menu-footer {
    position: absolute;
    bottom: 40px;
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    color: #5a5d7a;
    z-index: 10;
}

.main-menu-footer .heart {
    color: #ff6b6b;
    display: inline-block;
    animation: heartBeat 2s ease-in-out infinite;
}

@keyframes heartBeat {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.15); opacity: 1; }
}
`;

// Function to inject styles
export function injectMainMenuStyles() {
    if (document.getElementById('main-menu-styles')) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'main-menu-styles';
    styleElement.textContent = mainMenuStyles;
    document.head.appendChild(styleElement);
}
