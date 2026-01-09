import Phaser from 'phaser';
import Player from '../entities/Player';
import NPC from '../entities/NPC';
import ConsoleOverlay from '../components/ConsoleOverlay';
import musicManager from '../managers/MusicManager';
import DreamModal from '../components/DreamModal';
import DoorKeypad from '../components/DoorKeypad';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.consoleOverlay = null;
        this.isConsolePaused = false;

        // ===== МУЗЫКАЛЬНАЯ СИСТЕМА =====
        // Теперь используется глобальный MusicManager
        this.vinylSelector = null;   // Ссылка на DOM элемент выбора пластинок

        // ===== КНИЖНАЯ ПОЛКА =====
        this.bookshelfOverlay = null; // Ссылка на оверлей книжной полки

        // ===== ДОСКА ВОСПОМИНАНИЙ =====
        this.photoBoard = null; // Ссылка на оверлей доски с фотками

        // ===== МЕХАНИКА СНА =====
        this.dreamModal = null; // Ссылка на модалку сна

        // Массив сценариев пробуждения (текст + озвучка)
        this.wakeUpScenarios = [
            { text: "Рекси была... огромной?", audio: "dream_huge" },
            { text: "Ого... Вот это Рекси отъелась...", audio: "dream_fat" },
            { text: "Кажется, Рекси захватила мир...", audio: "dream_world" },
            { text: "Надо меньше играть перед сном...", audio: "dream_games" }
        ];

        // ===== КОДОВЫЙ ЗАМОК КУХНИ =====
        this.doorKeypad = null; // Ссылка на кодовый замок
        this.isKitchenUnlocked = false; // Флаг разблокировки кухни

        // ===== КОДОВЫЙ ЗАМОК КОРИДОРА =====
        this.hallwayKeypad = null; // Ссылка на кодовый замок коридора
        this.isHallwayUnlocked = false; // Флаг разблокировки коридора
    }

    create(data) {
        // ===== ЭФФЕКТ ПРОЯВЛЕНИЯ ПРИ ВХОДЕ =====
        this.cameras.main.fadeIn(1000, 0, 0, 0); // Плавное появление из черного экрана

        // ===== ОБНОВЛЕНИЕ ГРОМКОСТИ МУЗЫКИ =====
        // При входе в комнату обновляем громкость музыки
        musicManager.updateVolumeForRoom('GameScene');

        // ===== НОВАЯ АРХИТЕКТУРА: BACKGROUND IMAGE =====

        // СМЕЩЕНИЕ ДЛЯ ОСВОБОЖДЕНИЯ ПРОСТРАНСТВА СПРАВА (для диалогового окна)
        this.OFFSET_X = -250; // Сдвиг влево на 50 пикселей
        this.OFFSET_Y = 100; // Сдвиг вниз на 100 пикселей

        // Загрузка и установка фона
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;

        this.background = this.add.image(gameWidth / 2 + this.OFFSET_X, gameHeight / 2 - 80 + this.OFFSET_Y, 'room_background');
        this.background.setScale(0.15); // Уменьшаем в 4 раза

        // Получаем размеры фона после масштабирования
        const BG_WIDTH = this.background.displayWidth;
        const BG_HEIGHT = this.background.displayHeight;

        console.log(`[GameScene] Background size: ${BG_WIDTH}x${BG_HEIGHT}`);
        // ===== РАМКА В СТИЛЕ ПИКСЕЛЬ-АРТ =====
        this.createPixelArtFrame(
            this.background.x,
            this.background.y,
            BG_WIDTH,
            BG_HEIGHT
        );

        // ===== ДИАЛОГОВОЕ ОКНО =====
        this.createDialogWindow(BG_WIDTH, BG_HEIGHT);

        // Установка границ мира под размер фона
        // this.physics.world.setBounds(0, 0, BG_WIDTH, BG_HEIGHT); // Временно отключено

        // ===== СОЗДАНИЕ ПЕРСОНАЖЕЙ =====
        // Определяем точку спавна в зависимости от того, откуда пришёл игрок
        let spawnX, spawnY, spawnDirection;

        if (data.from === 'kitchen') {
            // Если пришли с кухни - спавн у двери на кухню (внизу)
            spawnX = 700 + this.OFFSET_X;  // Координата X двери на кухню
            spawnY = 510 + this.OFFSET_Y;  // Чуть выше двери
            spawnDirection = 'up';          // Смотрим вверх (в комнату)
            console.log('[GameScene] Spawning from kitchen');
        } else if (data.from === 'hallway') {
            // Если пришли из коридора - спавн у двери в коридор (справа)
            spawnX = 1150 + this.OFFSET_X;  // Координата X двери в коридор
            spawnY = 405 + this.OFFSET_Y;   // Координата Y двери в коридор
            spawnDirection = 'left';         // Смотрим влево (в комнату)
            console.log('[GameScene] Spawning from hallway');
        } else {
            // Дефолтный спавн - в центре комнаты
            spawnX = 650 + this.OFFSET_X;
            spawnY = 450 + this.OFFSET_Y;
            spawnDirection = 'down';
            console.log('[GameScene] Default spawn');
        }

        // Карина (Player) - спавн в зависимости от входа
        this.player = new Player(this, spawnX, spawnY, 'karina');

        // Устанавливаем начальное направление взгляда
        if (spawnDirection === 'up') {
            this.player.play('karina-idle-up');
            this.player.lastDirection = 'up';
        } else if (spawnDirection === 'left') {
            this.player.play('karina-idle-left');
            this.player.lastDirection = 'left';
        } else {
            this.player.play('karina-idle-down');
            this.player.lastDirection = 'down';
        }

        // Даша (NPC) - сидит на фиолетовом пуфике
        this.dasha = new NPC(this, 986 + this.OFFSET_X, 365 + this.OFFSET_Y, 'dasha', 'Даша', 'Привет! Я сижу на пуфике.');

        // ===== ИНИЦИАЛИЗАЦИЯ СТЕН =====
        this.walls = this.physics.add.staticGroup();
        this.physics.add.collider(this.player, this.walls);

        // ===== ИНИЦИАЛИЗАЦИЯ ИНТЕРАКТИВНЫХ ЗОН =====
        this.interactionZones = this.physics.add.staticGroup();
        this.currentZone = null; // Текущая зона, в которой находится игрок

        // Создаем индикатор взаимодействия "!" над головой Карины
        this.interactionIndicator = this.add.text(0, 0, '!', {
            fontSize: '32px',
            color: '#ffff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.interactionIndicator.setOrigin(0.5);
        this.interactionIndicator.setDepth(1000);
        this.interactionIndicator.visible = false;

        // Добавляем все стены (границы и мебель)
        this.addWall(399, 579, 823, 21);
        this.addWall(380, 138, 18, 461);
        this.addWall(398, 140, 823, 185);
        this.addWall(644, 320, 58, 22);
        this.addWall(810, 355, 48, 37);
        this.addWall(752, 323, 190, 24);
        this.addWall(1000, 323, 140, 20);
        this.addWall(956, 374, 56, 42);
        this.addWall(1206, 322, 16, 276);
        this.addWall(1078, 521, 52, 61);
        this.addWall(1133, 472, 66, 117);
        this.addWall(859, 485, 21, 86);
        this.addWall(880, 492, 195, 82);
        this.addWall(769, 498, 91, 84);
        this.addWall(770, 487, 104, 29);
        this.addWall(499, 326, 124, 80);
        this.addWall(470, 408, 145, 24);
        this.addWall(397, 316, 68, 110);
        this.addWall(396, 406, 22, 112);
        this.addWall(412, 402, 21, 85);
        this.addWall(422, 408, 27, 42);
        this.addWall(423, 436, 19, 29);
        this.addWall(412, 486, 15, 16);
        this.addWall(393, 518, 17, 18);
        this.addWall(1144, 327, 62, 56);
        this.addWall(1154, 390, 53, 14);
        this.addWall(1163, 415, 45, 19);
        this.addWall(1174, 449, 44, 16);

        // ===== ИНТЕРАКТИВНЫЕ ЗОНЫ =====
        this.addZone(615, 348, 26, 77, 'bed'); // Кровать
        this.addZone(800, 479, 39, 11, 'cat'); // Кошка
        this.addZone(936, 389, 10, 19, 'dasha'); // Даша
        this.addZone(1028, 361, 109, 8, 'bookshelf'); // Шкаф с книгами
        this.addZone(1076, 508, 11, 12, 'vinyl_storage'); // Коробка с пластинками (оригинальная позиция)
        this.addZone(1119, 511, 9, 9, 'record_player'); // Проигрыватель
        this.addZone(881, 364, 19, 9, 'playstation'); // Плейстуха
        this.addZone(773, 367, 18, 10, 'photoboard'); // Доска с фотками
        this.addZone(1154, 407, 11, 45, 'corridor'); // Проход в коридор
        this.addZone(650, 568, 95, 11, 'kitchen'); // Проход на кухню

        // ===== ИНСТРУМЕНТЫ ДЛЯ ОТЛАДКИ =====
        this.setupDebugTools(); // Включены для рисования зон

        // Настройка управления
        this.setupControls();

        // Настройка камеры
        this.cameras.main.setBounds(0, 0, BG_WIDTH, BG_HEIGHT);
        this.cameras.main.setZoom(1);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        console.log('[GameScene] Scene ready!');
        console.log('[DEBUG MODE] Click and drag to draw walls. Code will appear in console.');
    }

    createPixelArtFrame(centerX, centerY, width, height) {
        // Толщина рамки
        const borderThickness = 8;
        const innerBorderThickness = 4;

        // Цвета в стиле пиксель-арт
        const outerColor = 0x8b4513; // Темно-коричневый (дерево)
        const innerColor = 0xdaa520; // Золотистый
        const highlightColor = 0xffd700; // Яркое золото
        const shadowColor = 0x654321; // Темная тень

        // Вычисляем позиции
        const left = centerX - width / 2;
        const right = centerX + width / 2;
        const top = centerY - height / 2;
        const bottom = centerY + height / 2;

        // Создаем графический объект для рамки
        const frame = this.add.graphics();
        frame.setDepth(10); // Поверх фона, но под персонажами

        // Внешняя граница (темная)
        frame.fillStyle(outerColor, 1);
        frame.fillRect(left - borderThickness, top - borderThickness, width + borderThickness * 2, borderThickness); // Верх
        frame.fillRect(left - borderThickness, bottom, width + borderThickness * 2, borderThickness); // Низ
        frame.fillRect(left - borderThickness, top - borderThickness, borderThickness, height + borderThickness * 2); // Лево
        frame.fillRect(right, top - borderThickness, borderThickness, height + borderThickness * 2); // Право

        // Внутренняя золотая граница
        frame.fillStyle(innerColor, 1);
        frame.fillRect(left - innerBorderThickness, top - innerBorderThickness, width + innerBorderThickness * 2, innerBorderThickness); // Верх
        frame.fillRect(left - innerBorderThickness, bottom, width + innerBorderThickness * 2, innerBorderThickness); // Низ
        frame.fillRect(left - innerBorderThickness, top - innerBorderThickness, innerBorderThickness, height + innerBorderThickness * 2); // Лево
        frame.fillRect(right, top - innerBorderThickness, innerBorderThickness, height + innerBorderThickness * 2); // Право

        // Добавляем световые блики (pixel art style)
        frame.fillStyle(highlightColor, 1);
        // Верхний левый блик
        frame.fillRect(left - borderThickness, top - borderThickness, 3, 3);
        frame.fillRect(left - borderThickness + 4, top - borderThickness, 3, 3);
        // Верхний правый блик
        frame.fillRect(right + borderThickness - 6, top - borderThickness, 3, 3);
        frame.fillRect(right + borderThickness - 10, top - borderThickness, 3, 3);

        // Добавляем тени (pixel art style)
        frame.fillStyle(shadowColor, 1);
        // Нижний правый угол
        frame.fillRect(right + borderThickness - 6, bottom + borderThickness - 3, 3, 3);
        frame.fillRect(right + borderThickness - 10, bottom + borderThickness - 3, 3, 3);
        // Нижний левый угол
        frame.fillRect(left - borderThickness, bottom + borderThickness - 3, 3, 3);
        frame.fillRect(left - borderThickness + 4, bottom + borderThickness - 3, 3, 3);

        // Угловые декоративные элементы (пиксельные ромбики)
        const cornerSize = 12;
        frame.fillStyle(innerColor, 1);

        // Верхний левый угол
        this.drawPixelDiamond(frame, left - borderThickness - cornerSize, top - borderThickness - cornerSize, cornerSize);
        // Верхний правый угол
        this.drawPixelDiamond(frame, right + borderThickness, top - borderThickness - cornerSize, cornerSize);
        // Нижний левый угол
        this.drawPixelDiamond(frame, left - borderThickness - cornerSize, bottom + borderThickness, cornerSize);
        // Нижний правый угол
        this.drawPixelDiamond(frame, right + borderThickness, bottom + borderThickness, cornerSize);

        console.log('[Frame] Pixel art frame created');
    }

    drawPixelDiamond(graphics, x, y, size) {
        // Рисуем пиксельный ромб
        const half = size / 2;
        const pixelSize = 3;

        // Центральная часть
        graphics.fillRect(x + half - pixelSize/2, y, pixelSize, size);
        graphics.fillRect(x, y + half - pixelSize/2, size, pixelSize);

        // Диагонали (создаем пиксельный эффект)
        graphics.fillRect(x + pixelSize, y + pixelSize, pixelSize, pixelSize);
        graphics.fillRect(x + size - pixelSize * 2, y + pixelSize, pixelSize, pixelSize);
        graphics.fillRect(x + pixelSize, y + size - pixelSize * 2, pixelSize, pixelSize);
        graphics.fillRect(x + size - pixelSize * 2, y + size - pixelSize * 2, pixelSize, pixelSize);
    }

    createDialogWindow(bgWidth, bgHeight) {
        // Размеры и позиция диалогового окна
        const dialogWidth = 300;
        const dialogHeight = 500;
        const dialogX = this.background.x + bgWidth / 2 + 250; // Справа от фона
        const dialogY = this.background.y;

        // Фон диалогового окна
        const dialogBg = this.add.graphics();
        dialogBg.setScrollFactor(0); // Фиксируем на экране
        dialogBg.setDepth(100);

        // Темный фон с градиентом (имитация)
        dialogBg.fillStyle(0x2c1810, 1);
        dialogBg.fillRect(dialogX - dialogWidth / 2, dialogY - dialogHeight / 2, dialogWidth, dialogHeight);

        // Внутренний светлый фон для области чата
        dialogBg.fillStyle(0x3d2817, 1);
        dialogBg.fillRect(dialogX - dialogWidth / 2 + 10, dialogY - dialogHeight / 2 + 10, dialogWidth - 20, dialogHeight - 80);

        // Рамка диалогового окна
        dialogBg.lineStyle(4, 0xdaa520, 1);
        dialogBg.strokeRect(dialogX - dialogWidth / 2, dialogY - dialogHeight / 2, dialogWidth, dialogHeight);

        // Внутренняя рамка для чата
        dialogBg.lineStyle(2, 0x8b4513, 1);
        dialogBg.strokeRect(dialogX - dialogWidth / 2 + 10, dialogY - dialogHeight / 2 + 10, dialogWidth - 20, dialogHeight - 80);

        // Декоративная линия над полем ввода
        dialogBg.lineStyle(3, 0xdaa520, 1);
        dialogBg.strokeRect(dialogX - dialogWidth / 2 + 10, dialogY + dialogHeight / 2 - 60, dialogWidth - 20, 40);

        // Область для сообщений (история чата)
        this.chatMessages = [];
        this.chatY = dialogY - dialogHeight / 2 + 20; // Начальная позиция для сообщений
        this.chatAreaHeight = dialogHeight - 100; // Высота области чата
        this.chatAreaX = dialogX;
        this.chatAreaLeft = dialogX - dialogWidth / 2 + 20; // Левая граница для текста

        // Поле ввода (визуальное)
        this.inputFieldText = this.add.text(dialogX - dialogWidth / 2 + 20, dialogY + dialogHeight / 2 - 50, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            wordWrap: { width: 240, useAdvancedWrap: true }
        });
        this.inputFieldText.setScrollFactor(0);
        this.inputFieldText.setDepth(101);

        // Состояние ввода
        this.isTyping = false;
        this.currentInput = '';

        // Клавиши для диалога
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.backspaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Добавляем приветственное сообщение от Даши
        this.addChatMessage('Даша', 'Привет! Как дела?', '#ff69b4');

        console.log('[Dialog] Dialog window created');
    }

    addChatMessage(sender, message, color) {
        // Вычисляем текущую Y позицию с учетом высоты предыдущих сообщений
        let currentY = this.chatY;
        this.chatMessages.forEach(msg => {
            currentY += msg.height + 3; // 3px отступ между сообщениями
        });

        const messageText = this.add.text(
            this.chatAreaLeft,
            currentY,
            `${sender}: ${message}`,
            {
                fontSize: '15px',
                fontFamily: 'Arial',
                color: color,
                wordWrap: { width: 240, useAdvancedWrap: true },
                lineSpacing: 1,
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        messageText.setScrollFactor(0);
        messageText.setDepth(101);

        this.chatMessages.push(messageText);

        // Автоскролл - удаляем старые сообщения если они выходят за пределы области
        const maxY = this.chatY + this.chatAreaHeight - 30; // 30px запас для поля ввода
        while (this.chatMessages.length > 0 && currentY + messageText.height > maxY) {
            const oldMessage = this.chatMessages.shift();
            oldMessage.destroy();

            // Пересчитываем позиции всех сообщений
            let newY = this.chatY;
            this.chatMessages.forEach(msg => {
                msg.setY(newY);
                newY += msg.height + 3;
            });

            currentY = newY;
        }
    }

    handleDialogInput() {
        // Обработка клавиши Enter для начала/завершения ввода
        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            if (!this.isTyping) {
                // Начинаем ввод
                this.isTyping = true;
                this.currentInput = '';
                this.inputFieldText.setText('');
            } else {
                // Отправляем сообщение
                if (this.currentInput.trim().length > 0) {
                    this.addChatMessage('Карина', this.currentInput, '#00ffff');

                    // Симулируем ответ от Даши через 1 секунду
                    this.time.delayedCall(1000, () => {
                        const responses = [
                            'Интересно! Расскажи подробнее.',
                            'Ого, я не знала об этом!',
                            'Да, я с тобой согласна.',
                            'Хмм, надо подумать...',
                            'Это круто! А что еще?'
                        ];
                        const randomResponse = responses[Phaser.Math.Between(0, responses.length - 1)];
                        this.addChatMessage('Даша', randomResponse, '#ff69b4');
                    });

                    this.currentInput = '';
                    this.inputFieldText.setText('');
                }
                this.isTyping = false;
            }
        }

        // Обработка ввода текста
        if (this.isTyping) {
            // Обработка Backspace
            if (Phaser.Input.Keyboard.JustDown(this.backspaceKey)) {
                this.currentInput = this.currentInput.slice(0, -1);
                this.inputFieldText.setText(this.currentInput);
            }

            // Обработка Space
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.currentInput += ' ';
                this.inputFieldText.setText(this.currentInput);
            }
        }
    }

    setupControls() {
        // WASD управление
        this.keys = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
        };

        this.cursors = this.input.keyboard.createCursorKeys();

        // Обработка нажатия клавиши E для взаимодействия
        this.keys.E.on('down', () => {
            if (this.currentZone) {
                this.handleInteraction(this.currentZone);
            }
        });

        // Обработка ввода текста через событие клавиатуры
        this.input.keyboard.on('keydown', (event) => {
            if (this.isTyping && event.key.length === 1) {
                // Ограничиваем длину ввода (примерно 200 символов)
                if (this.currentInput.length < 200) {
                    // Добавляем только печатные символы
                    this.currentInput += event.key;
                    this.inputFieldText.setText(this.currentInput);
                }
            }
        });
    }

    setupDebugTools() {
        // Текст координат в левом верхнем углу
        this.coordsText = this.add.text(10, 10, 'Mouse: 0, 0 | Mode: ZONES (Yellow)', {
            fontSize: '16px',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        this.coordsText.setScrollFactor(0); // Фиксируем на экране
        this.coordsText.setDepth(1000);

        // Переменные для рисования
        this.drawStart = null;
        this.drawRect = null;

        // Обработчики мыши
        this.input.on('pointerdown', (pointer) => {
            const worldX = pointer.worldX;
            const worldY = pointer.worldY;
            this.drawStart = { x: worldX, y: worldY };

            // Создаем визуальный прямоугольник (ЖЕЛТЫЙ для зон)
            if (this.drawRect) {
                this.drawRect.destroy();
            }
            this.drawRect = this.add.rectangle(worldX, worldY, 1, 1, 0xffff00, 0.3);
        });

        this.input.on('pointermove', (pointer) => {
            const worldX = Math.round(pointer.worldX);
            const worldY = Math.round(pointer.worldY);
            this.coordsText.setText(`Mouse: ${worldX}, ${worldY} | Mode: ZONES (Yellow)`);

            // Обновляем прямоугольник при рисовании
            if (this.drawStart && this.drawRect) {
                const width = worldX - this.drawStart.x;
                const height = worldY - this.drawStart.y;
                this.drawRect.setSize(Math.abs(width), Math.abs(height));
                this.drawRect.setPosition(
                    this.drawStart.x + width / 2,
                    this.drawStart.y + height / 2
                );
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (this.drawStart) {
                const worldX = pointer.worldX;
                const worldY = pointer.worldY;

                const x = Math.min(this.drawStart.x, worldX);
                const y = Math.min(this.drawStart.y, worldY);
                const width = Math.abs(worldX - this.drawStart.x);
                const height = Math.abs(worldY - this.drawStart.y);

                if (width > 5 && height > 5) {
                    // Выводим код для интерактивной зоны в консоль
                    console.log(`this.addZone(${Math.round(x)}, ${Math.round(y)}, ${Math.round(width)}, ${Math.round(height)}, 'name');`);

                    // Создаем зону (желтую, видимую)
                    this.addZone(x, y, width, height, 'name');
                }

                this.drawStart = null;
            }
        });
    }

    addWall(x, y, width, height) {
        // Создаем невидимый физический объект (с учетом смещения)
        const wall = this.add.rectangle(x + width / 2 + this.OFFSET_X, y + height / 2 + this.OFFSET_Y, width, height);
        this.physics.add.existing(wall, true); // true = static body
        this.walls.add(wall);

        // Стены полностью невидимы
        wall.setFillStyle(0x00ff00, 0);
    }

    addZone(x, y, width, height, name) {
        // Создаем желтый прямоугольник для интерактивной зоны (с учетом смещения)
        const zone = this.add.rectangle(x + width / 2 + this.OFFSET_X, y + height / 2 + this.OFFSET_Y, width, height);
        this.physics.add.existing(zone, true); // true = static body
        this.interactionZones.add(zone);

        // Желтый цвет с прозрачностью (в режиме отладки видимый)
        zone.setFillStyle(0xffff00, 0.3);
        zone.setStrokeStyle(2, 0xffff00, 1);

        // Сохраняем имя зоны
        zone.zoneName = name;

        console.log(`[Zone Created] ${name} at (${Math.round(x)}, ${Math.round(y)}) size ${Math.round(width)}x${Math.round(height)}`);
    }


    update(time, delta) {
        // Если консоль открыта, блокируем обновление игры
        if (this.isConsolePaused) {
            return;
        }

        // Обработка диалогового ввода
        this.handleDialogInput();

        // Обновление игрока
        this.player.update(this.cursors, this.keys);

        // Обновление NPC
        if (this.dasha) {
            this.dasha.update();
        }

        // ===== ПРОВЕРКА ПЕРЕСЕЧЕНИЯ С ИНТЕРАКТИВНЫМИ ЗОНАМИ =====
        let foundZone = null;

        this.interactionZones.children.entries.forEach(zone => {
            // Проверяем пересечение игрока с зоной
            if (this.physics.overlap(this.player, zone)) {
                foundZone = zone.zoneName;
            }
        });

        // Обновляем текущую зону
        this.currentZone = foundZone;

        // Показываем/скрываем индикатор "!" в зависимости от нахождения в зоне
        if (this.currentZone) {
            this.interactionIndicator.visible = true;
            // Позиционируем индикатор над головой Карины
            this.interactionIndicator.setPosition(this.player.x, this.player.y - 40);
        } else {
            this.interactionIndicator.visible = false;
        }
    }

    handleInteraction(zoneName) {
        console.log(`[Interaction] Player pressed E in zone: ${zoneName}`);

        // ===== МЕХАНИКА СНА =====
        if (zoneName === 'bed') {
            this.openDreamModal();
            return;
        }

        // ===== КНИЖНАЯ ПОЛКА =====
        if (zoneName === 'bookshelf') {
            this.openBookshelf();
            return;
        }

        // ===== ДОСКА ВОСПОМИНАНИЙ =====
        if (zoneName === 'photoboard') {
            this.openPhotoBoard();
            return;
        }

        // ===== МУЗЫКАЛЬНАЯ СИСТЕМА =====

        // Зона 1: vinyl_storage (Коробка с пластинками) - Открыть окно выбора
        if (zoneName === 'vinyl_storage') {
            this.openVinylSelector();
            return;
        }

        // Зона 2: record_player (Проигрыватель) - Включить/выключить музыку
        if (zoneName === 'record_player') {
            // Сценарий А: Пластинка НЕ выбрана
            if (!musicManager.selectedRecord) {
                this.showFloatingText(
                    this.player.x,
                    this.player.y - 40,
                    'Нужно выбрать пластинку!',
                    '#ff4444'
                );
                return;
            }

            // Сценарий Б и В: Включаем/выключаем музыку
            const result = musicManager.toggleMusic('GameScene');

            if (result === 'playing') {
                // Сценарий Б: Включена
                this.showFloatingText(
                    this.player.x,
                    this.player.y - 40,
                    'ВКЛ ♪',
                    '#44ff44'
                );
            } else if (result === 'paused') {
                // Сценарий В: Выключена
                this.showFloatingText(
                    this.player.x,
                    this.player.y - 40,
                    'ВЫКЛ',
                    '#999999'
                );
            }

            return;
        }

        // ===== ОСТАЛЬНЫЕ ЗОНЫ =====

        // Открытие игровой консоли
        if (zoneName === 'playstation') {
            this.openConsole();
            return;
        }

        // Переход на кухню (с кодовым замком)
        if (zoneName === 'kitchen') {
            if (this.isKitchenUnlocked) {
                // Кухня разблокирована - переходим
                this.goToKitchen();
            } else {
                // Кухня заблокирована - открываем кодовый замок
                this.openDoorKeypad();
            }
            return;
        }

        // Переход в коридор (с кодовым замком 1902)
        if (zoneName === 'corridor') {
            if (this.isHallwayUnlocked) {
                // Коридор уже разблокирован - переходим напрямую
                console.log('[GameScene] Hallway already unlocked, transitioning...');
                this.goToHallway();
            } else {
                // Коридор заблокирован - открываем кодовый замок
                this.openHallwayKeypad();
            }
            return;
        }

        // Взаимодействие с кошкой Рекси
        if (zoneName === 'cat') {
            // Находим координаты зоны кошки
            let catZone = null;
            this.interactionZones.children.entries.forEach(zone => {
                if (zone.zoneName === 'cat') {
                    catZone = zone;
                }
            });

            if (catZone) {
                // Генерируем случайное число от 1 до 3
                const randomReaction = Phaser.Math.Between(1, 3);

                let message = '';
                let soundKey = '';

                switch(randomReaction) {
                    case 1:
                        message = 'Мррр'; // ПОДСКАЗКА: ровно 4 буквы (цифра 4)
                        soundKey = 'purr';
                        break;
                    case 2:
                        message = 'Мяу!';
                        soundKey = 'meow_short';
                        break;
                    case 3:
                        message = 'Мяяяяяяу...';
                        soundKey = 'meow_long';
                        break;
                }

                // Показываем плавающий текст над кошкой
                this.showFloatingText(catZone.x, catZone.y - 30, message);

                // Воспроизводим звук с настройкой громкости
                // Мяуканье в два раза тише, мурчание - обычная громкость
                const volume = soundKey === 'purr' ? 1.0 : 0.2;
                this.sound.play(soundKey, { volume });

                console.log(`[Cat] Reaction ${randomReaction}: ${message}`);
            }
        }
    }

    showFloatingText(x, y, message, color = '#ffffff') {
        // Создаем текст с пиксельным стилем
        const floatingText = this.add.text(x, y, message, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: color,
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 300, useAdvancedWrap: true }
        });
        floatingText.setOrigin(0.5);
        floatingText.setDepth(1001); // Над всем остальным

        // Анимация: всплывает вверх и исчезает
        this.tweens.add({
            targets: floatingText,
            y: y - 50, // Всплывает на 50 пикселей вверх
            alpha: 0, // Исчезает
            duration: 3500, // 3.5 секунды (достаточно времени для прочтения)
            ease: 'Power2',
            onComplete: () => {
                floatingText.destroy(); // Удаляем текст после анимации
            }
        });
    }

    /**
     * Открыть игровую консоль
     */
    openConsole() {
        if (this.isConsolePaused) return;

        console.log('[GameScene] Opening console overlay...');

        // Останавливаем игрока
        this.player.body.setVelocity(0, 0);

        // Ставим игру на паузу
        this.isConsolePaused = true;

        // Создаем и открываем консоль
        if (!this.consoleOverlay) {
            this.consoleOverlay = new ConsoleOverlay();
        }

        this.consoleOverlay.open(() => {
            this.closeConsole();
        });
    }

    /**
     * Закрыть игровую консоль
     */
    closeConsole() {
        console.log('[GameScene] Closing console overlay...');

        // Возобновляем игру
        this.isConsolePaused = false;

        // Очищаем консоль
        if (this.consoleOverlay) {
            this.consoleOverlay = null;
        }
    }

    // ===== МУЗЫКАЛЬНАЯ СИСТЕМА =====

    /**
     * Выбрать пластинку (вызывается из VinylSelector)
     */
    selectRecord(record) {
        musicManager.selectRecord(record);
    }

    /**
     * Открыть окно выбора пластинок
     */
    openVinylSelector() {
        if (this.vinylSelector) return; // Уже открыто

        console.log('[VinylSelector] Opening...');

        // Останавливаем игрока
        this.player.body.setVelocity(0, 0);
        this.isConsolePaused = true;

        // Создаем DOM элемент для выбора пластинок
        import('../components/VinylSelector').then(module => {
            const VinylSelector = module.default;
            this.vinylSelector = new VinylSelector(
                (selectedRecord) => {
                    // Callback при выборе пластинки
                    this.selectRecord(selectedRecord);
                    this.closeVinylSelector();
                },
                () => {
                    // Callback при закрытии (Escape)
                    this.closeVinylSelector();
                }
            );
            this.vinylSelector.open();
        });
    }

    /**
     * Закрыть окно выбора пластинок
     */
    closeVinylSelector() {
        // Защита от повторного вызова
        if (!this.vinylSelector) {
            console.log('[VinylSelector] Already closed or not open');
            return;
        }

        console.log('[VinylSelector] Closing...');

        // ВАЖНО: Сохраняем ссылку и сбрасываем её ДО вызова close(),
        // чтобы избежать повторного вызова через onCloseCallback
        const selector = this.vinylSelector;
        this.vinylSelector = null;

        // Возобновляем игру ПЕРЕД закрытием
        this.isConsolePaused = false;

        // Теперь закрываем селектор (это может вызвать onCloseCallback, но vinylSelector уже null)
        selector.close();

        console.log('[VinylSelector] Game resumed, isConsolePaused:', this.isConsolePaused);
    }

    // ===== КНИЖНАЯ ПОЛКА =====

    /**
     * Открыть книжную полку
     */
    openBookshelf() {
        if (this.bookshelfOverlay) return; // Уже открыто

        console.log('[BookshelfOverlay] Opening...');

        // Останавливаем игрока
        this.player.body.setVelocity(0, 0);
        this.isConsolePaused = true;

        // Создаем DOM элемент для просмотра книг
        import('../components/BookshelfOverlay').then(module => {
            const BookshelfOverlay = module.default;
            this.bookshelfOverlay = new BookshelfOverlay(
                () => {
                    // Callback при закрытии (Escape или выход из режима чтения)
                    this.closeBookshelf();
                }
            );
            this.bookshelfOverlay.open();
        });
    }

    /**
     * Закрыть книжную полку
     */
    closeBookshelf() {
        // Защита от повторного вызова
        if (!this.bookshelfOverlay) {
            console.log('[BookshelfOverlay] Already closed or not open');
            return;
        }

        console.log('[BookshelfOverlay] Closing...');

        // ВАЖНО: Сохраняем ссылку и сбрасываем её ДО вызова close()
        const overlay = this.bookshelfOverlay;
        this.bookshelfOverlay = null;

        // Возобновляем игру ПЕРЕД закрытием
        this.isConsolePaused = false;

        // Теперь закрываем оверлей
        overlay.close();

        console.log('[BookshelfOverlay] Game resumed, isConsolePaused:', this.isConsolePaused);
    }

    // ===== ДОСКА ВОСПОМИНАНИЙ =====

    /**
     * Открыть доску с фотографиями
     */
    openPhotoBoard() {
        if (this.photoBoard) return; // Уже открыто

        console.log('[PhotoBoard] Opening...');

        // Останавливаем игрока
        this.player.body.setVelocity(0, 0);
        this.isConsolePaused = true;

        // Создаем DOM элемент для просмотра фотографий
        import('../components/PhotoBoard').then(module => {
            const PhotoBoard = module.default;
            this.photoBoard = new PhotoBoard(
                () => {
                    // Callback при закрытии
                    this.closePhotoBoard();
                }
            );
            this.photoBoard.open();
        });
    }

    /**
     * Закрыть доску с фотографиями
     */
    closePhotoBoard() {
        // Защита от повторного вызова
        if (!this.photoBoard) {
            console.log('[PhotoBoard] Already closed or not open');
            return;
        }

        console.log('[PhotoBoard] Closing...');

        // ВАЖНО: Сохраняем ссылку и сбрасываем её ДО вызова close()
        const board = this.photoBoard;
        this.photoBoard = null;

        // Возобновляем игру ПЕРЕД закрытием
        this.isConsolePaused = false;

        // Теперь закрываем доску
        board.close();

        console.log('[PhotoBoard] Game resumed, isConsolePaused:', this.isConsolePaused);
    }

    // ===== МЕХАНИКА СНА =====

    /**
     * Открыть модалку сна с атмосферным переходом
     */
    openDreamModal() {
        if (this.dreamModal) return; // Уже открыто

        console.log('[DreamModal] Starting sleep transition...');

        // ШАГ 0: Блокируем управление игроком сразу
        this.player.body.setVelocity(0, 0);
        this.isConsolePaused = true;

        // ШАГ 1: Проигрываем звук зевка (максимальная громкость)
        this.sound.play('yawn', { volume: 2.0 });
        console.log('[DreamModal] Playing yawn sound...');

        // ШАГ 2: Одновременно запускаем медленное затемнение (2 секунды)
        this.cameras.main.fadeOut(2000, 0, 0, 0);
        console.log('[DreamModal] Starting fade out...');

        // ШАГ 3: После завершения затемнения открываем DreamModal
        this.cameras.main.once('camerafadeoutcomplete', () => {
            console.log('[DreamModal] Fade complete, opening dream...');

            // Создаем модалку сна
            this.dreamModal = new DreamModal(
                () => {
                    // Callback при закрытии
                    this.closeDreamModal();
                },
                () => {
                    // Callback при окончании видео - показываем случайную фразу
                    this.showDreamPhrase();
                }
            );
            this.dreamModal.open();
        });
    }

    /**
     * Показать случайную фразу после сна с озвучкой
     */
    showDreamPhrase() {
        // Выбираем случайный сценарий пробуждения
        const scenario = Phaser.Math.RND.pick(this.wakeUpScenarios);

        // Показываем фразу и воспроизводим звук с задержкой,
        // чтобы игрок успел проснуться и увидеть/услышать
        // Задержка 600 мс (после начала проявления камеры)
        this.time.delayedCall(600, () => {
            // Воспроизводим озвучку (громкость 1.0)
            this.sound.play(scenario.audio, { volume: 1.0 });

            // Показываем плавающий текст над Кариной
            this.showFloatingText(
                this.player.x,
                this.player.y - 50,
                scenario.text,
                '#b19cd9' // Мягкий фиолетовый цвет для фраз о снах
            );

            console.log(`[Dream] Phrase: ${scenario.text}, Audio: ${scenario.audio}`);
        });
    }

    /**
     * Закрыть модалку сна
     */
    closeDreamModal() {
        // Защита от повторного вызова
        if (!this.dreamModal) {
            console.log('[DreamModal] Already closed or not open');
            return;
        }

        console.log('[DreamModal] Closing...');

        // ВАЖНО: Сохраняем ссылку и сбрасываем её ДО вызова close()
        const modal = this.dreamModal;
        this.dreamModal = null;

        // Закрываем модалку
        modal.close();

        // Возобновляем игру и плавно проявляем камеру
        this.isConsolePaused = false;
        this.cameras.main.fadeIn(1000, 0, 0, 0); // Плавное проявление за 1 секунду

        console.log('[DreamModal] Game resumed, isConsolePaused:', this.isConsolePaused);
    }

    // ===== КОДОВЫЙ ЗАМОК КУХНИ =====

    /**
     * Открыть кодовый замок
     */
    openDoorKeypad() {
        if (this.doorKeypad) return; // Уже открыто

        console.log('[DoorKeypad] Opening...');

        // Останавливаем игрока
        this.player.body.setVelocity(0, 0);
        this.isConsolePaused = true;

        // Создаем кодовый замок
        this.doorKeypad = new DoorKeypad(
            () => {
                // Callback при правильном коде
                this.unlockKitchen();
            },
            () => {
                // Callback при закрытии без ввода кода
                this.closeDoorKeypad();
            }
        );
        this.doorKeypad.open();
    }

    /**
     * Закрыть кодовый замок
     */
    closeDoorKeypad() {
        // Защита от повторного вызова
        if (!this.doorKeypad) {
            console.log('[DoorKeypad] Already closed or not open');
            return;
        }

        console.log('[DoorKeypad] Closing...');

        // ВАЖНО: Сохраняем ссылку и сбрасываем её ДО вызова close()
        const keypad = this.doorKeypad;
        this.doorKeypad = null;

        // Возобновляем игру ПЕРЕД закрытием
        this.isConsolePaused = false;

        // Теперь закрываем замок
        keypad.close();

        console.log('[DoorKeypad] Game resumed, isConsolePaused:', this.isConsolePaused);
    }

    /**
     * Разблокировать кухню
     */
    unlockKitchen() {
        console.log('[Kitchen] Unlocked!');
        this.isKitchenUnlocked = true;

        // Закрываем замок
        this.closeDoorKeypad();

        // Сразу переходим на кухню
        this.goToKitchen();
    }

    /**
     * Перейти на кухню
     */
    goToKitchen() {
        console.log('[Kitchen] Going to kitchen...');

        // Блокируем управление
        this.player.body.setVelocity(0, 0);

        // Запускаем эффект затемнения
        this.cameras.main.fadeOut(1000, 0, 0, 0);

        // После завершения затемнения переключаем сцену
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Передаём информацию, что пришли из спальни
            this.scene.start('KitchenScene', { from: 'bedroom' });
        });
    }

    goToHallway() {
        console.log('[Hallway] Going to hallway...');

        // Блокируем управление
        this.player.body.setVelocity(0, 0);

        // Запускаем эффект затемнения
        this.cameras.main.fadeOut(1000, 0, 0, 0);

        // После завершения затемнения переключаем сцену
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('HallwayScene');
        });
    }

    // ===== КОДОВЫЙ ЗАМОК КОРИДОРА =====

    /**
     * Открыть кодовый замок коридора
     */
    openHallwayKeypad() {
        if (this.hallwayKeypad) return; // Уже открыто

        console.log('[HallwayKeypad] Opening...');

        // Останавливаем игрока
        this.player.body.setVelocity(0, 0);
        this.isConsolePaused = true;

        // Создаем кодовый замок
        this.hallwayKeypad = new DoorKeypad(
            () => {
                // Callback при правильном коде
                this.unlockHallway();
            },
            () => {
                // Callback при закрытии без ввода кода
                this.closeHallwayKeypad();
            }
        );

        // Устанавливаем параметры замка для коридора
        this.hallwayKeypad.correctCode = [1, 9, 0, 2]; // Код 1902 (с зеркала в ванной)
        this.hallwayKeypad.hintText = 'Твой холодный двойник хранит секрет.<br>Согрей его, и он заговорит.'; // Красивая текстовая подсказка

        this.hallwayKeypad.open();
    }

    /**
     * Закрыть кодовый замок коридора
     */
    closeHallwayKeypad() {
        // Защита от повторного вызова
        if (!this.hallwayKeypad) {
            console.log('[HallwayKeypad] Already closed or not open');
            return;
        }

        console.log('[HallwayKeypad] Closing...');

        // ВАЖНО: Сохраняем ссылку и сбрасываем её ДО вызова close()
        const keypad = this.hallwayKeypad;
        this.hallwayKeypad = null;

        // Возобновляем игру ПЕРЕД закрытием
        this.isConsolePaused = false;

        // Теперь закрываем замок
        keypad.close();

        console.log('[HallwayKeypad] Game resumed, isConsolePaused:', this.isConsolePaused);
    }

    /**
     * Разблокировать коридор
     */
    unlockHallway() {
        console.log('[Hallway] Unlocked!');
        this.isHallwayUnlocked = true;

        // Закрываем замок
        this.closeHallwayKeypad();

        // Сразу переходим в коридор
        this.goToHallway();
    }
}
