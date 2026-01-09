#!/usr/bin/env python3
"""
Room Generator - Автоматическая генерация комнат для Tiled
Создает JSON файлы карт с автоматической расстановкой стен, пола и мебели
"""

import sys
import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    from PIL import Image
except ImportError:
    print("❌ Ошибка: библиотека Pillow не установлена")
    print("Установите: pip3 install Pillow")
    sys.exit(1)


class TilesetInfo:
    """Информация о tileset"""

    def __init__(self, name: str, image_path: str, tile_width: int = 16, tile_height: int = 16,
                 first_gid: int = 1, spacing: int = 0, margin: int = 0):
        self.name = name
        self.image_path = Path(image_path)
        self.tile_width = tile_width
        self.tile_height = tile_height
        self.first_gid = first_gid
        self.spacing = spacing
        self.margin = margin

        # Вычисляем количество тайлов
        if self.image_path.exists():
            img = Image.open(self.image_path)
            img_width, img_height = img.size
            img.close()

            self.columns = (img_width - 2 * margin + spacing) // (tile_width + spacing)
            self.rows = (img_height - 2 * margin + spacing) // (tile_height + spacing)
            self.tile_count = self.columns * self.rows
        else:
            self.columns = 0
            self.rows = 0
            self.tile_count = 0

    def get_tile_id(self, col: int, row: int) -> int:
        """Получить ID тайла по координатам (col, row)"""
        if 0 <= col < self.columns and 0 <= row < self.rows:
            return self.first_gid + (row * self.columns + col)
        return 0

    def to_dict(self, relative_to: Path, embedded: bool = True) -> Dict[str, Any]:
        """Конвертировать в словарь для JSON"""
        try:
            relative_image = os.path.relpath(self.image_path, relative_to)
        except ValueError:
            relative_image = str(self.image_path)

        if embedded:
            # Встроенный (embedded) tileset для Phaser
            img = Image.open(self.image_path)
            img_width, img_height = img.size
            img.close()

            return {
                "firstgid": self.first_gid,
                "name": self.name,
                "tilewidth": self.tile_width,
                "tileheight": self.tile_height,
                "tilecount": self.tile_count,
                "columns": self.columns,
                "image": relative_image,
                "imagewidth": img_width,
                "imageheight": img_height,
                "margin": self.margin,
                "spacing": self.spacing
            }
        else:
            # Внешняя ссылка (для Tiled)
            return {
                "firstgid": self.first_gid,
                "source": relative_image
            }


class RoomGenerator:
    """Генератор комнат"""

    def __init__(self, width: int, height: int, tile_width: int = 16, tile_height: int = 16):
        self.width = width
        self.height = height
        self.tile_width = tile_width
        self.tile_height = tile_height
        self.tilesets: List[TilesetInfo] = []
        self.layers: List[Dict[str, Any]] = []

    def add_tileset(self, tileset: TilesetInfo):
        """Добавить tileset"""
        self.tilesets.append(tileset)

    def create_layer(self, name: str, data: Optional[List[int]] = None) -> Dict[str, Any]:
        """Создать слой"""
        if data is None:
            data = [0] * (self.width * self.height)

        layer = {
            "id": len(self.layers) + 1,
            "name": name,
            "type": "tilelayer",
            "visible": True,
            "opacity": 1,
            "x": 0,
            "y": 0,
            "width": self.width,
            "height": self.height,
            "data": data
        }

        self.layers.append(layer)
        return layer

    def fill_floor(self, layer_name: str, tileset: TilesetInfo, tile_col: int, tile_row: int):
        """
        Заполнить весь слой одним тайлом

        Args:
            layer_name: имя слоя
            tileset: tileset из которого берется тайл
            tile_col: колонка тайла в tileset
            tile_row: строка тайла в tileset
        """
        tile_id = tileset.get_tile_id(tile_col, tile_row)
        data = [tile_id] * (self.width * self.height)
        self.create_layer(layer_name, data)
        print(f"   🎨 Слой '{layer_name}': заполнен тайлом {tile_id}")

    def add_walls(self, layer_name: str, tileset: TilesetInfo, wall_config: Dict[str, tuple]):
        """
        Автоматически добавить стены по периметру

        Args:
            layer_name: имя слоя
            tileset: tileset со стенами
            wall_config: конфигурация стен {
                'top_left': (col, row),
                'top': (col, row),
                'top_right': (col, row),
                'left': (col, row),
                'right': (col, row),
                'bottom_left': (col, row),
                'bottom': (col, row),
                'bottom_right': (col, row)
            }
        """
        data = [0] * (self.width * self.height)

        # Верхняя стена
        for x in range(self.width):
            if x == 0 and 'top_left' in wall_config:
                tile_id = tileset.get_tile_id(*wall_config['top_left'])
            elif x == self.width - 1 and 'top_right' in wall_config:
                tile_id = tileset.get_tile_id(*wall_config['top_right'])
            elif 'top' in wall_config:
                tile_id = tileset.get_tile_id(*wall_config['top'])
            else:
                tile_id = 0

            data[x] = tile_id

        # Нижняя стена
        for x in range(self.width):
            if x == 0 and 'bottom_left' in wall_config:
                tile_id = tileset.get_tile_id(*wall_config['bottom_left'])
            elif x == self.width - 1 and 'bottom_right' in wall_config:
                tile_id = tileset.get_tile_id(*wall_config['bottom_right'])
            elif 'bottom' in wall_config:
                tile_id = tileset.get_tile_id(*wall_config['bottom'])
            else:
                tile_id = 0

            data[(self.height - 1) * self.width + x] = tile_id

        # Левая и правая стены
        for y in range(1, self.height - 1):
            if 'left' in wall_config:
                data[y * self.width] = tileset.get_tile_id(*wall_config['left'])
            if 'right' in wall_config:
                data[y * self.width + self.width - 1] = tileset.get_tile_id(*wall_config['right'])

        self.create_layer(layer_name, data)
        print(f"   🧱 Слой '{layer_name}': добавлены стены по периметру")

    def add_furniture_grid(self, layer_name: str, tileset: TilesetInfo,
                           furniture_tiles: List[tuple], spacing: int = 3):
        """
        Разместить мебель по сетке

        Args:
            layer_name: имя слоя
            tileset: tileset с мебелью
            furniture_tiles: список (col, row) координат мебели в tileset
            spacing: отступ между объектами мебели
        """
        data = [0] * (self.width * self.height)

        furniture_index = 0
        for y in range(2, self.height - 2, spacing):
            for x in range(2, self.width - 2, spacing):
                if furniture_index < len(furniture_tiles):
                    tile_col, tile_row = furniture_tiles[furniture_index]
                    tile_id = tileset.get_tile_id(tile_col, tile_row)
                    data[y * self.width + x] = tile_id
                    furniture_index += 1

        self.create_layer(layer_name, data)
        print(f"   🪑 Слой '{layer_name}': размещено {furniture_index} объектов мебели")

    def to_json(self, output_path: Path) -> Dict[str, Any]:
        """Экспортировать в JSON формат Tiled"""

        tilemap = {
            "compressionlevel": -1,
            "height": self.height,
            "width": self.width,
            "infinite": False,
            "layers": self.layers,
            "nextlayerid": len(self.layers) + 1,
            "nextobjectid": 1,
            "orientation": "orthogonal",
            "renderorder": "right-down",
            "tiledversion": "1.10.2",
            "tileheight": self.tile_height,
            "tilewidth": self.tile_width,
            "type": "map",
            "version": "1.10",
            "tilesets": [ts.to_dict(output_path.parent) for ts in self.tilesets]
        }

        return tilemap

    def save(self, output_path: Path):
        """Сохранить карту в JSON файл"""
        output_path.parent.mkdir(parents=True, exist_ok=True)

        tilemap_json = self.to_json(output_path)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(tilemap_json, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Карта сохранена: {output_path}")
        print(f"   📐 Размер: {self.width}x{self.height} тайлов ({self.width * self.tile_width}x{self.height * self.tile_height}px)")
        print(f"   📊 Слоёв: {len(self.layers)}")
        print(f"   🎨 Tilesets: {len(self.tilesets)}")


def generate_bedroom(output_path: Path, width: int = 20, height: int = 15):
    """
    Генерирует спальню

    Args:
        output_path: путь для сохранения .json
        width: ширина комнаты в тайлах
        height: высота комнаты в тайлах
    """
    print(f"\n🛏️  Генерация спальни {width}x{height}...")

    room = RoomGenerator(width, height)

    # Определяем пути к ресурсам
    project_root = Path(__file__).parent.parent
    assets_dir = project_root / "public" / "assets"

    # Добавляем tilesets
    floor_tileset = TilesetInfo(
        name="floor_bedroom",
        image_path=assets_dir / "tilesets" / "floor_bedroom.png",
        first_gid=1
    )
    room.add_tileset(floor_tileset)

    walls_tileset = TilesetInfo(
        name="room_structure",
        image_path=assets_dir / "tilesets" / "room_structure.png",
        first_gid=floor_tileset.first_gid + floor_tileset.tile_count
    )
    room.add_tileset(walls_tileset)

    furniture_tileset = TilesetInfo(
        name="furniture_props",
        image_path=assets_dir / "furniture" / "furniture_props.png",
        first_gid=walls_tileset.first_gid + walls_tileset.tile_count
    )
    room.add_tileset(furniture_tileset)

    print(f"   📦 Tileset 1: {floor_tileset.name} (GID {floor_tileset.first_gid}, {floor_tileset.tile_count} тайлов)")
    print(f"   📦 Tileset 2: {walls_tileset.name} (GID {walls_tileset.first_gid}, {walls_tileset.tile_count} тайлов)")
    print(f"   📦 Tileset 3: {furniture_tileset.name} (GID {furniture_tileset.first_gid}, {furniture_tileset.tile_count} тайлов)")

    # Слой пола (коричневый паркет из floor_bedroom.png)
    room.fill_floor("Floor", floor_tileset, 0, 6)

    # Слой стен (из room_structure.png - коричневые стены)
    # Анализируя изображение: строка 4-5 содержит коричневые стены
    wall_config = {
        'top_left': (0, 4),      # Верхний левый угол
        'top': (1, 4),           # Верхняя стена
        'top_right': (2, 4),     # Верхний правый угол
        'left': (0, 5),          # Левая стена
        'right': (2, 5),         # Правая стена
        'bottom_left': (0, 6),   # Нижний левый угол
        'bottom': (1, 6),        # Нижняя стена
        'bottom_right': (2, 6)   # Нижний правый угол
    }
    room.add_walls("Walls", walls_tileset, wall_config)

    # Слой мебели (кровать, тумбочки и т.д.)
    # Примерные координаты мебели из furniture_props.png
    bedroom_furniture = [
        (0, 1),   # Кровать
        (1, 1),   # Кровать продолжение
        (2, 2),   # Тумбочка
        (3, 3),   # Стул
        (4, 4),   # Шкаф
    ]
    room.add_furniture_grid("Furniture", furniture_tileset, bedroom_furniture, spacing=4)

    # Пустой слой декораций
    room.create_layer("Decoration")

    # Сохраняем
    room.save(output_path)


def generate_kitchen(output_path: Path, width: int = 18, height: int = 12):
    """Генерирует кухню"""
    print(f"\n🍳 Генерация кухни {width}x{height}...")

    room = RoomGenerator(width, height)

    project_root = Path(__file__).parent.parent
    assets_dir = project_root / "public" / "assets"

    # Tilesets
    floor_tileset = TilesetInfo(
        name="floor_kitchen",
        image_path=assets_dir / "tilesets" / "floor_kitchen.png",
        first_gid=1
    )
    room.add_tileset(floor_tileset)

    walls_tileset = TilesetInfo(
        name="room_structure",
        image_path=assets_dir / "tilesets" / "room_structure.png",
        first_gid=floor_tileset.first_gid + floor_tileset.tile_count
    )
    room.add_tileset(walls_tileset)

    furniture_tileset = TilesetInfo(
        name="furniture_props",
        image_path=assets_dir / "furniture" / "furniture_props.png",
        first_gid=walls_tileset.first_gid + walls_tileset.tile_count
    )
    room.add_tileset(furniture_tileset)

    print(f"   📦 Tileset 1: {floor_tileset.name} (GID {floor_tileset.first_gid})")
    print(f"   📦 Tileset 2: {walls_tileset.name} (GID {walls_tileset.first_gid})")
    print(f"   📦 Tileset 3: {furniture_tileset.name} (GID {furniture_tileset.first_gid})")

    # Красный кафель для кухни
    room.fill_floor("Floor", floor_tileset, 0, 6)

    # Красные стены (строка 2-3 в room_structure.png)
    wall_config = {
        'top_left': (0, 2),
        'top': (1, 2),
        'top_right': (2, 2),
        'left': (0, 3),
        'right': (2, 3),
        'bottom_left': (0, 4),
        'bottom': (1, 4),
        'bottom_right': (2, 4)
    }
    room.add_walls("Walls", walls_tileset, wall_config)

    # Кухонная мебель
    kitchen_furniture = [
        (10, 8),  # Холодильник
        (11, 8),  # Плита
        (12, 8),  # Раковина
        (5, 5),   # Стол
        (6, 5),   # Стулья
    ]
    room.add_furniture_grid("Furniture", furniture_tileset, kitchen_furniture, spacing=3)

    room.create_layer("Decoration")
    room.save(output_path)


def generate_bathroom(output_path: Path, width: int = 12, height: int = 10):
    """Генерирует ванную комнату"""
    print(f"\n🚿 Генерация ванной {width}x{height}...")

    room = RoomGenerator(width, height)

    project_root = Path(__file__).parent.parent
    assets_dir = project_root / "public" / "assets"

    # Tilesets
    floor_tileset = TilesetInfo(
        name="floor_bathroom",
        image_path=assets_dir / "tilesets" / "floor_bathroom.png",
        first_gid=1
    )
    room.add_tileset(floor_tileset)

    walls_tileset = TilesetInfo(
        name="room_structure",
        image_path=assets_dir / "tilesets" / "room_structure.png",
        first_gid=floor_tileset.first_gid + floor_tileset.tile_count
    )
    room.add_tileset(walls_tileset)

    furniture_tileset = TilesetInfo(
        name="furniture_props",
        image_path=assets_dir / "furniture" / "furniture_props.png",
        first_gid=walls_tileset.first_gid + walls_tileset.tile_count
    )
    room.add_tileset(furniture_tileset)

    print(f"   📦 Tileset 1: {floor_tileset.name} (GID {floor_tileset.first_gid})")
    print(f"   📦 Tileset 2: {walls_tileset.name} (GID {walls_tileset.first_gid})")
    print(f"   📦 Tileset 3: {furniture_tileset.name} (GID {furniture_tileset.first_gid})")

    # Голубой кафель
    room.fill_floor("Floor", floor_tileset, 1, 6)

    # Голубые стены (строка 8-9 в room_structure.png)
    wall_config = {
        'top_left': (0, 8),
        'top': (1, 8),
        'top_right': (2, 8),
        'left': (0, 9),
        'right': (2, 9),
        'bottom_left': (0, 10),
        'bottom': (1, 10),
        'bottom_right': (2, 10)
    }
    room.add_walls("Walls", walls_tileset, wall_config)

    # Сантехника
    bathroom_furniture = [
        (14, 10),  # Ванна
        (15, 10),  # Унитаз
        (16, 10),  # Раковина
    ]
    room.add_furniture_grid("Furniture", furniture_tileset, bathroom_furniture, spacing=3)

    room.create_layer("Decoration")
    room.save(output_path)


def main():
    """Главная функция"""

    if len(sys.argv) < 2:
        print("""
🏠 Room Generator для Tiled Editor

Использование:
  python3 room_generator.py bedroom <output.json> [width] [height]
  python3 room_generator.py kitchen <output.json> [width] [height]
  python3 room_generator.py bathroom <output.json> [width] [height]

Примеры:
  # Создать спальню 20x15 тайлов
  python3 room_generator.py bedroom public/assets/tilemaps/bedroom.json

  # Создать кухню 18x12 тайлов
  python3 room_generator.py kitchen public/assets/tilemaps/kitchen.json 18 12

  # Создать ванную 12x10 тайлов
  python3 room_generator.py bathroom public/assets/tilemaps/bathroom.json 12 10
""")
        sys.exit(0)

    room_type = sys.argv[1].lower()
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else None

    width = int(sys.argv[3]) if len(sys.argv) > 3 else None
    height = int(sys.argv[4]) if len(sys.argv) > 4 else None

    if output_path is None:
        project_root = Path(__file__).parent.parent
        output_path = project_root / "public" / "assets" / "tilemaps" / f"generated_{room_type}.json"

    if room_type == "bedroom":
        generate_bedroom(output_path, width or 20, height or 15)
    elif room_type == "kitchen":
        generate_kitchen(output_path, width or 18, height or 12)
    elif room_type == "bathroom":
        generate_bathroom(output_path, width or 12, height or 10)
    else:
        print(f"❌ Неизвестный тип комнаты: {room_type}")
        print("   Доступные типы: bedroom, kitchen, bathroom")
        sys.exit(1)


if __name__ == '__main__':
    main()
