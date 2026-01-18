import Phaser from 'phaser';
import Player from '../entities/Player';
import musicManager from '../managers/MusicManager';
import OvenOverlay from '../components/OvenOverlay';
import DishWashing from '../components/DishWashing';
import FridgeOverlay from '../components/FridgeOverlay';
import DoorKeypad from '../components/DoorKeypad';

export default class KitchenScene extends Phaser.Scene {
    constructor() {
        super({ key: 'KitchenScene' });

        // ===== КОДОВЫЙ ЗАМОК ВАННОЙ =====
        this.isBathroomUnlocked = false; // Флаг разблокировки ванной

        // ===== СИСТЕМА МАСОК (INVERTED GEOMETRY MASK) =====
        this.maskGraphics = null; // Графический объект для рисования масок (невидимый)
        this.debugGraphics = null; // Графический объект для визуализации масок (видимый)
        this.builderMode = 2; // Режим строителя: 1 = Стены (Красные), 2 = Зоны (Желтые), 3 = Маски (Синие)
        this.debugMode = false; // Режим разработки (false = продакшн, синие квадраты не создаются вообще)
    }

    create(data) {
        // ===== ЭФФЕКТ ПРОЯВЛЕНИЯ ПРИ ВХОДЕ =====
        this.cameras.main.fadeIn(1000, 0, 0, 0); // Плавное появление из черного экрана

        // ===== ОБНОВЛЕНИЕ ГРОМКОСТИ МУЗЫКИ =====
        // При входе на кухню обновляем громкость музыки
        musicManager.updateVolumeForRoom('KitchenScene');

        // ===== СОСТОЯНИЕ ЧАЙНИКА =====
        this.isKettleBoiling = false; // Флаг процесса кипения
        this.kettleAudio = null; // Ссылка на звук чайника
        this.kettleSteamTimer = null; // Таймер для эффекта пара
        this.kettleSteamTexts = []; // Массив текстовых элементов пара
        this.hasBoiledWater = false; // Флаг вскипяченной воды
        // Гарантированно 6 облачков ☁️ за время кипения (в рандомные моменты)
        this.cloudTimestamps = []; // Рандомные таймстампы когда появятся облачки
        this.nextCloudIndex = 0; // Индекс следующего облачка
        this.kettleStartTime = 0; // Время начала кипения
        this.lastCloudTime = 0; // Время последнего облачка (чтобы не пересекаться с красным паром)

        // ===== СОСТОЯНИЕ ВЗАИМОДЕЙСТВИЯ =====
        this.isInteracting = false; // Флаг блокировки управления во время взаимодействия

        // ===== ЗВУК КУХОННОГО СТОЛА =====
        this.tableVoiceAudio = null; // Текущий голосовой звук со стола

        // ===== ОВЕРЛЕЙ ДУХОВКИ =====
        this.ovenOverlay = new OvenOverlay();

        // ===== МИНИ-ИГРА МЫТЬЯ ПОСУДЫ =====
        this.dishWashing = new DishWashing();

        // ===== ОВЕРЛЕЙ ХОЛОДИЛЬНИКА =====
        this.fridgeOverlay = new FridgeOverlay();

        // ===== НОВАЯ АРХИТЕКТУРА: BACKGROUND IMAGE =====

        // СМЕЩЕНИЕ ДЛЯ ОСВОБОЖДЕНИЯ ПРОСТРАНСТВА СПРАВА (для диалогового окна)
        this.OFFSET_X = -250; // Сдвиг влево
        this.OFFSET_Y = 100; // Сдвиг вниз

        // Загрузка и установка фона кухни
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;

        this.background = this.add.image(gameWidth / 2 + this.OFFSET_X, gameHeight / 2 - 80 + this.OFFSET_Y, 'kitchen_bg');
        this.background.setScale(0.15); // Уменьшаем

        // Получаем размеры фона после масштабирования
        const BG_WIDTH = this.background.displayWidth;
        const BG_HEIGHT = this.background.displayHeight;

        console.log(`[KitchenScene] Background size: ${BG_WIDTH}x${BG_HEIGHT}`);

        // ===== РАМКА В СТИЛЕ ПИКСЕЛЬ-АРТ =====
        this.createPixelArtFrame(
            this.background.x,
            this.background.y,
            BG_WIDTH,
            BG_HEIGHT
        );

        // ===== CHAT PANEL (Панель справа) =====
        // Используем глобальную панель чата
        if (!window.chatPanel) {
            const ChatPanel = require('../components/ChatPanel').default;
            window.chatPanel = new ChatPanel();
        }
        this.chatPanel = window.chatPanel;
        this.chatPanel.setLevel('kitchen');

        // Установка границ мира под размер фона
        this.physics.world.setBounds(0, 0, BG_WIDTH, BG_HEIGHT);

        // ===== СОЗДАНИЕ ПЕРСОНАЖЕЙ =====
        // Определяем точку спавна в зависимости от того, откуда пришёл игрок
        let spawnX, spawnY, spawnDirection;

        if (data && data.from === 'bathroom') {
            // Если пришли из ванной - спавн у двери в ванную (слева)
            spawnX = 448 + this.OFFSET_X + 25 ;  // Справа от двери в ванную
            spawnY = 440 + this.OFFSET_Y -25 ;  // В центре высоты двери
            spawnDirection = 'right';            // Смотрим вправо
            console.log('[KitchenScene] Spawning from bathroom');
        } else {
            // Дефолтный спавн - у входа на кухню (из спальни)
            spawnX = 700 + this.OFFSET_X;
            spawnY = 520 + this.OFFSET_Y;
            spawnDirection = 'up';               // Смотрим вверх (в комнату)
            console.log('[KitchenScene] Default spawn (from bedroom)');
        }

        // Карина (Player)
        this.player = new Player(this, spawnX, spawnY, 'karina');

        // Устанавливаем начальное направление взгляда
        if (spawnDirection === 'right') {
            this.player.play('karina-idle-right');
            this.player.lastDirection = 'right';
        } else {
            this.player.play('karina-idle-up');
            this.player.lastDirection = 'up';
        }

        console.log(`[KitchenScene] Player spawned at: ${spawnX}, ${spawnY}`);

        // ===== СИСТЕМА ИНВЕРТИРОВАННЫХ МАСОК =====

        // 1. ЛОГИКА: Создаем графический объект для математики маски (невидимый)
        this.maskGraphics = this.add.graphics();
        this.maskGraphics.visible = false; // Этот слой НЕВИДИМ - только для маски

        // 2. ВИЗУАЛ: Создаем графический объект для отладочной визуализации
        this.debugGraphics = this.add.graphics();
        this.debugGraphics.setDepth(101); // Поверх всего для видимости

        // Создаем геометрическую маску из невидимого maskGraphics
        const mask = this.maskGraphics.createGeometryMask();

        // ВАЖНО: Инвертируем маску (персонаж виден везде, КРОМЕ нарисованных зон)
        mask.setInvertAlpha(true);

        // Применяем маску к игроку
        this.player.setMask(mask);

        console.log('[Mask System] Inverted geometry mask applied to player (visual layer separate)');

        // ===== ИНИЦИАЛИЗАЦИЯ СТЕН =====
        this.walls = this.physics.add.staticGroup();
        this.physics.add.collider(this.player, this.walls);

        // Добавляем стены кухни
        this.addWall(497, 355, 452, 12);  // Верхняя столешница
        this.addWall(948, 339, 50, 33);   // Чайник/предмет на столешнице
        this.addWall(997, 340, 135, 46);  // Предметы на столешнице справа
        this.addWall(425, 318, 71, 53);   // Микроволновка/шкаф
        this.addWall(425, 367, 64, 20);   // Шкаф средний
        this.addWall(419, 383, 61, 28);   // Шкаф
        this.addWall(406, 405, 66, 29);   // Шкаф
        this.addWall(409, 428, 54, 31);   // Шкаф
        this.addWall(405, 453, 47, 26);   // Шкаф
        this.addWall(395, 470, 51, 25);   // Шкаф
        this.addWall(398, 490, 36, 29);   // Шкаф нижний
        this.addWall(398, 501, 28, 37);   // Шкаф нижний
        this.addWall(395, 592, 812, 8);   // Нижняя стена/плинтус
        this.addWall(1114, 332, 51, 67);  // Холодильник верх
        this.addWall(1124, 329, 37, 88);  // Холодильник
        this.addWall(1132, 345, 30, 92);  // Холодильник
        this.addWall(1136, 377, 35, 72);  // Холодильник
        this.addWall(1142, 374, 33, 87);  // Холодильник центр
        this.addWall(1151, 358, 46, 116); // Холодильник
        this.addWall(1159, 365, 62, 128); // Холодильник
        this.addWall(1167, 393, 43, 121); // Холодильник
        this.addWall(1175, 400, 41, 140); // Холодильник правый
        this.addWall(913, 519, 46, 68);   // Стул у стола
        this.addWall(908, 475, 12, 41);   // Стул маленький
        // this.addWall(972, 488, 134, 113); // Обеденный стол - УДАЛЕНО
        this.addWall(971, 490, 127, 98);  // Обеденный стол (новый)
        this.addWall(969, 483, 125, 14);  // Столешница
        this.addWall(1121, 520, 83, 69);  // Стул правый
        this.addWall(385, 481, 29, 81);   // Шкаф левый нижний
        this.addWall(393, 352, 10, 234);  // Левая стена шкафов

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

        // ===== ИНТЕРАКТИВНЫЕ ЗОНЫ =====
        // Зоны переходов между комнатами
        this.addZone(448, 440, 23, 45, 'bathroom_door');  // Проход в туалет
        this.addZone(650, 583, 95, 11, 'bedroom_door');   // Вернуться в комнату

        // Зоны взаимодействия с объектами на кухне
        this.addZone(514, 374, 31, 7, 'stove');           // 1. Электропечь
        this.addZone(695, 374, 9, 11, 'kettle');          // 2. Чайник
        this.addZone(830, 373, 12, 14, 'wash_dishes');    // 3. Помыть посуду
        this.addZone(966, 372, 9, 14, 'feed_reksi');      // 4. Накормить Рекси
        this.addZone(1041, 380, 17, 13, 'fridge');        // 5. Холодильник
        this.addZone(971, 473, 125, 13, 'kitchen_table'); // 6. Кухонный стол (голосовые реплики)

        // ===== ИНСТРУМЕНТЫ ДЛЯ ОТЛАДКИ =====
        this.setupDebugTools(); // Включены для рисования зон

        // Настройка управления
        this.setupControls();

        // Настройка камеры
        this.cameras.main.setBounds(0, 0, BG_WIDTH, BG_HEIGHT);
        this.cameras.main.setZoom(1);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        console.log('[KitchenScene] Scene ready!');
        console.log('[DEBUG MODE] Click and drag to draw zones/walls. Press T to toggle modes. Code will appear in console.');
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
            if (this.currentZone && !this.isInteracting) {
                this.handleInteraction(this.currentZone);
            }
        });
    }

    setupDebugTools() {
        // Текст координат в левом верхнем углу
        this.coordsText = this.add.text(10, 10, this.getModeText(0, 0), {
            fontSize: '16px',
            color: this.getModeColor(),
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        this.coordsText.setScrollFactor(0); // Фиксируем на экране
        this.coordsText.setDepth(1000);

        // Клавиши переключения режимов
        this.input.keyboard.on('keydown-ONE', () => {
            this.builderMode = 1; // Стены (Красные)
            console.log('[Builder] Mode: WALLS (Red)');
        });

        this.input.keyboard.on('keydown-TWO', () => {
            this.builderMode = 2; // Зоны (Желтые)
            console.log('[Builder] Mode: ZONES (Yellow)');
        });

        this.input.keyboard.on('keydown-THREE', () => {
            this.builderMode = 3; // Маски (Синие)
            console.log('[Builder] Mode: MASKS (Blue)');
        });

        // Переменные для рисования
        this.drawStart = null;
        this.drawRect = null;

        // Обработчики мыши
        this.input.on('pointerdown', (pointer) => {
            const worldX = pointer.worldX;
            const worldY = pointer.worldY;
            this.drawStart = { x: worldX, y: worldY };

            // Создаем визуальный прямоугольник (цвет зависит от режима)
            if (this.drawRect) {
                this.drawRect.destroy();
            }
            const color = this.getModeColorHex();
            this.drawRect = this.add.rectangle(worldX, worldY, 1, 1, color, 0.3);
        });

        this.input.on('pointermove', (pointer) => {
            const worldX = Math.round(pointer.worldX);
            const worldY = Math.round(pointer.worldY);
            this.coordsText.setText(this.getModeText(worldX, worldY));
            this.coordsText.setColor(this.getModeColor());

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
                    // Вычитаем смещение из координат для корректного вывода кода
                    const correctedX = Math.round(x - this.OFFSET_X);
                    const correctedY = Math.round(y - this.OFFSET_Y);
                    const roundedWidth = Math.round(width);
                    const roundedHeight = Math.round(height);

                    if (this.builderMode === 1) {
                        // Режим стен (Красные)
                        console.log(`this.addWall(${correctedX}, ${correctedY}, ${roundedWidth}, ${roundedHeight});`);
                        this.createWallDirect(x, y, width, height);
                    } else if (this.builderMode === 2) {
                        // Режим зон (Желтые)
                        console.log(`this.addZone(${correctedX}, ${correctedY}, ${roundedWidth}, ${roundedHeight}, 'name');`);
                        this.createZoneDirect(x, y, width, height, 'debug_zone');
                    } else if (this.builderMode === 3) {
                        // Режим масок (Синие)
                        console.log(`this.addMask(${correctedX}, ${correctedY}, ${roundedWidth}, ${roundedHeight});`);
                        this.addMask(correctedX, correctedY, roundedWidth, roundedHeight);
                    }
                }

                this.drawStart = null;
            }
        });
    }

    getModeText(x, y) {
        const modes = {
            1: `Mouse: ${x}, ${y} | Mode: WALLS (Red)`,
            2: `Mouse: ${x}, ${y} | Mode: ZONES (Yellow)`,
            3: `Mouse: ${x}, ${y} | Mode: MASKS (Blue)`
        };
        return modes[this.builderMode] || modes[2];
    }

    getModeColor() {
        const colors = {
            1: '#ff0000', // Красный
            2: '#ffff00', // Желтый
            3: '#0000ff'  // Синий
        };
        return colors[this.builderMode] || colors[2];
    }

    getModeColorHex() {
        const colors = {
            1: 0xff0000, // Красный
            2: 0xffff00, // Желтый
            3: 0x0000ff  // Синий
        };
        return colors[this.builderMode] || colors[2];
    }

    // Метод для создания стены из кода (с применением смещения)
    addWall(x, y, width, height) {
        // Создаем физический объект (с учетом смещения)
        const wall = this.add.rectangle(x + width / 2 + this.OFFSET_X, y + height / 2 + this.OFFSET_Y, width, height);
        this.physics.add.existing(wall, true); // true = static body
        this.walls.add(wall);

        // Стены полностью невидимы
        wall.setFillStyle(0xff0000, 0);

        console.log(`[Wall Created] at (${Math.round(x)}, ${Math.round(y)}) size ${Math.round(width)}x${Math.round(height)}`);
    }

    // Метод для создания стены напрямую по мировым координатам (БЕЗ смещения)
    createWallDirect(x, y, width, height) {
        const wall = this.add.rectangle(x + width / 2, y + height / 2, width, height);
        this.physics.add.existing(wall, true);
        this.walls.add(wall);

        // Стены полностью невидимы
        wall.setFillStyle(0xff0000, 0);

        console.log(`[Wall Created Direct] at world (${Math.round(x)}, ${Math.round(y)}) size ${Math.round(width)}x${Math.round(height)}`);
    }

    // Метод для создания зоны из кода (с применением смещения)
    addZone(x, y, width, height, name) {
        // Создаем желтый прямоугольник для интерактивной зоны (с учетом смещения)
        const zone = this.add.rectangle(x + width / 2 + this.OFFSET_X, y + height / 2 + this.OFFSET_Y, width, height);
        this.physics.add.existing(zone, true); // true = static body
        this.interactionZones.add(zone);

        // Невидимая зона
        zone.setFillStyle(0xffff00, 0);

        // Сохраняем имя зоны
        zone.zoneName = name;

        console.log(`[Zone Created] ${name} at (${Math.round(x)}, ${Math.round(y)}) size ${Math.round(width)}x${Math.round(height)}`);
    }

    // Метод для создания зоны напрямую по мировым координатам (БЕЗ смещения)
    createZoneDirect(x, y, width, height, name) {
        const zone = this.add.rectangle(x + width / 2, y + height / 2, width, height);
        this.physics.add.existing(zone, true);
        this.interactionZones.add(zone);

        zone.setFillStyle(0xffff00, 0);
        zone.zoneName = name;

        console.log(`[Zone Created Direct] ${name} at world (${Math.round(x)}, ${Math.round(y)}) size ${Math.round(width)}x${Math.round(height)}`);
    }

    addMask(x, y, width, height) {
        // Рассчитываем финальные координаты с учетом смещения
        const finalX = x + this.OFFSET_X;
        const finalY = y + this.OFFSET_Y;

        // ===== 1. ЛОГИКА МАСКИ (НЕВИДИМЫЙ СЛОЙ) =====
        // Рисуем сплошной БЕЛЫЙ прямоугольник в невидимом maskGraphics
        // Это нужно для математики маски - где нарисован прямоугольник, игрок исчезает
        this.maskGraphics.fillStyle(0xffffff, 1);
        this.maskGraphics.fillRect(finalX, finalY, width, height);

        // ===== 2. ВИЗУАЛИЗАЦИЯ (ОТЛАДКА) =====
        // Синие прямоугольники рисуются ТОЛЬКО если debugMode = true
        if (this.debugMode) {
            // Рисуем ПОЛУПРОЗРАЧНЫЙ СИНИЙ прямоугольник в debugGraphics
            // Это нужно ДЛЯ МЕНЯ, чтобы я видел, где находятся маски
            this.debugGraphics.fillStyle(0x0000ff, 0.3); // Синий с alpha 0.3
            this.debugGraphics.fillRect(finalX, finalY, width, height);

            // Рисуем обводку для лучшей видимости
            this.debugGraphics.lineStyle(2, 0x0000ff, 1);
            this.debugGraphics.strokeRect(finalX, finalY, width, height);
        }

        console.log(`[Mask Created] Logic: invisible white rect | Visual: ${this.debugMode ? 'blue translucent rect' : 'hidden'} at (${Math.round(x)}, ${Math.round(y)}) size ${Math.round(width)}x${Math.round(height)}`);
    }

    update(time, delta) {
        // Обновление игрока (только если не взаимодействуем с объектами)
        if (!this.isInteracting) {
            this.player.update(this.cursors, this.keys);
        }

        // Обновляем систему пара чайника
        this.updateSteamSystem();

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
        // (только если не взаимодействуем с объектами)
        if (this.currentZone && !this.isInteracting) {
            this.interactionIndicator.visible = true;
            // Позиционируем индикатор над головой Карины
            this.interactionIndicator.setPosition(this.player.x, this.player.y - 40);
        } else {
            this.interactionIndicator.visible = false;
        }
    }

    // Метод для создания эффекта пара над чайником
    createSteamEffect(isCloud = false) {
        // Позиция носика чайника (откуда должен идти пар)
        const kettleX = 705 + this.OFFSET_X;
        const kettleY = 269 + this.OFFSET_Y;

        // Выбираем эмодзи: либо облачко (если isCloud=true), либо рандомный пар
        const steamEmoji = isCloud ? '☁️' : '♨️';

        const steamText = this.add.text(kettleX, kettleY - 10, steamEmoji, {
            fontSize: '28px',
            fontStyle: 'bold'
        });
        steamText.setOrigin(0.5);
        steamText.setDepth(500);

        // Сохраняем в массив для последующей очистки
        this.kettleSteamTexts.push(steamText);

        // Анимация всплытия и исчезновения
        this.tweens.add({
            targets: steamText,
            y: kettleY - 70,
            alpha: 0,
            duration: 2500,
            ease: 'Sine.easeOut',
            onComplete: () => {
                steamText.destroy();
                const index = this.kettleSteamTexts.indexOf(steamText);
                if (index > -1) {
                    this.kettleSteamTexts.splice(index, 1);
                }
            }
        });

        if (isCloud) {
            console.log(`[Kettle] Cloud ${this.nextCloudIndex} of 6 appeared`);
        }
    }

    // Метод для обновления системы пара
    updateSteamSystem() {
        if (!this.isKettleBoiling) return;

        const currentTime = this.time.now;
        const elapsedTime = currentTime - this.kettleStartTime;

        // Проверяем, не пора ли показать облачко
        if (this.nextCloudIndex < this.cloudTimestamps.length) {
            const nextCloudTime = this.cloudTimestamps[this.nextCloudIndex];
            if (elapsedTime >= nextCloudTime) {
                this.createSteamEffect(true); // Облачко
                this.nextCloudIndex++;
                this.lastCloudTime = currentTime; // Запоминаем время последнего облачка
            }
        }
    }

    // Проверка: можно ли показать красный пар (не слишком близко к облачку)
    canShowRedSteam() {
        if (!this.lastCloudTime) return true;

        const currentTime = this.time.now;
        const timeSinceLastCloud = currentTime - this.lastCloudTime;

        // Не показываем красный пар в течение 800 мс после облачка
        return timeSinceLastCloud > 800;
    }

    // Метод для остановки эффекта пара
    stopSteamEffect() {
        // Останавливаем таймер
        if (this.kettleSteamTimer) {
            this.kettleSteamTimer.remove();
            this.kettleSteamTimer = null;
        }

        // Удаляем все текущие элементы пара
        this.kettleSteamTexts.forEach(text => {
            if (text && text.active) {
                text.destroy();
            }
        });
        this.kettleSteamTexts = [];
    }

    // Вспомогательный метод для показа плавающего текста
    showFloatingText(x, y, text) {
        const floatingText = this.add.text(x, y, text, {
            fontSize: '18px',
            color: '#ffaa00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
            wordWrap: { width: 300, useAdvancedWrap: true }
        });
        floatingText.setOrigin(0.5);
        floatingText.setDepth(600);

        // Анимация всплытия и исчезновения
        this.tweens.add({
            targets: floatingText,
            y: floatingText.y - 30,
            alpha: 0,
            duration: 2000,
            ease: 'Sine.easeOut',
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }

    handleInteraction(zoneName) {
        console.log(`[Interaction] Player pressed E in zone: ${zoneName}`);

        // Переход обратно в спальню
        if (zoneName === 'bedroom_door') {
            console.log('[KitchenScene] Transitioning to bedroom...');

            // Останавливаем звук чайника, если он играет
            if (this.kettleAudio && this.kettleAudio.isPlaying) {
                console.log('[Kettle] Stopping kettle sound on room exit');
                // Плавное затухание звука за 500 мс
                this.tweens.add({
                    targets: this.kettleAudio,
                    volume: 0,
                    duration: 500,
                    ease: 'Linear',
                    onComplete: () => {
                        if (this.kettleAudio) {
                            this.kettleAudio.stop();
                            this.kettleAudio = null;
                        }
                    }
                });

                // Останавливаем эффект пара
                this.stopSteamEffect();

                // Сбрасываем флаг кипения
                this.isKettleBoiling = false;
            }

            // Блокируем управление
            this.player.body.setVelocity(0, 0);

            // Запускаем эффект затемнения
            this.cameras.main.fadeOut(1000, 0, 0, 0);

            // После завершения затемнения переключаем сцену
            this.cameras.main.once('camerafadeoutcomplete', () => {
                console.log('[KitchenScene] Fade out complete, starting GameScene');
                // Передаём информацию, что пришли с кухни
                this.scene.start('GameScene', { from: 'kitchen' });
            });

            return;
        }

        // Переход в ванную/туалет
        if (zoneName === 'bathroom_door') {
            if (this.isBathroomUnlocked) {
                // Ванная уже разблокирована - переходим напрямую
                console.log('[KitchenScene] Bathroom already unlocked, transitioning...');
                this.goToBathroom();
            } else {
                // Ванная заблокирована - открываем кодовый замок
                console.log('[KitchenScene] Opening bathroom door keypad');
                this.isInteracting = true;
                this.player.body.setVelocity(0, 0);

                const bathroomKeypad = new DoorKeypad(
                    // onUnlock callback - правильный код введен
                    () => {
                        console.log('[KitchenScene] Bathroom door unlocked!');
                        this.isBathroomUnlocked = true; // Разблокируем ванную навсегда
                        this.isInteracting = false;
                        this.showFloatingText(this.player.x, this.player.y - 50, 'Ура! Дверь открылась!');

                        // Сохраняем прогресс глобально
                        if (!window.gameProgress) window.gameProgress = {};
                        window.gameProgress.bathroomUnlocked = true;

                        // Переход в BathroomScene
                        this.cameras.main.fadeOut(1000, 0, 0, 0);
                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            this.scene.start('BathroomScene');
                        });
                    },
                    // onClose callback - просто закрыли замок
                    () => {
                        console.log('[KitchenScene] Bathroom keypad closed');
                        this.isInteracting = false;
                    }
                );

                // Устанавливаем параметры замка для ванной
                bathroomKeypad.correctCode = [4, 9, 3, 6];
                bathroomKeypad.hintIcons = ['🍅', '🍽️', '🌍', '☁️'];

                // Открываем замок
                bathroomKeypad.open();
            }
            return;
        }

        // Обработка взаимодействий с объектами кухни
        switch(zoneName) {
            case 'stove':
                // Открываем оверлей духовки
                console.log('[KitchenScene] Opening oven overlay');
                this.isInteracting = true;

                // Останавливаем игрока
                this.player.body.setVelocity(0, 0);

                // Открываем оверлей с колбэком для возврата управления
                this.ovenOverlay.open(() => {
                    console.log('[KitchenScene] Oven overlay closed');
                    this.isInteracting = false;
                    this.showFloatingText(this.player.x, this.player.y - 50, 'М-м-м, как вкусно пахнет!');
                });
                break;
            case 'kettle':
                // Проверяем, кипит ли уже чайник
                if (this.isKettleBoiling) {
                    // Показываем плавающий текст над чайником
                    const floatingText = this.add.text(
                        698 + this.OFFSET_X,
                        269 + this.OFFSET_Y - 30,
                        'Уже греется...',
                        {
                            fontSize: '18px',
                            color: '#ffaa00',
                            fontStyle: 'bold',
                            stroke: '#000000',
                            strokeThickness: 3
                        }
                    );
                    floatingText.setOrigin(0.5);
                    floatingText.setDepth(600);

                    // Анимация исчезновения текста
                    this.tweens.add({
                        targets: floatingText,
                        y: floatingText.y - 20,
                        alpha: 0,
                        duration: 1500,
                        ease: 'Sine.easeOut',
                        onComplete: () => {
                            floatingText.destroy();
                        }
                    });
                    return;
                }

                // Включаем чайник
                this.isKettleBoiling = true;
                this.nextCloudIndex = 0;
                this.kettleStartTime = this.time.now;
                this.showFloatingText(this.player.x, this.player.y - 50, 'Включила чайник!');

                // Генерируем 6 рандомных таймстампов для облачков (от 3 до 50 секунд)
                this.cloudTimestamps = [];
                const BOIL_DURATION = 54000; // 54 секунды в миллисекундах
                for (let i = 0; i < 6; i++) {
                    // Рандомное время между 3 и 50 секундами
                    const randomTime = 3000 + Math.random() * 47000;
                    this.cloudTimestamps.push(randomTime);
                }
                // Сортируем по возрастанию
                this.cloudTimestamps.sort((a, b) => a - b);
                console.log('[Kettle] Cloud timestamps:', this.cloudTimestamps.map(t => (t/1000).toFixed(1) + 's'));

                // Запуск звука чайника
                this.kettleAudio = this.sound.add('kettle_sound', {
                    volume: 0.6,
                    loop: false
                });
                this.kettleAudio.play();

                // Запускаем таймер для рандомного пара ♨️ (каждые 1-3 секунды)
                const createRandomSteam = () => {
                    if (this.isKettleBoiling) {
                        // Проверяем, можно ли показать красный пар (не близко к облачку)
                        if (this.canShowRedSteam()) {
                            this.createSteamEffect(false); // Красный пар
                        }
                        // Следующий пар через 1-3 секунды
                        const nextDelay = 1000 + Math.random() * 2000;
                        this.time.delayedCall(nextDelay, createRandomSteam, [], this);
                    }
                };
                createRandomSteam();

                // Обработчик завершения звука
                this.kettleAudio.once('complete', () => {
                    console.log('[Kettle] Sound complete, kettle finished boiling');

                    // Останавливаем эффект пара
                    this.stopSteamEffect();

                    // Сбрасываем состояние
                    this.isKettleBoiling = false;
                    this.kettleAudio = null;
                    this.hasBoiledWater = true;

                    // Выводим сообщение о готовности
                    // Плавающий текст уже показывается ниже

                    // Показываем большой плавающий текст
                    const completedText = this.add.text(
                        698 + this.OFFSET_X,
                        269 + this.OFFSET_Y - 30,
                        'Вскипел! ☕️',
                        {
                            fontSize: '24px',
                            color: '#00ff00',
                            fontStyle: 'bold',
                            stroke: '#000000',
                            strokeThickness: 4
                        }
                    );
                    completedText.setOrigin(0.5);
                    completedText.setDepth(600);

                    // Анимация исчезновения текста
                    this.tweens.add({
                        targets: completedText,
                        y: completedText.y - 30,
                        alpha: 0,
                        duration: 2000,
                        ease: 'Sine.easeOut',
                        onComplete: () => {
                            completedText.destroy();
                        }
                    });
                });

                break;
            case 'wash_dishes':
                // Открываем мини-игру мытья посуды
                console.log('[KitchenScene] Starting dish washing mini-game');
                this.isInteracting = true;

                // Останавливаем игрока
                this.player.body.setVelocity(0, 0);

                // Открываем мини-игру с колбэком для возврата управления
                this.dishWashing.open(() => {
                    console.log('[KitchenScene] Dish washing mini-game closed');
                    this.isInteracting = false;
                    this.showFloatingText(this.player.x, this.player.y - 50, 'Ух! Отмыла до блеска!');
                });
                break;
            case 'feed_reksi':
                // Наполняем миску (можно делать многократно)
                console.log('[FeedReksi] Filling the bowl...');

                // Блокируем управление на время насыпания
                this.isInteracting = true;
                this.player.body.setVelocity(0, 0);

                // Звук 1: Насыпаем корм (pouring)
                const pouringSound = this.sound.add('pouring', { volume: 0.8 });
                pouringSound.play();

                // Через 6000 мс (когда корм насыпался) - голос и текст
                this.time.delayedCall(6000, () => {
                    // Звук 2: Голосовая реплика
                    const voiceSound = this.sound.add('voice_feed', { volume: 1.0 });
                    voiceSound.play();

                    // Плавающий текст (одновременно с голосом)
                    this.showFloatingText(
                        966 + this.OFFSET_X + 4, // Центр миски
                        372 + this.OFFSET_Y - 20,
                        'Рекси! Кушать подано! Идем кушать!'
                    );

                    // Сообщение в чат
                    // Плавающий текст уже показывается выше

                    // Разблокируем управление
                    this.isInteracting = false;

                    console.log('[FeedReksi] Bowl filled, Reksi called for food!');
                });
                break;
            case 'fridge':
                // Открываем оверлей холодильника
                console.log('[KitchenScene] Opening fridge overlay');
                this.isInteracting = true;

                // Останавливаем игрока
                this.player.body.setVelocity(0, 0);

                // Открываем оверлей с колбэком для возврата управления
                this.fridgeOverlay.open(() => {
                    console.log('[KitchenScene] Fridge overlay closed');
                    this.isInteracting = false;
                    this.showFloatingText(this.player.x, this.player.y - 50, 'Хорошая коллекция магнитиков!');
                });
                break;
            case 'kitchen_table':
                // Останавливаем предыдущий звук, если он играет
                if (this.tableVoiceAudio && this.tableVoiceAudio.isPlaying) {
                    console.log('[KitchenTable] Stopping previous voice');
                    this.tableVoiceAudio.stop();
                    this.tableVoiceAudio = null;
                }

                // Случайный выбор варианта (50/50)
                const randomChoice = Math.random() < 0.5;

                if (randomChoice) {
                    // Вариант А: чипсы
                    console.log('[KitchenTable] Playing voice_chips');
                    this.tableVoiceAudio = this.sound.add('voice_chips', { volume: 0.7 });
                    this.tableVoiceAudio.play();

                    // Плавающий текст
                    this.showFloatingText(
                        971 + this.OFFSET_X + 62, // Центр стола
                        473 + this.OFFSET_Y - 20,
                        'Последняя чипсина — самая вкусная.'
                    );

                    // Сообщение в чат
                    // Плавающий текст уже показывается выше
                } else {
                    // Вариант Б: огурчики
                    console.log('[KitchenTable] Playing voice_pickles');
                    this.tableVoiceAudio = this.sound.add('voice_pickles', { volume: 0.7 });
                    this.tableVoiceAudio.play();

                    // Плавающий текст
                    this.showFloatingText(
                        971 + this.OFFSET_X + 62, // Центр стола
                        473 + this.OFFSET_Y - 20,
                        'М-м-м... С солеными огурчиками!'
                    );

                    // Сообщение в чат
                    // Плавающий текст уже показывается выше
                }
                break;
        }
    }

    goToBathroom() {
        console.log('[KitchenScene] Going to bathroom...');

        // Блокируем управление
        this.player.body.setVelocity(0, 0);

        // Запускаем эффект затемнения
        this.cameras.main.fadeOut(1000, 0, 0, 0);

        // После завершения затемнения переключаем сцену
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('BathroomScene');
        });
    }
}
