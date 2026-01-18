import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import PreloadScene from './scenes/PreloadScene';
import GameScene from './scenes/GameScene';
import KitchenScene from './scenes/KitchenScene';
import BathroomScene from './scenes/BathroomScene';
import HallwayScene from './scenes/HallwayScene';
import './components/FinalVideo'; // Регистрирует window.showFinalVideo
import { MainMenu, injectMainMenuStyles } from './components/MainMenu';

// Inject Main Menu CSS
injectMainMenuStyles();

// Global state for game loading
window.gameLoadingState = {
    progress: 0,
    isReady: false,
    waitingForStart: false
};

// Global game stats for final screen
window.gameStats = {
    startTime: null,
    endTime: null
};

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 900,
    parent: 'game-container',
    backgroundColor: '#1a1c2c', // Match menu background
    pixelArt: true,
    roundPixels: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, PreloadScene, GameScene, KitchenScene, BathroomScene, HallwayScene]
};

// Create Main Menu
const mainMenu = new MainMenu(() => {
    // Called when user clicks START and loading is complete
    window.gameLoadingState.waitingForStart = false;
});
mainMenu.create();

// Start game immediately (loads in background)
const game = new Phaser.Game(config);

// ===== ГЛОБАЛЬНЫЙ ВЫХОД В ГЛАВНОЕ МЕНЮ ПО ESCAPE =====
// Позволяет выйти в главное меню из любого места игры
window.addEventListener('keydown', (e) => {
    // Проверяем нажатие Escape
    if (e.key === 'Escape') {
        // Проверяем, что главное меню не показывается
        const mainMenuOverlay = document.querySelector('.main-menu-overlay');
        if (mainMenuOverlay) {
            // Главное меню уже открыто - ничего не делаем
            return;
        }

        // Проверяем, есть ли открытые оверлеи которые должны закрыться первыми
        // Если ConsoleOverlay открыт - он сам обработает Escape
        const consoleOverlay = document.getElementById('console-overlay');
        if (consoleOverlay) {
            // ConsoleOverlay сам обрабатывает Escape
            return;
        }

        // Если есть финальный экран (FinalVideo) или другие оверлеи - перезагружаем страницу
        const finalOverlay = document.querySelector('.final-overlay');
        if (finalOverlay) {
            e.preventDefault();
            window.location.reload();
            return;
        }

        // Для всех остальных случаев - спрашиваем подтверждение и выходим в главное меню
        // Можно просто перезагрузить страницу для возврата в главное меню
        // Не прерываем, если другие компоненты обрабатывают Escape
    }
});
