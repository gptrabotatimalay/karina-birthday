#!/usr/bin/env python3
"""
Tileset Generator - Автоматическое создание .tsx файлов из PNG
Конвертирует PNG изображения в Tiled tileset файлы (.tsx)
"""

import sys
import os
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, ElementTree, tostring
from xml.dom import minidom

try:
    from PIL import Image
except ImportError:
    print("❌ Ошибка: библиотека Pillow не установлена")
    print("Установите: pip3 install Pillow")
    sys.exit(1)


def prettify_xml(elem):
    """Форматирует XML для читаемости"""
    rough_string = tostring(elem, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ", encoding="utf-8").decode('utf-8')


def generate_tileset(png_path, output_path=None, tile_width=16, tile_height=16,
                     spacing=0, margin=0, name=None):
    """
    Генерирует .tsx файл из PNG изображения

    Args:
        png_path: путь к PNG файлу
        output_path: путь для сохранения .tsx (если None, заменит расширение на .tsx)
        tile_width: ширина одного тайла в пикселях
        tile_height: высота одного тайла в пикселях
        spacing: отступ между тайлами
        margin: отступ от края изображения
        name: имя tileset (если None, используется имя файла)
    """

    png_path = Path(png_path)

    if not png_path.exists():
        print(f"❌ Файл не найден: {png_path}")
        return False

    # Открываем изображение для получения размеров
    try:
        img = Image.open(png_path)
        img_width, img_height = img.size
        img.close()
    except Exception as e:
        print(f"❌ Ошибка при открытии изображения: {e}")
        return False

    # Вычисляем количество тайлов
    columns = (img_width - 2 * margin + spacing) // (tile_width + spacing)
    rows = (img_height - 2 * margin + spacing) // (tile_height + spacing)
    tile_count = columns * rows

    # Определяем имя tileset
    if name is None:
        name = png_path.stem

    # Определяем путь для сохранения
    if output_path is None:
        output_path = png_path.with_suffix('.tsx')
    else:
        output_path = Path(output_path)

    # Относительный путь к PNG от .tsx файла
    try:
        relative_png = os.path.relpath(png_path, output_path.parent)
    except ValueError:
        # На Windows, если файлы на разных дисках
        relative_png = str(png_path)

    # Создаем XML структуру
    tileset = Element('tileset', {
        'version': '1.10',
        'tiledversion': '1.10.2',
        'name': name,
        'tilewidth': str(tile_width),
        'tileheight': str(tile_height),
        'tilecount': str(tile_count),
        'columns': str(columns)
    })

    if spacing > 0:
        tileset.set('spacing', str(spacing))
    if margin > 0:
        tileset.set('margin', str(margin))

    # Добавляем изображение
    image = SubElement(tileset, 'image', {
        'source': relative_png,
        'width': str(img_width),
        'height': str(img_height)
    })

    # Форматируем и сохраняем
    xml_string = prettify_xml(tileset)

    # Добавляем XML declaration вручную
    xml_string = '<?xml version="1.0" encoding="UTF-8"?>\n' + '\n'.join(xml_string.split('\n')[1:])

    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(xml_string)

        print(f"✅ Создан tileset: {output_path}")
        print(f"   📐 Размер изображения: {img_width}x{img_height}px")
        print(f"   🎯 Размер тайла: {tile_width}x{tile_height}px")
        print(f"   📊 Количество тайлов: {tile_count} ({columns} колонок × {rows} строк)")

        return True

    except Exception as e:
        print(f"❌ Ошибка при сохранении файла: {e}")
        return False


def process_directory(directory, output_dir=None, **kwargs):
    """
    Обрабатывает все PNG файлы в директории

    Args:
        directory: путь к директории с PNG файлами
        output_dir: директория для сохранения .tsx (если None, сохраняет рядом с PNG)
        **kwargs: параметры для generate_tileset
    """
    directory = Path(directory)

    if not directory.exists() or not directory.is_dir():
        print(f"❌ Директория не найдена: {directory}")
        return

    png_files = list(directory.glob('*.png'))

    if not png_files:
        print(f"⚠️  PNG файлы не найдены в {directory}")
        return

    print(f"\n🔍 Найдено {len(png_files)} PNG файлов в {directory}")
    print("=" * 60)

    success_count = 0

    for png_file in png_files:
        if output_dir:
            output_path = Path(output_dir) / png_file.with_suffix('.tsx').name
        else:
            output_path = None

        if generate_tileset(png_file, output_path, **kwargs):
            success_count += 1
        print()

    print("=" * 60)
    print(f"✅ Успешно создано: {success_count}/{len(png_files)} tileset файлов")


def main():
    """Главная функция с обработкой аргументов командной строки"""

    if len(sys.argv) < 2:
        print("""
🎨 Tileset Generator для Tiled Editor

Использование:
  python3 tileset_generator.py <путь_к_PNG>                    # Создать один .tsx файл
  python3 tileset_generator.py <директория>                    # Обработать все PNG в директории
  python3 tileset_generator.py <PNG> --output <путь_к_TSX>    # Указать путь для сохранения
  python3 tileset_generator.py <PNG> --tile-size 32           # Изменить размер тайла

Параметры:
  --output, -o         Путь для сохранения .tsx файла
  --tile-size          Размер тайла (по умолчанию 16)
  --tile-width         Ширина тайла в пикселях
  --tile-height        Высота тайла в пикселях
  --spacing            Отступ между тайлами
  --margin             Отступ от края изображения
  --name, -n           Имя tileset

Примеры:
  # Создать .tsx для одного файла
  python3 tileset_generator.py public/assets/tilesets/room_structure.png

  # Обработать все PNG в папке
  python3 tileset_generator.py public/assets/tilesets/

  # Создать tileset с размером тайла 32x32
  python3 tileset_generator.py my_tiles.png --tile-size 32
""")
        sys.exit(0)

    input_path = Path(sys.argv[1])

    # Парсим аргументы
    kwargs = {
        'tile_width': 16,
        'tile_height': 16,
        'spacing': 0,
        'margin': 0,
        'name': None,
        'output_path': None
    }

    i = 2
    while i < len(sys.argv):
        arg = sys.argv[i]

        if arg in ['--output', '-o'] and i + 1 < len(sys.argv):
            kwargs['output_path'] = sys.argv[i + 1]
            i += 2
        elif arg == '--tile-size' and i + 1 < len(sys.argv):
            size = int(sys.argv[i + 1])
            kwargs['tile_width'] = size
            kwargs['tile_height'] = size
            i += 2
        elif arg == '--tile-width' and i + 1 < len(sys.argv):
            kwargs['tile_width'] = int(sys.argv[i + 1])
            i += 2
        elif arg == '--tile-height' and i + 1 < len(sys.argv):
            kwargs['tile_height'] = int(sys.argv[i + 1])
            i += 2
        elif arg == '--spacing' and i + 1 < len(sys.argv):
            kwargs['spacing'] = int(sys.argv[i + 1])
            i += 2
        elif arg == '--margin' and i + 1 < len(sys.argv):
            kwargs['margin'] = int(sys.argv[i + 1])
            i += 2
        elif arg in ['--name', '-n'] and i + 1 < len(sys.argv):
            kwargs['name'] = sys.argv[i + 1]
            i += 2
        else:
            i += 1

    # Обработка
    if input_path.is_dir():
        output_dir = kwargs.pop('output_path', None)
        process_directory(input_path, output_dir, **kwargs)
    elif input_path.is_file():
        generate_tileset(input_path, **kwargs)
    else:
        print(f"❌ Путь не найден: {input_path}")
        sys.exit(1)


if __name__ == '__main__':
    main()
