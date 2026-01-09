import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.speed = 160;
        this.interactionRange = 50;

        // Масштаб под новую архитектуру с большим фоном
        this.setScale(4);

        // Настройка физики
        // this.setCollideWorldBounds(true); // Временно отключено
        // Уменьшаем коллайдер и смещаем вниз к ногам
        this.body.setSize(10, 8);  // Меньший размер для тела
        this.body.setOffset(3, 24); // Смещаем вниз к ногам (24 пикселя вниз)

        // Создание анимаций для всех 4 направлений
        this.createAnimations();

        // Начальная анимация
        this.play('karina-idle-down');
    }

    createAnimations() {
        const anims = this.scene.anims;

        // Раскладка спрайт-листа "Karina wasd.png" 64x32 (голова + тело):
        // 64px / 16px = 4 кадра в ширину
        // 32px / 32px = 1 ряд
        //
        // Всего 4 статичных кадра:
        // - Кадр 0: смотрит вправо
        // - Кадр 1: смотрит вверх
        // - Кадр 2: смотрит влево
        // - Кадр 3: смотрит вниз

        // Анимации ходьбы из "Karina run.png" (384x32, 24 кадра):
        // - Столбцы 1-6 (кадры 0-5): вправо
        // - Столбцы 7-12 (кадры 6-11): вверх
        // - Столбцы 13-18 (кадры 12-17): влево
        // - Столбцы 19-24 (кадры 18-23): вниз

        if (!anims.exists('karina-walk-down')) {
            // Анимация ходьбы вправо (кадры 0-5)
            anims.create({
                key: 'karina-walk-right',
                frames: anims.generateFrameNumbers('karina-run', { start: 0, end: 5 }),
                frameRate: 10,
                repeat: -1
            });

            // Анимация ходьбы вверх (кадры 6-11)
            anims.create({
                key: 'karina-walk-up',
                frames: anims.generateFrameNumbers('karina-run', { start: 6, end: 11 }),
                frameRate: 10,
                repeat: -1
            });

            // Анимация ходьбы влево (кадры 12-17)
            anims.create({
                key: 'karina-walk-left',
                frames: anims.generateFrameNumbers('karina-run', { start: 12, end: 17 }),
                frameRate: 10,
                repeat: -1
            });

            // Анимация ходьбы вниз (кадры 18-23)
            anims.create({
                key: 'karina-walk-down',
                frames: anims.generateFrameNumbers('karina-run', { start: 18, end: 23 }),
                frameRate: 10,
                repeat: -1
            });

            // Idle анимации (столбцы 1-4)
            anims.create({
                key: 'karina-idle-right',
                frames: [{ key: 'karina', frame: 0 }],
                frameRate: 1
            });

            anims.create({
                key: 'karina-idle-up',
                frames: [{ key: 'karina', frame: 1 }],
                frameRate: 1
            });

            anims.create({
                key: 'karina-idle-left',
                frames: [{ key: 'karina', frame: 2 }],
                frameRate: 1
            });

            anims.create({
                key: 'karina-idle-down',
                frames: [{ key: 'karina', frame: 3 }],
                frameRate: 1
            });
        }
    }

    update(cursors, keys) {
        // Сброс скорости
        this.setVelocity(0);

        let isMoving = false;
        let direction = null;

        // WASD управление
        if (keys.W.isDown) {
            this.setVelocityY(-this.speed);
            direction = 'up';
            isMoving = true;
        } else if (keys.S.isDown) {
            this.setVelocityY(this.speed);
            direction = 'down';
            isMoving = true;
        }

        if (keys.A.isDown) {
            this.setVelocityX(-this.speed);
            direction = 'left';
            isMoving = true;
        } else if (keys.D.isDown) {
            this.setVelocityX(this.speed);
            direction = 'right';
            isMoving = true;
        }

        // Нормализация диагонального движения
        if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
            this.setVelocity(
                this.body.velocity.x * 0.7071,
                this.body.velocity.y * 0.7071
            );
        }

        // Обновление анимации
        if (isMoving && direction) {
            this.play(`karina-walk-${direction}`, true);
            this.lastDirection = direction;
        } else if (this.lastDirection) {
            this.play(`karina-idle-${this.lastDirection}`, true);
        }

        // ВАЖНО: Обновление depth для 2.5D эффекта
        this.setDepth(this.y);
    }
}
