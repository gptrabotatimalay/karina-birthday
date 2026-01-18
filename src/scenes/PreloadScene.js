import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Report loading progress to MainMenu
        this.load.on('progress', (value) => {
            if (window.gameLoadingState) {
                window.gameLoadingState.progress = value;
            }
        });

        this.load.on('complete', () => {
            if (window.gameLoadingState) {
                window.gameLoadingState.progress = 1;
                window.gameLoadingState.isReady = true;
            }
        });

        // Background image (готовый арт комнаты)
        this.load.image('room_background', 'assets/room_background.jpeg');

        // Kitchen background
        this.load.image('kitchen_bg', 'assets/kichen_background.png');

        // Bathroom background (вертикальная картинка)
        this.load.image('bathroom_bg', 'assets/bathroom_background.png');

        // Corridor background (вертикальная картинка)
        this.load.image('corridor_bg', 'assets/corridor_background.jpg');

        // Stoyka image for hallway interaction
        this.load.image('stoyka', 'assets/ui/stoyka.png');

        // Cork board background for photo board
        this.load.image('cork_bg', 'assets/ui/cork_bg.png');

        // Cat mask for depth system
        this.load.image('cat_mask', 'assets/ui/cat_mask.png');

        // Предзагрузка всех фотографий для доски воспоминаний
        for (let i = 1; i <= 18; i++) {
            this.load.image(`photo_mem${i}`, `assets/photos/mem${i}.jpeg`);
        }

        console.log('[PreloadScene] Loading background and characters...');

        // Спрайт-листы персонажей (16×32: голова + тело)
        this.load.spritesheet('karina', 'assets/characters/Karina wasd.png', {
            frameWidth: 16,
            frameHeight: 32
        });

        // Анимации ходьбы Карины
        this.load.spritesheet('karina-run', 'assets/characters/Karina run.png', {
            frameWidth: 16,
            frameHeight: 32
        });

        // Даша (сидит на пуфике) - спрайты 32x32
        this.load.spritesheet('dasha', 'assets/characters/Dasha_sit.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // Звуки кошки Рекси
        this.load.audio('purr', 'assets/sounds/purr.mp3');
        this.load.audio('meow_short', 'assets/sounds/meow_short.mp3');
        this.load.audio('meow_long', 'assets/sounds/meow_long.mp3');

        // Звук зевка для механики сна
        this.load.audio('yawn', 'assets/sounds/yawn.mp3');

        // Звук электрического чайника (полный цикл: щелчок -> кипение -> щелчок)
        this.load.audio('kettle_sound', 'assets/sounds/kettle_full.mp3');

        // Голосовая озвучка героини
        this.load.audio('voice_chips', 'assets/sounds/voice_chips.mp3');
        this.load.audio('voice_pickles', 'assets/sounds/voice_pickles.mp3');

        // Озвучка пробуждения после сна (4 варианта)
        this.load.audio('dream_huge', 'assets/sounds/dream_huge.mp3');
        this.load.audio('dream_fat', 'assets/sounds/dream_fat.mp3');
        this.load.audio('dream_world', 'assets/sounds/dream_world.mp3');
        this.load.audio('dream_games', 'assets/sounds/dream_games.mp3');

        // Звуки кормления Рекси
        this.load.audio('pouring', 'assets/sounds/pouring.mp3');
        this.load.audio('voice_feed', 'assets/sounds/voice_feed.mp3');

        // Звук туалета (мем)
        this.load.audio('voice_toilet', 'assets/sounds/voice_toilet.mp3');

        // PES 2026: Аудио комментатора и фон стадиона
        this.load.audio('stadium_crowd', 'assets/sounds/stadium_crowd.mp3');
        this.load.audio('comm_intro', 'assets/sounds/comm_intro.mp3');
        this.load.audio('comm_goal1', 'assets/sounds/comm_goal1.mp3');
        this.load.audio('comm_goal2', 'assets/sounds/comm_goal2.mp3');
        this.load.audio('comm_goal3', 'assets/sounds/comm_goal3.mp3');
        this.load.audio('comm_goal4', 'assets/sounds/comm_goal4.mp3');
        this.load.audio('comm_goal6', 'assets/sounds/comm_goal6.mp3');

        // Обработка ошибок загрузки
        this.load.on('loaderror', (file) => {
            console.warn(`Не удалось загрузить: ${file.key}`);
        });
    }

    create() {
        // Wait for user to click START in MainMenu
        if (window.gameLoadingState && window.gameLoadingState.waitingForStart) {
            // Poll until user clicks start
            const checkStart = () => {
                if (!window.gameLoadingState.waitingForStart) {
                    this.startGame();
                } else {
                    setTimeout(checkStart, 50);
                }
            };
            checkStart();
        } else {
            // User already clicked start, proceed immediately
            this.startGame();
        }
    }

    startGame() {
        // Record game start time
        if (window.gameStats) {
            window.gameStats.startTime = Date.now();
        }
        this.scene.start('GameScene');
    }
}
