import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Текст загрузки ассетов
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 100,
            text: 'Karina\'s RPG Quest\nЗагрузка ассетов...',
            style: {
                font: 'bold 28px Arial',
                fill: '#ffffff',
                align: 'center'
            }
        });
        loadingText.setOrigin(0.5);

        // Background image (готовый арт комнаты)
        this.load.image('room_background', 'assets/room_background.jpeg');

        // Kitchen background
        this.load.image('kitchen_bg', 'assets/kichen_background.png');

        // Bathroom background (вертикальная картинка)
        this.load.image('bathroom_bg', 'assets/bathroom_background.png');

        // Corridor background (вертикальная картинка)
        this.load.image('corridor_bg', 'assets/corridor_background.jpg');

        // Cork board background for photo board
        this.load.image('cork_bg', 'assets/ui/cork_bg.png');

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

        // Обработка ошибок загрузки
        this.load.on('loaderror', (file) => {
            console.warn(`Не удалось загрузить: ${file.key}`);
        });
    }

    create() {
        // Успешная загрузка - переход к игре
        this.scene.start('GameScene');
    }
}
