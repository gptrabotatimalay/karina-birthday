import Phaser from 'phaser';

export default class NPC extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, name, dialogue) {
        super(scene, x, y, texture);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.npcName = name;
        this.dialogue = dialogue;
        this.isInteractable = true;

        // Масштаб под новую архитектуру с большим фоном
        this.setScale(4);

        // Настройка физики
        this.body.setImmovable(true);
        this.body.setSize(12, 14);
        this.body.setOffset(2, 2);

        // Создание анимаций
        this.createAnimations();
    }

    createAnimations() {
        const anims = this.scene.anims;
        const key = this.texture.key;

        // Анимация сидения (для Даши на пуфике)
        // Для Даши: кадр 10 (11-й столбец при спрайтах 32x32)
        if (!anims.exists(`${key}-sit`)) {
            anims.create({
                key: `${key}-sit`,
                frames: [{ key: key, frame: 10 }], // 11-й столбец = индекс 10
                frameRate: 1
            });
        }

        // Idle анимация (стоя)
        if (!anims.exists(`${key}-idle`)) {
            anims.create({
                key: `${key}-idle`,
                frames: [{ key: key, frame: 1 }],
                frameRate: 1
            });
        }

        // Запуск анимации сидения
        this.play(`${key}-sit`);
    }

    interact() {
        if (this.isInteractable) {
            this.showDialogue();
        }
    }

    showDialogue() {
        // Создание диалогового окна
        const dialogueBox = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.height - 100,
            1000,
            120,
            0x000000,
            0.8
        );
        dialogueBox.setScrollFactor(0);
        dialogueBox.setDepth(1000);

        const nameText = this.scene.add.text(
            this.scene.cameras.main.centerX - 480,
            this.scene.cameras.main.height - 140,
            this.npcName,
            {
                font: 'bold 20px Arial',
                fill: '#ffcc00'
            }
        );
        nameText.setScrollFactor(0);
        nameText.setDepth(1001);

        const dialogueText = this.scene.add.text(
            this.scene.cameras.main.centerX - 480,
            this.scene.cameras.main.height - 110,
            this.dialogue,
            {
                font: '18px Arial',
                fill: '#ffffff',
                wordWrap: { width: 950 }
            }
        );
        dialogueText.setScrollFactor(0);
        dialogueText.setDepth(1001);

        // Удаление диалога через 3 секунды или по нажатию E
        this.scene.time.delayedCall(3000, () => {
            dialogueBox.destroy();
            nameText.destroy();
            dialogueText.destroy();
        });
    }

    update() {
        // Обновление depth для 2.5D эффекта
        this.setDepth(this.y);
    }
}
