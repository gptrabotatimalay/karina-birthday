#!/bin/bash

# Скрипт проверки структуры проекта Karina's RPG Quest

echo "🎮 Проверка проекта Karina's RPG Quest..."
echo ""

# Проверка Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js установлен: $(node -v)"
else
    echo "❌ Node.js не найден. Установите Node.js с https://nodejs.org/"
    exit 1
fi

# Проверка npm
if command -v npm &> /dev/null; then
    echo "✅ npm установлен: $(npm -v)"
else
    echo "❌ npm не найден"
    exit 1
fi

echo ""
echo "📁 Проверка структуры файлов..."

# Основные файлы
files=(
    "package.json"
    "index.html"
    "vite.config.js"
    "src/main.js"
    "src/scenes/BootScene.js"
    "src/scenes/PreloadScene.js"
    "src/scenes/GameScene.js"
    "src/entities/Player.js"
    "src/entities/NPC.js"
    "src/entities/Cat.js"
)

missing_files=0

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Отсутствует: $file"
        ((missing_files++))
    fi
done

echo ""
echo "📦 Проверка зависимостей..."

if [ -d "node_modules" ]; then
    echo "✅ node_modules существует"

    if [ -d "node_modules/phaser" ]; then
        echo "✅ Phaser 3 установлен"
    else
        echo "⚠️  Phaser 3 не установлен. Запустите: npm install"
    fi

    if [ -d "node_modules/vite" ]; then
        echo "✅ Vite установлен"
    else
        echo "⚠️  Vite не установлен. Запустите: npm install"
    fi
else
    echo "⚠️  node_modules не найден. Запустите: npm install"
fi

echo ""
echo "🎨 Проверка папки ассетов..."

if [ -d "public/assets" ]; then
    echo "✅ Папка public/assets существует"

    # Проверка подпапок
    asset_dirs=(
        "public/assets/characters"
        "public/assets/tilesets"
        "public/assets/furniture"
        "public/assets/tilemaps"
    )

    for dir in "${asset_dirs[@]}"; do
        if [ -d "$dir" ]; then
            echo "✅ $dir"
        else
            echo "⚠️  Отсутствует: $dir"
        fi
    done
else
    echo "❌ Папка public/assets не найдена"
fi

echo ""
echo "📊 Итог:"

if [ $missing_files -eq 0 ]; then
    echo "✅ Все основные файлы на месте!"
else
    echo "⚠️  Отсутствует $missing_files файлов"
fi

echo ""
echo "🚀 Для запуска игры выполните:"
echo "   npm run dev"
echo ""
echo "📖 Документация:"
echo "   - README.md - описание проекта"
echo "   - QUICK_START.md - быстрый старт"
echo "   - ASSETS_GUIDE.md - руководство по ассетам"
echo "   - DEVELOPMENT_GUIDE.md - руководство разработчика"
echo ""
