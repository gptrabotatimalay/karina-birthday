# 🛠️ Руководство по разработке

Это руководство поможет вам расширить функционал игры и добавить новые фичи.

## 📐 Архитектура

### Основные компоненты

```
Phaser Game Config (main.js)
    ↓
BootScene → PreloadScene → GameScene
                              ↓
                    Player, NPC, Cat (entities)
```

## 🎭 Добавление новых персонажей

### Создание нового NPC

```javascript
// В GameScene.js, метод create()

import NPC from '../entities/NPC';

this.newNPC = new NPC(
    this,
    600,          // x позиция
    400,          // y позиция
    'npc_sprite', // texture key
    'Имя NPC',    // имя
    'Текст диалога...' // диалог
);

// Добавить коллизию с игроком
this.physics.add.collider(this.player, this.newNPC);
```

### Создание персонажа с кастомным поведением

```javascript
// src/entities/CustomCharacter.js

import Phaser from 'phaser';

export default class CustomCharacter extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'custom_sprite');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 100;
    }

    update(time, delta) {
        // Кастомная логика
        this.setDepth(this.y); // Не забывайте depth sorting!
    }
}
```

## 🏠 Добавление новых комнат

### Создание кухни

```javascript
// В GameScene.js

createKitchen() {
    // Фон
    const kitchenFloor = this.add.rectangle(1200, 300, 600, 500, 0xF5DEB3);
    kitchenFloor.setDepth(0);

    // Холодильник
    const fridge = this.add.rectangle(1100, 150, 80, 120, 0xC0C0C0);
    fridge.setDepth(150);
    this.add.text(1100, 150, '🧊', { font: '48px Arial' })
        .setOrigin(0.5)
        .setDepth(151);

    // Коллайдер для холодильника
    const fridgeCollider = this.physics.add.staticSprite(1100, 150);
    fridgeCollider.body.setSize(80, 120);
    fridgeCollider.setVisible(false);

    this.physics.add.collider(this.player, fridgeCollider);
}

// Вызвать в create()
create() {
    this.createKarinaRoom();
    this.createKitchen(); // Новая комната
    // ...
}
```

## 🎨 Работа с тайлмапами (Tiled Editor)

### Создание карты в Tiled

1. Скачайте **Tiled Map Editor**: https://www.mapeditor.org/
2. Создайте новую карту: 50×40 тайлов, размер тайла 32×32
3. Добавьте тайлсеты (File → New Tileset)
4. Нарисуйте карту
5. Экспортируйте как JSON: File → Export As → apartment.json

### Загрузка тайлмапа

```javascript
// В PreloadScene.js
preload() {
    this.load.image('tiles', 'assets/tilesets/interior_tiles.png');
    this.load.tilemapTiledJSON('apartment', 'assets/tilemaps/apartment.json');
}

// В GameScene.js
create() {
    const map = this.make.tilemap({ key: 'apartment' });
    const tileset = map.addTilesetImage('interior', 'tiles');

    const floorLayer = map.createLayer('Floor', tileset, 0, 0);
    const wallLayer = map.createLayer('Walls', tileset, 0, 0);

    // Настройка коллизий
    wallLayer.setCollisionByProperty({ collides: true });
    this.physics.add.collider(this.player, wallLayer);
}
```

## 🎯 Система квестов

### Простая квестовая система

```javascript
// src/systems/QuestManager.js

export default class QuestManager {
    constructor(scene) {
        this.scene = scene;
        this.quests = new Map();
        this.activeQuests = [];
    }

    addQuest(id, quest) {
        this.quests.set(id, {
            title: quest.title,
            description: quest.description,
            objectives: quest.objectives,
            completed: false,
            progress: 0
        });
    }

    completeObjective(questId, objectiveIndex) {
        const quest = this.quests.get(questId);
        if (quest) {
            quest.progress++;
            if (quest.progress >= quest.objectives.length) {
                quest.completed = true;
                this.onQuestComplete(questId);
            }
        }
    }

    onQuestComplete(questId) {
        console.log(`Квест ${questId} завершён!`);
        // Показать уведомление
        // Дать награду
    }
}

// Использование в GameScene.js
import QuestManager from '../systems/QuestManager';

create() {
    this.questManager = new QuestManager(this);

    this.questManager.addQuest('talk_to_dasha', {
        title: 'Поговори с Дашей',
        description: 'Узнай, как дела у Даши',
        objectives: ['Найти Дашу', 'Поговорить с ней']
    });
}
```

## 🎒 Система инвентаря

```javascript
// src/systems/Inventory.js

export default class Inventory {
    constructor() {
        this.items = [];
        this.maxSlots = 20;
    }

    addItem(item) {
        if (this.items.length < this.maxSlots) {
            this.items.push(item);
            return true;
        }
        return false;
    }

    removeItem(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }

    hasItem(itemId) {
        return this.items.some(item => item.id === itemId);
    }
}

// UI инвентаря в GameScene
createInventoryUI() {
    const inventoryBg = this.add.rectangle(
        this.cameras.main.width - 200,
        100,
        180,
        300,
        0x000000,
        0.7
    );
    inventoryBg.setScrollFactor(0);
    inventoryBg.setDepth(900);

    // Отрисовка слотов
    for (let i = 0; i < 10; i++) {
        const slot = this.add.rectangle(
            this.cameras.main.width - 240 + (i % 5) * 40,
            120 + Math.floor(i / 5) * 40,
            35,
            35,
            0x333333
        );
        slot.setScrollFactor(0);
        slot.setDepth(901);
        slot.setStrokeStyle(2, 0x666666);
    }
}
```

## 🔊 Добавление звука

```javascript
// В PreloadScene.js
preload() {
    this.load.audio('bgm', 'assets/sounds/background_music.mp3');
    this.load.audio('step', 'assets/sounds/footstep.wav');
    this.load.audio('meow', 'assets/sounds/cat_meow.wav');
}

// В GameScene.js
create() {
    this.bgMusic = this.sound.add('bgm', {
        loop: true,
        volume: 0.5
    });
    this.bgMusic.play();

    this.stepSound = this.sound.add('step', { volume: 0.3 });
    this.meowSound = this.sound.add('meow', { volume: 0.6 });
}

// В Player.js
update() {
    if (isMoving && !this.stepSound.isPlaying) {
        this.scene.stepSound.play();
    }
}

// В Cat.js
interact() {
    this.scene.meowSound.play();
}
```

## 💾 Система сохранения

```javascript
// src/systems/SaveSystem.js

export default class SaveSystem {
    static save(data) {
        const saveData = {
            playerPosition: { x: data.x, y: data.y },
            inventory: data.inventory,
            quests: data.quests,
            timestamp: Date.now()
        };

        localStorage.setItem('karina_rpg_save', JSON.stringify(saveData));
    }

    static load() {
        const saved = localStorage.getItem('karina_rpg_save');
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    }

    static deleteSave() {
        localStorage.removeItem('karina_rpg_save');
    }
}

// Использование
import SaveSystem from '../systems/SaveSystem';

// Сохранение
SaveSystem.save({
    x: this.player.x,
    y: this.player.y,
    inventory: this.inventory.items,
    quests: this.questManager.quests
});

// Загрузка
const saveData = SaveSystem.load();
if (saveData) {
    this.player.setPosition(saveData.playerPosition.x, saveData.playerPosition.y);
}
```

## 🌙 Система освещения

```javascript
// В GameScene.js

create() {
    // Создаём слой темноты
    this.darkness = this.add.rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000,
        0.7
    );
    this.darkness.setScrollFactor(0);
    this.darkness.setDepth(800);

    // Создаём свет вокруг игрока
    this.playerLight = this.add.circle(
        this.player.x,
        this.player.y,
        100,
        0xFFFFAA,
        0.3
    );
    this.playerLight.setDepth(801);
    this.playerLight.setBlendMode(Phaser.BlendModes.ADD);
}

update() {
    // Свет следует за игроком
    this.playerLight.setPosition(this.player.x, this.player.y);
}
```

## 🎮 Мини-игры

### Пример простой мини-игры

```javascript
// src/scenes/MinigameScene.js

export default class MinigameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MinigameScene' });
    }

    create() {
        this.score = 0;

        const scoreText = this.add.text(20, 20, 'Счёт: 0', {
            font: '24px Arial',
            fill: '#fff'
        });

        // Логика мини-игры
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.score++;
                scoreText.setText(`Счёт: ${this.score}`);

                if (this.score >= 10) {
                    this.winMinigame();
                }
            },
            loop: true
        });

        // Кнопка выхода
        const exitBtn = this.add.text(20, 60, 'Выход (ESC)', {
            font: '18px Arial',
            fill: '#ff0000'
        });

        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });
    }

    winMinigame() {
        this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'Победа!',
            { font: 'bold 48px Arial', fill: '#00ff00' }
        ).setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });
    }
}

// Запуск из GameScene
handleInteraction() {
    // Если взаимодействуем с игровым автоматом
    if (interactingWithArcade) {
        this.scene.pause();
        this.scene.launch('MinigameScene');
    }
}
```

## 🔧 Полезные утилиты

### Генератор случайных позиций

```javascript
function getRandomPosition(scene, bounds) {
    return {
        x: Phaser.Math.Between(bounds.x, bounds.x + bounds.width),
        y: Phaser.Math.Between(bounds.y, bounds.y + bounds.height)
    };
}
```

### Проверка дистанции между объектами

```javascript
function isNearby(obj1, obj2, range = 50) {
    const distance = Phaser.Math.Distance.Between(
        obj1.x, obj1.y,
        obj2.x, obj2.y
    );
    return distance < range;
}
```

### Простой таймер обратного отсчёта

```javascript
createCountdown(duration, onComplete) {
    let remaining = duration;

    const text = this.add.text(
        this.cameras.main.centerX,
        50,
        `Время: ${remaining}`,
        { font: 'bold 24px Arial', fill: '#fff' }
    );
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(999);

    this.time.addEvent({
        delay: 1000,
        callback: () => {
            remaining--;
            text.setText(`Время: ${remaining}`);

            if (remaining <= 0) {
                text.destroy();
                onComplete();
            }
        },
        repeat: duration - 1
    });
}
```

## 📝 Рекомендации

### Performance

1. **Используйте Object Pooling** для часто создаваемых объектов
2. **Ограничьте количество физических тел** (используйте статичные спрайты где возможно)
3. **Оптимизируйте текстуры** (используйте sprite atlases)

### Организация кода

1. Держите логику персонажей в классах entities
2. Системы (квесты, инвентарь) - отдельные классы
3. UI элементы - отдельные методы
4. Константы - в отдельном файле `config.js`

### Debugging

```javascript
// Включить debug режим физики
physics: {
    default: 'arcade',
    arcade: {
        debug: true  // Покажет коллайдеры
    }
}

// Логирование позиции игрока
update() {
    if (this.input.keyboard.addKey('P').isDown) {
        console.log(`Player: x=${this.player.x}, y=${this.player.y}`);
    }
}
```

## 🎓 Дополнительные ресурсы

- **Phaser 3 Docs**: https://photonstorm.github.io/phaser3-docs/
- **Phaser Examples**: https://phaser.io/examples
- **Phaser Discord**: https://discord.gg/phaser
- **Game Dev tutorials**: https://gamedevacademy.org/

---

**Счастливой разработки!** 🚀
