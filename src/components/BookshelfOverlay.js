/**
 * BookshelfOverlay - Компонент для просмотра книг
 * Отображает карусель с обложками книг и режим чтения с эффектом печатной машинки
 */
export default class BookshelfOverlay {
    constructor(onCloseCallback) {
        this.onCloseCallback = onCloseCallback;
        this.currentIndex = 0;
        this.container = null;
        this.isOpen = false;
        this.mode = 'carousel'; // 'carousel' или 'reading'
        this.typewriterActive = false;
        this.typewriterText = '';
        this.typewriterIndex = 0;
        this.typewriterTimeouts = []; // Массив для хранения всех активных таймаутов

        // Инициализация звука печатания
        this.typingAudio = new Audio('./assets/sounds/typing.mp3');
        this.typingAudio.volume = 0.15; // Устанавливаем громкость потише

        // ===== ДАННЫЕ КНИГ ===== (ПОДСКАЗКА: ровно 4 книги - цифра 4)
        this.books = [
            {
                id: 'windup',
                title: 'Хроники Заводной Птицы',
                author: 'Харуки Мураками',
                cover: './assets/books/book_windup.jpeg',
                quote: "Деньги надо тратить, не думая при этом, приобретешь ты или потеряешь. А энергию – беречь на то, чего нельзя купить за деньги."
            },
            {
                id: 'killing',
                title: 'Убийство Командора',
                author: 'Харуки Мураками',
                cover: './assets/books/book_killing.jpeg',
                quote: "Мариэ, ничего не говоря, просто посмотрела мне в глаза. Так заглядывают в дом, прижав лицо к стеклу."
            },
            {
                id: 'afterdark',
                title: 'Послемрак',
                author: 'Харуки Мураками',
                cover: './assets/books/book_afterdark.jpeg',
                quote: "Если очень сильно хочешь что-то узнать, плати свою цену."
            },
            {
                id: 'kafka',
                title: 'Кафка на пляже',
                author: 'Харуки Мураками',
                cover: './assets/books/book_kafka.jpeg',
                quote: "Медленно вращается земля. Но мы здесь ни при чем, мы все живем во сне."
            }
        ];

        // Привязываем методы к контексту
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    /**
     * Открыть окно просмотра книг
     */
    open() {
        this.isOpen = true;
        this.mode = 'carousel';

        // Скрываем панель чата
        if (window.chatPanel) {
            window.chatPanel.hide();
        }

        // Создаем контейнер
        this.container = document.createElement('div');
        this.container.id = 'bookshelf-overlay';
        this.container.className = 'bookshelf-overlay';

        // Создаем содержимое
        this.renderCarousel();

        // Добавляем в DOM
        document.body.appendChild(this.container);

        // Настраиваем обработчики событий
        this.setupEventListeners();

        console.log('[BookshelfOverlay] Opened in carousel mode');
    }

    /**
     * Рендер режима карусели
     */
    renderCarousel() {
        const currentBook = this.books[this.currentIndex];

        this.container.innerHTML = `
            <div class="bookshelf-window">
                <div class="bookshelf-header">
                    <h2>КНИЖНАЯ ПОЛКА</h2>
                </div>

                <div class="book-carousel">
                    <button class="carousel-arrow left" id="book-arrow-left">◄</button>

                    <div class="carousel-center">
                        <div class="book-cover-frame">
                            <img
                                id="book-cover-img"
                                src="${currentBook.cover}"
                                alt="${currentBook.title}"
                                class="book-cover"
                            />
                        </div>
                        <div class="book-title">${currentBook.title}</div>
                        <div class="book-author">${currentBook.author}</div>
                    </div>

                    <button class="carousel-arrow right" id="book-arrow-right">►</button>
                </div>

                <div class="bookshelf-controls">
                    <div class="bookshelf-hint">A/D — Листать | E — Открыть | Esc — Закрыть</div>
                    <button class="bookshelf-open-btn" id="bookshelf-open-btn">
                        (E) ОТКРЫТЬ КНИГУ
                    </button>
                </div>
            </div>
        `;

        // Перенастраиваем кнопки после рендера
        if (this.isOpen) {
            this.setupCarouselButtons();
        }
    }

    /**
     * Рендер режима чтения
     */
    renderReading() {
        const currentBook = this.books[this.currentIndex];

        this.container.innerHTML = `
            <div class="bookshelf-window reading-mode">
                <div class="book-pages">
                    <div class="book-page">
                        <div class="page-content">
                            <h1 id="reading-title" class="reading-title"></h1>
                            <p id="reading-author" class="reading-author"></p>
                            <p id="reading-quote" class="reading-quote"></p>
                        </div>
                    </div>
                </div>

                <div class="bookshelf-controls reading-controls">
                    <div class="bookshelf-hint">E или Esc — Закрыть книгу</div>
                </div>
            </div>
        `;

        // Запускаем эффект печатной машинки
        setTimeout(() => {
            this.startTypewriter(currentBook);
        }, 300);
    }

    /**
     * Эффект печатной машинки
     */
    startTypewriter(book) {
        this.typewriterActive = true;
        this.typewriterIndex = 0;
        this.typewriterTimeouts = []; // Очищаем предыдущие таймауты

        const titleEl = document.getElementById('reading-title');
        const authorEl = document.getElementById('reading-author');
        const quoteEl = document.getElementById('reading-quote');

        // Последовательная печать: title -> author -> quote
        const typeText = (element, text, speed, callback) => {
            let index = 0;

            const typeNextChar = () => {
                if (!this.typewriterActive) {
                    // Если печатание отменено, прерываем
                    return;
                }

                if (index < text.length) {
                    const char = text[index];
                    element.textContent += char;

                    // Проигрываем звук только если символ - не пробел
                    if (char !== ' ') {
                        // Добавляем небольшую вариацию питча (от 0.9 до 1.1)
                        this.typingAudio.playbackRate = 0.9 + Math.random() * 0.2;
                        // Сбрасываем время, чтобы звук мог играть быстро повторно
                        this.typingAudio.currentTime = 0;
                        this.typingAudio.play().catch(() => {}); // catch нужен, чтобы браузер не ругался
                    }

                    index++;

                    // Вычисляем задержку для следующего символа
                    let nextDelay = speed;

                    // Добавляем небольшую случайную вариацию (±20ms)
                    nextDelay += Math.random() * 40 - 20;

                    // Случайные паузы для реалистичности (10% шанс)
                    if (Math.random() < 0.1) {
                        nextDelay += speed * 2; // Пауза в 2-3 раза дольше
                    }

                    // Паузы после знаков препинания
                    if (char === ',' || char === ';') {
                        nextDelay += speed * 1.5; // Небольшая пауза
                    } else if (char === '.' || char === '!' || char === '?') {
                        nextDelay += speed * 3; // Более длинная пауза
                    }

                    const timeoutId = setTimeout(typeNextChar, nextDelay);
                    this.typewriterTimeouts.push(timeoutId);
                } else {
                    if (callback) callback();
                }
            };

            typeNextChar();
        };

        // Печатаем название (медленно и торжественно)
        typeText(titleEl, book.title, 120, () => {
            // Затем автора (немного быстрее)
            typeText(authorEl, book.author, 100, () => {
                // Затем цитату (как будто на старой машинке)
                typeText(quoteEl, book.quote, 85, () => {
                    this.typewriterActive = false;
                });
            });
        });
    }

    /**
     * Закрыть окно
     */
    close() {
        if (!this.isOpen) {
            console.log('[BookshelfOverlay] Already closed, ignoring');
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

        console.log('[BookshelfOverlay] Closed');

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
        this.setupCarouselButtons();
    }

    /**
     * Настройка кнопок карусели
     */
    setupCarouselButtons() {
        const leftBtn = document.getElementById('book-arrow-left');
        const rightBtn = document.getElementById('book-arrow-right');
        const openBtn = document.getElementById('bookshelf-open-btn');

        if (leftBtn) leftBtn.addEventListener('click', () => this.navigate(-1));
        if (rightBtn) rightBtn.addEventListener('click', () => this.navigate(1));
        if (openBtn) openBtn.addEventListener('click', () => this.openBook());
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
            code === 'KeyA' ||
            code === 'KeyD' ||
            code === 'KeyE' ||
            key === 'escape';

        if (!isOurKey) return;

        event.stopPropagation();
        event.preventDefault();

        console.log(`[BookshelfOverlay] Key pressed - code: ${code}, key: ${key}, mode: ${this.mode}`);

        if (this.mode === 'carousel') {
            // Режим карусели
            if (code === 'KeyA') {
                this.navigate(-1);
            } else if (code === 'KeyD') {
                this.navigate(1);
            } else if (code === 'KeyE') {
                this.openBook();
            } else if (key === 'escape') {
                this.close();
            }
        } else if (this.mode === 'reading') {
            // Режим чтения - только закрытие
            if (code === 'KeyE' || key === 'escape') {
                this.closeBook();
            }
        }
    }

    /**
     * Навигация по карусели
     */
    navigate(direction) {
        this.currentIndex = (this.currentIndex + direction + this.books.length) % this.books.length;
        this.updateDisplay();
        console.log(`[BookshelfOverlay] Navigated to: ${this.books[this.currentIndex].title}`);
    }

    /**
     * Обновить отображение текущей книги
     */
    updateDisplay() {
        const coverImg = document.getElementById('book-cover-img');
        const titleDiv = document.querySelector('.book-title');
        const authorDiv = document.querySelector('.book-author');

        if (coverImg && titleDiv && authorDiv) {
            const current = this.books[this.currentIndex];

            // Анимация смены
            coverImg.style.opacity = '0';
            titleDiv.style.opacity = '0';
            authorDiv.style.opacity = '0';

            setTimeout(() => {
                coverImg.src = current.cover;
                coverImg.alt = current.title;
                titleDiv.textContent = current.title;
                authorDiv.textContent = current.author;

                coverImg.style.opacity = '1';
                titleDiv.style.opacity = '1';
                authorDiv.style.opacity = '1';
            }, 200);
        }
    }

    /**
     * Открыть книгу (переход в режим чтения)
     */
    openBook() {
        console.log(`[BookshelfOverlay] Opening book: ${this.books[this.currentIndex].title}`);
        this.mode = 'reading';
        this.renderReading();
    }

    /**
     * Закрыть книгу (вернуться в карусель)
     */
    closeBook() {
        console.log('[BookshelfOverlay] Closing book, returning to carousel');
        this.mode = 'carousel';
        this.typewriterActive = false;

        // Останавливаем звук печатания
        this.typingAudio.pause();
        this.typingAudio.currentTime = 0;

        // Очищаем все активные таймауты печатания
        this.typewriterTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.typewriterTimeouts = [];

        this.renderCarousel();
    }
}
