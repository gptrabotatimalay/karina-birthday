import Phaser from 'phaser';

export default class Cat extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'reksi');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.speed = 60;
        this.idleTime = 0;
        this.wanderCooldown = 0;

        // Настройка физики
        this.body.setSize(24, 24);
        this.body.setOffset(4, 8);

        // Создание анимаций
        this.createAnimations();

        // Начальная анимация
        this.play('reksi-idle');
    }

    createAnimations() {
        const anims = this.scene.anims;

        // Анимация ходьбы
        if (!anims.exists('reksi-walk')) {
            anims.create({
                key: 'reksi-walk',
                frames: anims.generateFrameNumbers('reksi', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Анимация idle
        if (!anims.exists('reksi-idle')) {
            anims.create({
                key: 'reksi-idle',
                frames: anims.generateFrameNumbers('reksi', { start: 4, end: 7 }),
                frameRate: 4,
                repeat: -1
            });
        }

        // Анимация сна
        if (!anims.exists('reksi-sleep')) {
            anims.create({
                key: 'reksi-sleep',
                frames: [{ key: 'reksi', frame: 8 }],
                frameRate: 1
            });
        }
    }

    update(time, delta) {
        // Обновление depth для 2.5D эффекта
        this.setDepth(this.y);

        // Простое AI поведение: блуждание
        this.wanderCooldown -= delta;

        if (this.wanderCooldown <= 0) {
            this.wanderCooldown = Phaser.Math.Between(2000, 5000);

            const action = Phaser.Math.Between(0, 10);

            if (action < 3) {
                // Блуждание
                const angle = Phaser.Math.Between(0, 360);
                const rad = Phaser.Math.DegToRad(angle);
                this.setVelocity(
                    Math.cos(rad) * this.speed,
                    Math.sin(rad) * this.speed
                );
                this.play('reksi-walk', true);
            } else if (action < 7) {
                // Стоять
                this.setVelocity(0);
                this.play('reksi-idle', true);
            } else {
                // Спать
                this.setVelocity(0);
                this.play('reksi-sleep', true);
            }
        }
    }

    interact() {
        // Мяуканье при взаимодействии
        this.setVelocity(0);
        this.play('reksi-idle', true);

        const meowText = this.scene.add.text(
            this.x,
            this.y - 40,
            'Мяу! 🐱',
            {
                font: 'bold 16px Arial',
                fill: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        meowText.setOrigin(0.5);
        meowText.setDepth(2000);

        this.scene.time.delayedCall(1500, () => {
            meowText.destroy();
        });
    }
}
