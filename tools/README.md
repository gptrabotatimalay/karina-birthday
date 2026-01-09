# 🛠️ Инструменты автоматизации Tiled

Быстрая справка по Python скриптам для автоматизации работы с картами.

## 🚀 Быстрый старт

```bash
# 1. Установить зависимости (один раз)
pip3 install -r requirements.txt

# 2. Создать .tsx файлы из всех PNG
python3 tools/tileset_generator.py public/assets/tilesets/
python3 tools/tileset_generator.py public/assets/furniture/

# 3. Сгенерировать комнаты
python3 tools/room_generator.py bedroom public/assets/tilemaps/my_bedroom.json
python3 tools/room_generator.py kitchen public/assets/tilemaps/my_kitchen.json
python3 tools/room_generator.py bathroom public/assets/tilemaps/my_bathroom.json
```

## 📦 Что внутри

### [tileset_generator.py](tileset_generator.py)
Конвертирует PNG → .tsx файлы для Tiled

**Использование:**
```bash
# Один файл
python3 tools/tileset_generator.py path/to/tiles.png

# Вся папка
python3 tools/tileset_generator.py public/assets/tilesets/

# С параметрами
python3 tools/tileset_generator.py tiles.png --tile-size 32 --spacing 1
```

### [room_generator.py](room_generator.py)
Автоматически генерирует готовые комнаты с полом, стенами и мебелью

**Использование:**
```bash
# Базовая комната
python3 tools/room_generator.py bedroom output.json

# Кастомный размер
python3 tools/room_generator.py kitchen output.json 25 20

# Типы: bedroom, kitchen, bathroom
```

## 📚 Полная документация

Смотрите [AUTOMATION_GUIDE.md](../AUTOMATION_GUIDE.md) для подробной информации:
- Все параметры и опции
- Продвинутые техники
- Как модифицировать скрипты
- FAQ и примеры

## ✅ Тестовые файлы

Созданы тестовые карты:
- `public/assets/tilemaps/test_bedroom.json` - спальня 20×15
- `public/assets/tilemaps/test_kitchen.json` - кухня 18×12
- `public/assets/tilemaps/test_bathroom.json` - ванная 12×10

Откройте их в Tiled для просмотра результата!

## 🎯 Workflow

```
PNG файл
   ↓
[tileset_generator.py] → .tsx файл → Открыть в Tiled
   ↓
[room_generator.py] → .json карта → Редактировать в Tiled → Использовать в игре
```

## 💡 Советы

1. Сначала создайте все .tsx файлы командой:
   ```bash
   python3 tools/tileset_generator.py public/assets/tilesets/
   ```

2. Затем генерируйте базовые комнаты:
   ```bash
   python3 tools/room_generator.py bedroom room.json
   ```

3. Открывайте в Tiled для ручной доработки

4. Загружайте в игру через PreloadScene.js

Удачи! 🚀
