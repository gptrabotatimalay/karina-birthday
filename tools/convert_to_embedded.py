#!/usr/bin/env python3
"""
Конвертирует Tiled карту с внешними tileset ссылками во встроенный формат для Phaser
"""

import sys
import json
from pathlib import Path
from PIL import Image

def convert_map_to_embedded(input_path, output_path=None):
    """
    Конвертирует карту с внешними tilesets во встроенный формат

    Args:
        input_path: путь к исходному .json файлу карты
        output_path: путь для сохранения (если None, перезаписывает исходный)
    """
    input_path = Path(input_path)

    if not input_path.exists():
        print(f"❌ Файл не найден: {input_path}")
        return False

    # Читаем карту
    with open(input_path, 'r', encoding='utf-8') as f:
        map_data = json.load(f)

    print(f"📖 Загружена карта: {input_path.name}")
    print(f"   Размер: {map_data['width']}×{map_data['height']} тайлов")
    print(f"   Слоёв: {len(map_data.get('layers', []))}")
    print(f"   Tilesets: {len(map_data.get('tilesets', []))}")

    # Обрабатываем tilesets
    new_tilesets = []
    base_dir = input_path.parent

    for idx, tileset in enumerate(map_data.get('tilesets', [])):
        print(f"\n🔄 Обработка tileset {idx + 1}...")

        if 'source' in tileset:
            # Внешняя ссылка - нужно встроить
            print(f"   ⚠️  Найдена внешняя ссылка: {tileset['source']}")

            # Пытаемся определить изображение по имени
            # Tileset_16x16_9 -> room_structure.png
            # Interiors_free_16x16 -> furniture_props.png
            # Tileset_16x16_1 -> floor_bedroom.png

            firstgid = tileset['firstgid']

            # Маппинг известных tilesets
            tileset_mapping = {
                'Tileset_16x16_9': ('room_structure', '../tilesets/room_structure.png'),
                'Interiors_free_16x16': ('furniture_props', '../furniture/furniture_props.png'),
                'Tileset_16x16_1': ('floor_bedroom', '../tilesets/floor_bedroom.png'),
            }

            # Определяем имя из пути к .tsx
            tsx_name = Path(tileset['source']).stem

            if tsx_name in tileset_mapping:
                name, image_rel_path = tileset_mapping[tsx_name]
                image_path = base_dir / image_rel_path

                if image_path.exists():
                    print(f"   ✅ Найдено изображение: {image_path.name}")

                    # Открываем изображение
                    img = Image.open(image_path)
                    img_width, img_height = img.size
                    img.close()

                    # Вычисляем параметры
                    tile_width = 16
                    tile_height = 16
                    columns = img_width // tile_width
                    rows = img_height // tile_height
                    tile_count = columns * rows

                    # Создаем встроенный tileset
                    embedded_tileset = {
                        "firstgid": firstgid,
                        "name": name,
                        "tilewidth": tile_width,
                        "tileheight": tile_height,
                        "tilecount": tile_count,
                        "columns": columns,
                        "image": image_rel_path,
                        "imagewidth": img_width,
                        "imageheight": img_height,
                        "margin": 0,
                        "spacing": 0
                    }

                    new_tilesets.append(embedded_tileset)

                    print(f"   📊 Tileset: {name}")
                    print(f"      Размер: {img_width}×{img_height}px")
                    print(f"      Тайлов: {tile_count} ({columns}×{rows})")
                    print(f"      First GID: {firstgid}")
                else:
                    print(f"   ❌ Изображение не найдено: {image_path}")
                    print(f"      Пропускаем этот tileset")
            else:
                print(f"   ⚠️  Неизвестный tileset: {tsx_name}")
                print(f"      Пропускаем")
        else:
            # Уже встроенный - оставляем как есть
            print(f"   ✅ Уже встроенный tileset: {tileset.get('name', 'unnamed')}")
            new_tilesets.append(tileset)

    # Обновляем tilesets в карте
    map_data['tilesets'] = new_tilesets

    # Определяем путь для сохранения
    if output_path is None:
        output_path = input_path
    else:
        output_path = Path(output_path)

    # Сохраняем
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(map_data, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Карта сохранена: {output_path}")
    print(f"   Встроенных tilesets: {len(new_tilesets)}")

    return True


def main():
    if len(sys.argv) < 2:
        print("""
🔄 Конвертер карт Tiled в формат со встроенными tilesets

Использование:
  python3 convert_to_embedded.py <input.json> [output.json]

Примеры:
  # Конвертировать и перезаписать исходный файл
  python3 convert_to_embedded.py "public/assets/tilemaps/комната 1.json"

  # Конвертировать и сохранить в новый файл
  python3 convert_to_embedded.py "public/assets/tilemaps/комната 1.json" output.json
""")
        sys.exit(0)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    convert_map_to_embedded(input_path, output_path)


if __name__ == '__main__':
    main()
