# 📂 Структура проекта - Karina's RPG Quest

```
karina-rpg-quest/
│
├── 📄 index.html                    # Главная HTML страница
├── 📄 package.json                  # Конфигурация npm
├── 📄 vite.config.js                # Настройки Vite
├── 📄 .gitignore                    # Игнорируемые файлы для Git
│
├── 📖 README.md                     # Основное описание проекта
├── 📖 QUICK_START.md                # Быстрый старт за 3 шага
├── 📖 ASSETS_GUIDE.md               # Подробное руководство по ассетам
├── 📖 DEVELOPMENT_GUIDE.md          # Руководство для разработчиков
├── 📖 PROJECT_STRUCTURE.md          # Этот файл
│
├── 🔧 check-project.sh              # Скрипт проверки проекта
│
├── 📁 src/                          # Исходный код игры
│   │
│   ├── 📄 main.js                   # Точка входа, конфигурация Phaser
│   │
│   ├── 📁 scenes/                   # Игровые сцены
│   │   ├── 📄 BootScene.js          # Сцена загрузки (экран загрузки)
│   │   ├── 📄 PreloadScene.js       # Предзагрузка ассетов
│   │   └── 📄 GameScene.js          # Основная игровая сцена
│   │
│   └── 📁 entities/                 # Игровые сущности
│       ├── 📄 Player.js             # Класс игрока (Карина)
│       ├── 📄 NPC.js                # Класс NPC (Даша)
│       └── 📄 Cat.js                # Класс кошки (Рекси)
│
├── 📁 public/                       # Публичные файлы
│   └── 📁 assets/                   # Игровые ассеты
│       │
│       ├── 📄 README.md             # Инструкция по ассетам
│       │
│       ├── 📁 characters/           # Спрайт-листы персонажей
│       │   ├── 🖼️ karina.png       # Карина (32×48px × 16 фреймов)
│       │   ├── 🖼️ dasha.png        # Даша (32×48px)
│       │   └── 🖼️ reksi.png        # Рекси (32×32px)
│       │
│       ├── 📁 tilesets/             # Тайлсеты для окружения
│       │   ├── 🖼️ floor_tiles.png  # Тайлы пола
│       │   ├── 🖼️ wall_tiles.png   # Тайлы стен
│       │   └── 🖼️ furniture_tiles.png # Базовая мебель
│       │
│       ├── 📁 furniture/            # Отдельные спрайты мебели
│       │   ├── 🖼️ bed.png          # Кровать (160×120)
│       │   ├── 🖼️ desk.png         # Стол (200×60)
│       │   ├── 🖼️ sofa.png         # Диван (180×80)
│       │   ├── 🖼️ bookshelf.png    # Книжная полка (60×120)
│       │   ├── 🖼️ window.png       # Окно (80×100)
│       │   ├── 🖼️ laptop.png       # Ноутбук (32×32)
│       │   ├── 🖼️ cat_house.png    # Домик кошки (60×60)
│       │   ├── 🖼️ table.png        # Столик (60×60)
│       │   ├── 🖼️ nightstand.png   # Тумбочка (50×50)
│       │   ├── 🖼️ board.png        # Доска воспоминаний (100×80)
│       │   └── 🖼️ ottoman.png      # Пуфик (50×50)
│       │
│       └── 📁 tilemaps/             # JSON карты (Tiled Editor)
│           └── 📄 apartment.json    # Карта квартиры
│
└── 📁 node_modules/                 # Зависимости npm (автоматически)
    ├── phaser/                      # Phaser 3 движок
    └── vite/                        # Vite сборщик
```

---

## 🎯 Ключевые файлы

### Конфигурация

| Файл | Назначение |
|------|------------|
| [package.json](package.json) | Метаданные проекта, зависимости, скрипты |
| [vite.config.js](vite.config.js) | Конфигурация dev-сервера и сборки |
| [index.html](index.html) | Входная HTML страница |

### Исходный код

| Файл | Описание |
|------|----------|
| [src/main.js](src/main.js) | Инициализация Phaser, конфигурация игры |
| [src/scenes/BootScene.js](src/scenes/BootScene.js) | Экран загрузки с прогресс-баром |
| [src/scenes/PreloadScene.js](src/scenes/PreloadScene.js) | Загрузка всех ассетов |
| [src/scenes/GameScene.js](src/scenes/GameScene.js) | Основная игровая логика, комната Карины |
| [src/entities/Player.js](src/entities/Player.js) | Логика игрока: движение, анимация, depth sorting |
| [src/entities/NPC.js](src/entities/NPC.js) | NPC с диалогами и взаимодействием |
| [src/entities/Cat.js](src/entities/Cat.js) | AI кошки: блуждание, сон, мяуканье |

### Документация

| Файл | Содержание |
|------|-----------|
| [README.md](README.md) | Полное описание проекта, фичи, установка |
| [QUICK_START.md](QUICK_START.md) | Запуск за 3 шага |
| [ASSETS_GUIDE.md](ASSETS_GUIDE.md) | Спецификация ассетов, где их найти |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) | Примеры кода для расширения игры |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Эта схема |

---

## 🔄 Поток выполнения

```
index.html
    ↓
src/main.js (Phaser Config)
    ↓
BootScene → PreloadScene → GameScene
                                ↓
                    ┌───────────┴───────────┐
                    ↓                       ↓
            Player.js (Карина)      NPC.js (Даша) + Cat.js (Рекси)
                    ↓
            Depth Sorting System
            WASD Movement
            E Interaction
```

---

## 🎮 Игровые системы

### Реализовано ✅

- **Система сцен**: Boot → Preload → Game
- **Система персонажей**: Player, NPC, Cat с полной анимацией
- **Depth Sorting**: 2.5D эффект (объекты перекрываются по Y-координате)
- **Управление**: WASD для движения, E для взаимодействия
- **Физика**: Arcade Physics с коллизиями
- **Диалоги**: Система взаимодействия с NPC
- **AI**: Простое поведение кошки (блуждание, сон)
- **Камера**: Следует за игроком с плавностью

### Планируется 🚧

- Система квестов
- Инвентарь
- Дополнительные комнаты (кухня, ванная, коридор)
- Звук и музыка
- Система сохранения
- Освещение
- Мини-игры

---

## 📦 Зависимости

```json
{
  "phaser": "^3.90.0",  // Игровой движок
  "vite": "^7.3.1"      // Сборщик и dev-сервер
}
```

---

## 🚀 Команды

```bash
npm install          # Установить зависимости
npm run dev          # Запустить dev-сервер (http://localhost:3000)
npm run build        # Собрать для продакшена (→ dist/)
npm run preview      # Предпросмотр production build
./check-project.sh   # Проверить структуру проекта
```

---

## 🎨 Архитектура ассетов

### Спрайт-листы (Sprite Sheets)

```
karina.png (128×192px)
┌────────┬────────┬────────┬────────┐
│ Down 0 │ Down 1 │ Down 2 │ Down 3 │  Ряд 1: Ходьба вниз
├────────┼────────┼────────┼────────┤
│ Left 0 │ Left 1 │ Left 2 │ Left 3 │  Ряд 2: Ходьба влево
├────────┼────────┼────────┼────────┤
│Right 0 │Right 1 │Right 2 │Right 3 │  Ряд 3: Ходьба вправо
├────────┼────────┼────────┼────────┤
│ Up 0   │ Up 1   │ Up 2   │ Up 3   │  Ряд 4: Ходьба вверх
└────────┴────────┴────────┴────────┘
Размер фрейма: 32×48px
```

### Тайлсеты

- **32×32px** тайлы для совместимости с Tiled Editor
- Организованы по слоям: пол, стены, мебель
- Поддержка коллизий через свойства в Tiled

---

## 🔍 Где что искать

### Хочу изменить управление
➡️ [src/entities/Player.js](src/entities/Player.js) → метод `update()`

### Хочу добавить нового NPC
➡️ [src/scenes/GameScene.js](src/scenes/GameScene.js) → метод `createCharacters()`

### Хочу изменить комнату
➡️ [src/scenes/GameScene.js](src/scenes/GameScene.js) → метод `createKarinaRoom()`

### Хочу добавить новую сцену
➡️ Создать файл в `src/scenes/` → добавить в [src/main.js](src/main.js)

### Хочу добавить звук
➡️ [src/scenes/PreloadScene.js](src/scenes/PreloadScene.js) → `preload()` + [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)

### Хочу настроить разрешение
➡️ [src/main.js](src/main.js) → `width` и `height` в конфиге

---

## 💡 Советы

1. **Всегда используйте `setDepth(this.y)`** для объектов, которые должны правильно перекрываться
2. **Статические объекты** (стены, мебель) делайте `staticSprite` для производительности
3. **Организуйте код по классам** - каждая сущность в отдельном файле
4. **Используйте константы** для магических чисел (скорость, размеры и т.д.)
5. **Документируйте сложные места** в коде комментариями

---

**Создано для Карины с ❤️**

🎮 Приятной разработки!
