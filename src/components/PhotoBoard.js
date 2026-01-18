/**
 * PhotoBoard - Компонент доски воспоминаний
 * Отображает фотографии в стиле Polaroid на пробковой доске с WASD-навигацией
 */
export default class PhotoBoard {
    constructor(onCloseCallback) {
        this.onCloseCallback = onCloseCallback;
        this.focusedIndex = 0;
        this.container = null;
        this.isOpen = false;
        this.zoomMode = false;

        // ===== ДАННЫЕ ФОТОГРАФИЙ =====
        this.photos = this.generatePhotos();

        // Привязываем методы к контексту
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Генерация данных фотографий с фиксированными позициями
     */
    generatePhotos() {
        const photos = [];
        const photoCount = 19;

        // Фиксированные позиции и углы (настроенные вручную)
        const positions = [
            { left: "20.04%", top: "15.58%", rotation: -5.291500288215998 },
            { left: "30.24%", top: "18.16%", rotation: -14.829865293868693 },
            { left: "40.77%", top: "10.14%", rotation: -8.208515006811986 },
            { left: "55.94109678331137%", top: "15.411525720774083%", rotation: -1.0417816014805426 },
            { left: "65.72888835421152%", top: "16.557191138133525%", rotation: -13.547904641901082 },
            { left: "73.49%", top: "24.24%", rotation: 1.0631835462511674 },
            { left: "21.93%", top: "44.64%", rotation: 12.295713674195326 },
            { left: "31.29%", top: "44.52%", rotation: -12.012501528840303 },
            { left: "44.43%", top: "34.26%", rotation: -3.861804248477123 },
            { left: "53.258935493794446%", top: "38.49398398260112%", rotation: 1.3715625582808078 },
            { left: "63.095112545122035%", top: "43.08405445571555%", rotation: -9.534954774459374 },
            { left: "75.11%", top: "46.98%", rotation: -4.565747930100313 },
            { left: "22.65%", top: "72.79%", rotation: 12.875376231791748 },
            { left: "35.884719186864494%", top: "64.79978242325608%", rotation: 14.463061374934984 },
            { left: "43.98%", top: "57.08%", rotation: -5.023039579746779 },
            { left: "53.63719585141791%", top: "64.10946414190451%", rotation: -9.50602604383544 },
            { left: "65.27%", top: "72.67%", rotation: 9.808355423111514 },
            { left: "74.11%", top: "59.92%", rotation: 14.81404095846454 },
            { left: "45.58447828783741%", top: "77.21158360240547%", rotation: -7.5 }
        ];

        // Случайная кнопка-крепление (красная, желтая, синяя)
        const pinColors = ['#e74c3c', '#f39c12', '#3498db'];

        // Размер фотографии в процентах (примерно)
        const PHOTO_WIDTH = 10; // ~10% ширины экрана
        const PHOTO_HEIGHT = 13; // ~13% высоты экрана

        for (let i = 0; i < photoCount; i++) {
            const pinColor = pinColors[Math.floor(Math.random() * pinColors.length)];

            // Парсим координаты и вычисляем центр фотографии
            const leftPercent = parseFloat(positions[i].left);
            const topPercent = parseFloat(positions[i].top);

            // Центр фотографии = left/top + половина размера фото
            const centerX = leftPercent + PHOTO_WIDTH / 2;
            const centerY = topPercent + PHOTO_HEIGHT / 2;

            photos.push({
                id: i + 1,
                src: `/assets/photos/mem${i + 1}.jpeg`,
                caption: i === 10 ? '⭐' : this.generateCaption(), // Фото #11 имеет звездочку в качестве подписи
                left: positions[i].left,
                top: positions[i].top,
                rotation: positions[i].rotation,
                pinColor: pinColor,
                hasStar: false, // Убираем отдельную звездочку сверху
                // Сохраняем координаты центра для пространственной навигации
                centerX: centerX,
                centerY: centerY
            });
        }

        return photos;
    }

    /**
     * Генерация случайной подписи для фото
     */
    generateCaption() {
        const captions = [
            '♥',
            '♥♥',
            '♥♥♥',
            'love',
            'forever',
            'us ♥',
            'my love', 
            'together',
            'always',
            'we ♥'
        ];
        return captions[Math.floor(Math.random() * captions.length)];
    }

    /**
     * Открыть доску воспоминаний
     */
    open() {
        this.isOpen = true;
        this.focusedIndex = 0;
        this.zoomMode = false;

        // Скрываем панель чата
        if (window.chatPanel) {
            window.chatPanel.hide();
        }

        // Создаем контейнер
        this.container = document.createElement('div');
        this.container.id = 'photoboard-overlay';
        this.container.className = 'photoboard-overlay';

        // Создаем содержимое
        this.renderBoard();

        // Добавляем в DOM
        document.body.appendChild(this.container);

        // Настраиваем обработчики событий
        this.setupEventListeners();

        console.log('[PhotoBoard] Opened');
    }

    /**
     * Рендер доски с фотографиями
     */
    renderBoard() {
        const photosHTML = this.photos.map((photo, index) => {
            const isFocused = index === this.focusedIndex;
            return `
                <div class="polaroid-photo ${isFocused ? 'focused' : ''}"
                     data-index="${index}"
                     style="
                        left: ${photo.left};
                        top: ${photo.top};
                        transform: rotate(${photo.rotation}deg) ${isFocused ? 'scale(1.2)' : 'scale(1)'};
                        z-index: ${isFocused ? 100 : index};
                     ">
                    <div class="polaroid-pin" style="background-color: ${photo.pinColor};"></div>
                    ${photo.hasStar ? '<div class="polaroid-star">⭐</div>' : ''}
                    <img src="${photo.src}" alt="Memory ${photo.id}" class="polaroid-image" />
                    <div class="polaroid-caption">${photo.caption}</div>
                </div>
            `;
        }).join('');

        this.container.innerHTML = `
            <div class="cork-board">
                ${photosHTML}
            </div>
            <div class="photoboard-controls">
                <div class="photoboard-hint">WASD — Навигация | E — Увеличить | Esc — Закрыть</div>
            </div>
        `;

        // Сразу показываем доску (изображение уже загружено в PreloadScene)
        const corkBoard = this.container.querySelector('.cork-board');
        // Небольшая задержка для плавности анимации
        requestAnimationFrame(() => {
            corkBoard.classList.add('loaded');
        });
    }

    /**
     * Рендер режима увеличения
     */
    renderZoomMode() {
        const photo = this.photos[this.focusedIndex];

        this.container.innerHTML = `
            <div class="photo-zoom-view">
                <div class="photo-zoom-container">
                    <img src="${photo.src}" alt="Memory ${photo.id}" class="photo-zoom-image" />
                </div>
                <div class="photo-zoom-controls">
                    <div class="photoboard-hint">[E] ЗАКРЫТЬ</div>
                </div>
            </div>
        `;
    }

    /**
     * Закрыть доску
     */
    close() {
        if (!this.isOpen) {
            console.log('[PhotoBoard] Already closed, ignoring');
            return;
        }

        this.isOpen = false;

        // Удаляем обработчики
        window.removeEventListener('keydown', this.handleKeyDown);

        // Удаляем DOM элемент
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        // Показываем панель чата
        if (window.chatPanel) {
            window.chatPanel.show();
        }

        console.log('[PhotoBoard] Closed');

        // Вызываем колбэк
        const callback = this.onCloseCallback;
        this.onCloseCallback = null;

        if (callback) {
            callback();
        }
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        window.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Обработка нажатий клавиш
     */
    handleKeyDown(event) {
        if (!this.isOpen) return;

        const code = event.code;
        const key = event.key.toLowerCase();

        // Определяем наши клавиши
        const isOurKey =
            code === 'KeyW' ||
            code === 'KeyA' ||
            code === 'KeyS' ||
            code === 'KeyD' ||
            code === 'KeyE' ||
            key === 'escape';

        if (!isOurKey) return;

        event.stopPropagation();
        event.preventDefault();

        console.log(`[PhotoBoard] Key pressed - code: ${code}, key: ${key}, zoom: ${this.zoomMode}`);

        if (!this.zoomMode) {
            // Режим доски - навигация по фото в 2D
            if (code === 'KeyW') {
                this.navigate('up');
            } else if (code === 'KeyS') {
                this.navigate('down');
            } else if (code === 'KeyA') {
                this.navigate('left');
            } else if (code === 'KeyD') {
                this.navigate('right');
            } else if (code === 'KeyE') {
                this.openZoom();
            } else if (key === 'escape') {
                this.close();
            }
        } else {
            // Режим увеличения - только закрытие
            if (code === 'KeyE' || key === 'escape') {
                this.closeZoom();
            }
        }
    }

    /**
     * Карта навигации между фотографиями
     * Формат: { photoIndex: { up: targetIndex, down: targetIndex, left: targetIndex, right: targetIndex } }
     * Индексы от 0 до 18 (соответствуют ID фото 1-19)
     * w=up, s=down, a=left, d=right
     */
    getNavigationMap() {
        return {
            0: { up: null, down: 6, left: 18, right: 1 },      // Фото 1: d2, s7, a19
            1: { up: null, down: 7, left: 0, right: 2 },       // Фото 2: a1, d3, s8
            2: { up: null, down: 8, left: 1, right: 3 },       // Фото 3: a2, d4, s9
            3: { up: null, down: 9, left: 2, right: 4 },       // Фото 4: a3, d5, s10
            4: { up: null, down: 10, left: 3, right: 5 },      // Фото 5: a4, d6, s11
            5: { up: null, down: 11, left: 4, right: 6 },      // Фото 6: a5, d7, s12
            6: { up: 0, down: 12, left: 5, right: 7 },         // Фото 7: d8, w1, s13, a6
            7: { up: 1, down: 13, left: 6, right: 8 },         // Фото 8: a7, d9, w2, s14
            8: { up: 2, down: 14, left: 7, right: 9 },         // Фото 9: a8, d10, w3, s15
            9: { up: 3, down: 15, left: 8, right: 10 },        // Фото 10: a9, d11, w4, s16
            10: { up: 4, down: 16, left: 9, right: 11 },       // Фото 11: a10, d12, w5, s17
            11: { up: 5, down: 17, left: 10, right: 12 },      // Фото 12: a11, d13, w6, s18
            12: { up: 6, down: null, left: 11, right: 13 },    // Фото 13: w7, d14, a12
            13: { up: 7, down: null, left: 12, right: 14 },    // Фото 14: a13, d15, w8
            14: { up: 8, down: 18, left: 13, right: 15 },      // Фото 15: a14, d16, w9, s19
            15: { up: 9, down: null, left: 14, right: 16 },    // Фото 16: a15, d17, w10
            16: { up: 10, down: null, left: 15, right: 17 },   // Фото 17: a16, d18, w11
            17: { up: 11, down: null, left: 16, right: 18 },   // Фото 18: a17, w12, d19
            18: { up: 14, down: null, left: 17, right: 0 }     // Фото 19: a18, w15, d1
        };
    }

    /**
     * Навигация по фотографиям в 2D (пространственная навигация)
     */
    navigate(direction) {
        const navigationMap = this.getNavigationMap();
        const currentIndex = this.focusedIndex;

        // Получаем возможные переходы для текущей фотографии
        const transitions = navigationMap[currentIndex];

        if (!transitions) {
            console.log(`[PhotoBoard] No navigation map for photo: ${currentIndex + 1}`);
            return;
        }

        // Получаем индекс следующей фотографии в заданном направлении
        let nextIndex = null;

        switch (direction) {
            case 'up':
                nextIndex = transitions.up;
                break;
            case 'down':
                nextIndex = transitions.down;
                break;
            case 'left':
                nextIndex = transitions.left;
                break;
            case 'right':
                nextIndex = transitions.right;
                break;
        }

        // Если есть переход - переключаемся
        if (nextIndex !== null) {
            this.focusedIndex = nextIndex;
            this.updateFocus();
            console.log(`[PhotoBoard] Navigated ${direction} from photo ${currentIndex + 1} to photo ${nextIndex + 1}`);
        } else {
            console.log(`[PhotoBoard] No photo in direction "${direction}" from photo ${currentIndex + 1}`);
        }
    }

    /**
     * Обновить фокус на фотографиях
     */
    updateFocus() {
        const photos = this.container.querySelectorAll('.polaroid-photo');

        photos.forEach((photoEl, index) => {
            const photo = this.photos[index];
            const isFocused = index === this.focusedIndex;

            if (isFocused) {
                photoEl.classList.add('focused');
                photoEl.style.transform = `rotate(${photo.rotation}deg) scale(1.2)`;
                photoEl.style.zIndex = '100';
            } else {
                photoEl.classList.remove('focused');
                photoEl.style.transform = `rotate(${photo.rotation}deg) scale(1)`;
                photoEl.style.zIndex = index.toString();
            }
        });
    }

    /**
     * Открыть режим увеличения
     */
    openZoom() {
        console.log(`[PhotoBoard] Opening zoom for photo: ${this.focusedIndex + 1}`);
        this.zoomMode = true;
        this.renderZoomMode();
    }

    /**
     * Закрыть режим увеличения
     */
    closeZoom() {
        console.log('[PhotoBoard] Closing zoom, returning to board');
        this.zoomMode = false;
        this.renderBoard();

        // Восстанавливаем фокус
        setTimeout(() => {
            this.updateFocus();
        }, 50);
    }

}
