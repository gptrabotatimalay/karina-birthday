import Phaser from 'phaser';
import Player from '../entities/Player';
import musicManager from '../managers/MusicManager';
import BathtubOverlay from '../components/BathtubOverlay';
import MirrorOverlay from '../components/MirrorOverlay';

export default class BathroomScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BathroomScene' });
    }

    create() {
        // ===== ЭФФЕКТ ПРОЯВЛЕНИЯ ПРИ ВХОДЕ =====
        this.cameras.main.fadeIn(1000, 0, 0, 0); // Плавное появление из черного экрана

        // ===== ОБНОВЛЕНИЕ ГРОМКОСТИ МУЗЫКИ =====
        // При входе в ванную обновляем громкость музыки
        musicManager.updateVolumeForRoom('BathroomScene');

        // ===== СОСТОЯНИЕ ВЗАИМОДЕЙСТВИЯ =====
        this.isInteracting = false; // Флаг блокировки управления во время взаимодействия

        // ===== СОСТОЯНИЕ ЗАГАДКИ =====
        this.isBathHot = false; // Флаг: наполнена ли ванна горячей водой

        // ===== ИНИЦИАЛИЗАЦИЯ ОВЕРЛЕЕВ =====
        this.bathtubOverlay = new BathtubOverlay();
        this.mirrorOverlay = new MirrorOverlay();

        // ===== НОВАЯ АРХИТЕКТУРА: BACKGROUND IMAGE =====

        // ВАЖНО: Картинка вертикальная (узкая и высокая)
        // Используем другое смещение для центрирования
        this.OFFSET_X = -200; // Сдвиг влево на 200 пикселей
        this.OFFSET_Y = 0; // Без вертикального смещения

        // Загрузка и установка фона ванной
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;

        this.background = this.add.image(gameWidth / 2 + this.OFFSET_X, gameHeight / 2, 'bathroom_bg');

        // Масштабируем фон - уменьшаем в 2 раза
        // Вертикальная картинка - подгоняем под высоту окна
        const scaleY = gameHeight / this.background.height;
        this.background.setScale(scaleY * 0.5); // Уменьшаем в 2 раза

        // Получаем размеры фона после масштабирования
        const BG_WIDTH = this.background.displayWidth;
        const BG_HEIGHT = this.background.displayHeight;

        console.log(`[BathroomScene] Background size: ${BG_WIDTH}x${BG_HEIGHT}`);

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
        this.physics.world.setBounds(0, 0, BG_WIDTH, BG_HEIGHT);

        // ===== СОЗДАНИЕ ПЕРСОНАЖЕЙ =====
        // Точка спавна - у двери (координаты зоны двери + смещение)
        const spawnX = 691 + this.OFFSET_X + 25; // Справа от двери
        const spawnY = 430 + this.OFFSET_Y ; // В центре высоты двери

        // Карина (Player)
        this.player = new Player(this, spawnX, spawnY, 'karina');

        // Устанавливаем начальную анимацию - лицом вправо (idle-right)
        this.player.play('karina-idle-right');
        this.player.lastDirection = 'right';

        console.log(`[BathroomScene] Player spawned at: ${spawnX}, ${spawnY}`);

        // ===== ИНИЦИАЛИЗАЦИЯ СТЕН =====
        this.walls = this.physics.add.staticGroup();
        this.physics.add.collider(this.player, this.walls);

        // Стены ванной комнаты
        this.addWall(697, 239, 213, 122);
        this.addWall(840, 358, 78, 139);
        this.addWall(788, 357, 51, 47);
        this.addWall(696, 359, 70, 35);
        this.addWall(699, 393, 66, 8);
        this.addWall(899, 498, 30, 66);
        this.addWall(852, 539, 45, 32);
        this.addWall(856, 533, 45, 12);
        this.addWall(921, 567, 26, 37);
        this.addWall(666, 660, 276, 9);
        this.addWall(659, 478, 9, 182);
        this.addWall(667, 525, 67, 150);
        this.addWall(665, 498, 83, 100);
        this.addWall(709, 593, 33, 29);
        this.addWall(689, 618, 50, 14);
        this.addWall(718, 592, 28, 15);
        this.addWall(656, 377, 41, 47);
        this.addWall(649, 413, 47, 35);
        this.addWall(633, 439, 61, 27);
        this.addWall(618, 452, 72, 28);
        this.addWall(647, 472, 41, 23);
        this.addWall(931, 414, 8, 258);

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
        // Зона выхода (назад на кухню) - у двери
        this.addZone(691, 433, 10, 51, 'kitchen_door');

        // Интерактивные объекты ванной
        this.addZone(717, 421, 36, 10, 'sink');        // Раковина (открывает зеркало)
        this.addZone(820, 421, 10, 86, 'bathtub');     // Ванна
        this.addZone(830, 561, 15, 15, 'toilet');      // Туалет

        // ===== ИНСТРУМЕНТЫ ДЛЯ ОТЛАДКИ =====
        this.setupDebugTools(); // Включены для рисования зон

        // Настройка управления
        this.setupControls();

        // Настройка камеры
        this.cameras.main.setBounds(0, 0, gameWidth, gameHeight);
        this.cameras.main.setZoom(1);
        // Для вертикальной комнаты камера фиксированная (не следует за игроком)
        // Если нужно следование - раскомментировать:
        // this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        console.log('[BathroomScene] Scene ready!');
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

    createDialogWindow(bgWidth, bgHeight) {
        // Размеры и позиция диалогового окна
        const dialogWidth = 300;
        const dialogHeight = 400;
        // Размещаем справа от фона
        const dialogX = this.background.x + bgWidth / 2 + 200;
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

        // Добавляем приветственное сообщение
        this.addChatMessage('Карина', 'Вот я и в ванной!', '#00ffff');

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
            if (this.currentZone && !this.isInteracting) {
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
        // Режим рисования: 'walls' или 'zones'
        this.drawMode = 'zones'; // По умолчанию режим зон

        // Текст координат в левом верхнем углу
        this.coordsText = this.add.text(10, 10, 'Mouse: 0, 0 | Mode: ZONES (Yellow) | Press T to toggle', {
            fontSize: '16px',
            color: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        this.coordsText.setScrollFactor(0); // Фиксируем на экране
        this.coordsText.setDepth(1000);

        // Клавиша T для переключения режима
        this.toggleKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
        this.toggleKey.on('down', () => {
            this.drawMode = this.drawMode === 'zones' ? 'walls' : 'zones';
            this.updateDebugText();
            console.log(`[DEBUG] Switched to ${this.drawMode.toUpperCase()} mode`);
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
            const color = this.drawMode === 'walls' ? 0xff0000 : 0xffff00;
            this.drawRect = this.add.rectangle(worldX, worldY, 1, 1, color, 0.3);
        });

        this.input.on('pointermove', (pointer) => {
            const worldX = Math.round(pointer.worldX);
            const worldY = Math.round(pointer.worldY);
            this.updateDebugText(worldX, worldY);

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
                    const correctedX = Math.round(x - this.OFFSET_X);
                    const correctedY = Math.round(y - this.OFFSET_Y);
                    const roundedWidth = Math.round(width);
                    const roundedHeight = Math.round(height);

                    if (this.drawMode === 'walls') {
                        // Выводим код для стены в консоль
                        console.log(`this.addWall(${correctedX}, ${correctedY}, ${roundedWidth}, ${roundedHeight});`);
                        this.createWallDirect(x, y, width, height);
                    } else {
                        // Выводим код для интерактивной зоны в консоль
                        console.log(`this.addZone(${correctedX}, ${correctedY}, ${roundedWidth}, ${roundedHeight}, 'name');`);
                        this.createZoneDirect(x, y, width, height, 'debug_zone');
                    }
                }

                this.drawStart = null;
            }
        });
    }

    updateDebugText(mouseX, mouseY) {
        const modeText = this.drawMode === 'walls' ? 'WALLS (Red)' : 'ZONES (Yellow)';
        const modeColor = this.drawMode === 'walls' ? '#ff0000' : '#ffff00';

        if (mouseX !== undefined && mouseY !== undefined) {
            this.coordsText.setText(`Mouse: ${mouseX}, ${mouseY} | Mode: ${modeText} | Press T to toggle`);
        } else {
            this.coordsText.setText(`Mode: ${modeText} | Press T to toggle`);
        }
        this.coordsText.setColor(modeColor);
    }

    // Метод для создания стены из кода (с применением смещения)
    addWall(x, y, width, height) {
        const wall = this.add.rectangle(x + width / 2 + this.OFFSET_X, y + height / 2 + this.OFFSET_Y, width, height);
        this.physics.add.existing(wall, true);
        this.walls.add(wall);
        wall.setFillStyle(0xff0000, 0);
        console.log(`[Wall Created] at (${Math.round(x)}, ${Math.round(y)}) size ${Math.round(width)}x${Math.round(height)}`);
    }

    // Метод для создания стены напрямую по мировым координатам
    createWallDirect(x, y, width, height) {
        const wall = this.add.rectangle(x + width / 2, y + height / 2, width, height);
        this.physics.add.existing(wall, true);
        this.walls.add(wall);
        // Делаем стены видимыми в режиме отладки (красные с прозрачностью)
        wall.setFillStyle(0xff0000, 0.3);
        wall.setStrokeStyle(2, 0xff0000, 1);
        console.log(`[Wall Created Direct] at world (${Math.round(x)}, ${Math.round(y)}) size ${Math.round(width)}x${Math.round(height)}`);
    }

    // Метод для создания зоны из кода (с применением смещения)
    addZone(x, y, width, height, name) {
        const zone = this.add.rectangle(x + width / 2 + this.OFFSET_X, y + height / 2 + this.OFFSET_Y, width, height);
        this.physics.add.existing(zone, true);
        this.interactionZones.add(zone);
        zone.setFillStyle(0xffff00, 0.3);
        zone.setStrokeStyle(2, 0xffff00, 1);
        zone.zoneName = name;
        console.log(`[Zone Created] ${name} at (${Math.round(x)}, ${Math.round(y)}) size ${Math.round(width)}x${Math.round(height)}`);
    }

    // Метод для создания зоны напрямую по мировым координатам
    createZoneDirect(x, y, width, height, name) {
        const zone = this.add.rectangle(x + width / 2, y + height / 2, width, height);
        this.physics.add.existing(zone, true);
        this.interactionZones.add(zone);
        zone.setFillStyle(0xffff00, 0.3);
        zone.setStrokeStyle(2, 0xffff00, 1);
        zone.zoneName = name;
        console.log(`[Zone Created Direct] ${name} at world (${Math.round(x)}, ${Math.round(y)}) size ${Math.round(width)}x${Math.round(height)}`);
    }

    update(time, delta) {
        // Обработка диалогового ввода
        this.handleDialogInput();

        // Обновление игрока (только если не взаимодействуем с объектами)
        if (!this.isInteracting) {
            this.player.update(this.cursors, this.keys);
        }

        // ===== ПРОВЕРКА ПЕРЕСЕЧЕНИЯ С ИНТЕРАКТИВНЫМИ ЗОНАМИ =====
        let foundZone = null;

        this.interactionZones.children.entries.forEach(zone => {
            if (this.physics.overlap(this.player, zone)) {
                foundZone = zone.zoneName;
            }
        });

        // Обновляем текущую зону
        this.currentZone = foundZone;

        // Показываем/скрываем индикатор "!"
        if (this.currentZone && !this.isInteracting) {
            this.interactionIndicator.visible = true;
            this.interactionIndicator.setPosition(this.player.x, this.player.y - 40);
        } else {
            this.interactionIndicator.visible = false;
        }
    }

    handleInteraction(zoneName) {
        console.log(`[Interaction] Player pressed E in zone: ${zoneName}`);

        // Переход обратно на кухню
        if (zoneName === 'kitchen_door') {
            console.log('[BathroomScene] Transitioning to kitchen...');

            // Блокируем управление
            this.player.body.setVelocity(0, 0);

            // Запускаем эффект затемнения
            this.cameras.main.fadeOut(1000, 0, 0, 0);

            // После завершения затемнения переключаем сцену
            this.cameras.main.once('camerafadeoutcomplete', () => {
                console.log('[BathroomScene] Fade out complete, starting KitchenScene');
                // Передаём информацию, что пришли из ванной
                this.scene.start('KitchenScene', { from: 'bathroom' });
            });

            return;
        }

        // Взаимодействие с раковиной (открывает зеркало)
        if (zoneName === 'sink') {
            // Блокируем управление
            this.isInteracting = true;
            this.player.body.setVelocity(0, 0);

            // Открываем оверлей зеркала с текущим состоянием
            this.mirrorOverlay.open(
                this.isBathHot, // Передаём состояние запотевания
                () => {
                    this.isInteracting = false;
                    console.log('[BathroomScene] Mirror overlay closed');
                }
            );
            return;
        }

        // Взаимодействие с ванной
        if (zoneName === 'bathtub') {
            // Блокируем управление
            this.isInteracting = true;
            this.player.body.setVelocity(0, 0);

            // Открываем оверлей ванны
            this.bathtubOverlay.open(
                // Колбэк при завершении наполнения
                () => {
                    console.log('[BathroomScene] Bath is now hot! Mirror will be steamy.');
                    this.isBathHot = true;
                    this.addChatMessage('Карина', 'Ванна наполнена! Теперь здесь так парно...', '#00ffff');
                },
                // Колбэк при закрытии оверлея
                () => {
                    this.isInteracting = false;
                    console.log('[BathroomScene] Bathtub overlay closed');
                }
            );
            return;
        }

        // Взаимодействие с туалетом
        if (zoneName === 'toilet') {
            // Блокируем управление на время воспроизведения
            this.isInteracting = true;
            this.player.body.setVelocity(0, 0);

            // Проигрываем звук (громкость 1.0)
            const toiletVoice = this.sound.add('voice_toilet', { volume: 1.0 });
            toiletVoice.play();

            console.log('[Toilet] Playing voice_toilet sound');

            // Первая строчка текста - сразу
            this.showFloatingText(
                this.player.x,
                this.player.y - 40,
                'Бляяя... Утопила свой телефон... 📱💦'
            );

            // Вторая строчка текста - через 1.5 секунды
            this.time.delayedCall(3000, () => {
                this.showFloatingText(
                    this.player.x,
                    this.player.y - 40,
                    'Хорошо, что я по-маленькому...'
                );
            }, [], this);

            // Разблокируем управление через 4 секунды (после окончания звука)
            this.time.delayedCall(4000, () => {
                this.isInteracting = false;
                console.log('[Toilet] Voice playback complete, controls unlocked');
            }, [], this);

            return;
        }
    }

    // Вспомогательный метод для показа плавающего текста
    showFloatingText(x, y, text) {
        const floatingText = this.add.text(x, y, text, {
            fontSize: '18px',
            color: '#00ffff',
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
}
