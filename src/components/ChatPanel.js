import { DASHA_SCRIPT } from '../data/dashaScript';

/**
 * ChatPanel - Постоянная панель чата справа от игры
 * Активируется только при взаимодействии с Дашей
 */
export default class ChatPanel {
    constructor() {
        this.container = null;
        this.messagesContainer = null;
        this.optionsContainer = null;
        this.inactiveHint = null;

        this.isActive = false;
        this.currentLevel = 'bedroom'; // bedroom, kitchen, bathroom, corridor
        this.currentNode = 'root';
        this.messages = [];

        this.onOptionSelect = null; // Callback при выборе опции

        this.create();
    }

    create() {
        // Создаем контейнер панели
        this.container = document.createElement('div');
        this.container.className = 'chat-panel';
        this.container.innerHTML = `
            <div class="chat-panel-header">
                <div class="chat-panel-title">Даша</div>
                <div class="chat-panel-status">
                    <span class="status-dot"></span>
                    <span class="status-text">Оффлайн</span>
                </div>
            </div>
            <div class="chat-panel-messages"></div>
            <div class="chat-panel-options"></div>
            <div class="chat-panel-inactive">
                <div class="inactive-icon">💬</div>
                <div class="inactive-text">Подойди к Даше,<br>чтобы поговорить</div>
            </div>
        `;

        document.body.appendChild(this.container);

        // Сохраняем ссылки на элементы
        this.messagesContainer = this.container.querySelector('.chat-panel-messages');
        this.optionsContainer = this.container.querySelector('.chat-panel-options');
        this.inactiveHint = this.container.querySelector('.chat-panel-inactive');
        this.statusDot = this.container.querySelector('.status-dot');
        this.statusText = this.container.querySelector('.status-text');

        // Изначально неактивна
        this.messagesContainer.style.display = 'none';
        this.optionsContainer.style.display = 'none';
        this.setActive(false);

        console.log('[ChatPanel] Created and added to DOM');
    }

    /**
     * Установить активность панели
     * @param {boolean} active - активна ли панель
     */
    setActive(active) {
        console.log(`[ChatPanel] setActive(${active}), currentLevel: ${this.currentLevel}`);
        this.isActive = active;

        if (active) {
            this.container.classList.add('active');
            this.inactiveHint.style.display = 'none';
            this.messagesContainer.style.display = 'flex';
            this.optionsContainer.style.display = 'flex';
            this.statusDot.classList.add('online');
            this.statusText.textContent = 'Онлайн';

            // Показываем приветствие и опции
            this.showGreeting();
            console.log('[ChatPanel] Greeting shown, options should be visible');
        } else {
            this.container.classList.remove('active');
            this.inactiveHint.style.display = 'flex';
            this.messagesContainer.style.display = 'none';
            this.optionsContainer.style.display = 'none';
            this.statusDot.classList.remove('online');
            this.statusText.textContent = 'Оффлайн';
        }
    }

    /**
     * Установить текущий уровень (комнату)
     * @param {string} level - bedroom, kitchen, bathroom, corridor
     */
    setLevel(level) {
        if (this.currentLevel !== level) {
            this.currentLevel = level;
            this.currentNode = 'root';
            // Очищаем сообщения при смене комнаты
            this.clearMessages();
            console.log(`[ChatPanel] Level changed to: ${level}`);
        }
    }

    /**
     * Показать приветствие Даши
     */
    showGreeting() {
        const script = DASHA_SCRIPT[this.currentLevel];
        if (!script) {
            console.warn(`[ChatPanel] No script for level: ${this.currentLevel}`);
            return;
        }

        const node = script.root;

        // Показываем случайное приветствие (если есть)
        if (node.greetings && node.greetings.length > 0) {
            const greeting = node.greetings[Math.floor(Math.random() * node.greetings.length)];
            this.addMessage('dasha', greeting);
        }

        // Показываем опции
        this.showOptions(node.options);
    }

    /**
     * Добавить сообщение в чат
     * @param {string} sender - 'dasha' или 'karina'
     * @param {string} text - текст сообщения
     */
    addMessage(sender, text) {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${sender}`;
        const avatarUrl = sender === 'dasha'
            ? 'assets/ui/dasha_avatar.webp'
            : 'assets/ui/karina_avatar.webp';
        messageEl.innerHTML = `
            <div class="message-avatar">
                <img src="${avatarUrl}" alt="${sender === 'dasha' ? 'Даша' : 'Карина'}">
            </div>
            <div class="message-content">
                <div class="message-sender">${sender === 'dasha' ? 'Даша' : 'Карина'}</div>
                <div class="message-text">${text}</div>
            </div>
        `;

        this.messagesContainer.appendChild(messageEl);
        this.messages.push({ sender, text });

        // Прокручиваем вниз
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

        // Анимация появления
        messageEl.style.animation = 'messageSlideIn 0.3s ease';
    }

    /**
     * Показать опции для выбора
     * @param {Array} options - массив опций { label, next }
     */
    showOptions(options) {
        this.optionsContainer.innerHTML = '';

        if (!options || options.length === 0) {
            return;
        }

        options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'chat-option-btn';
            btn.textContent = option.label;
            btn.style.animationDelay = `${index * 0.1}s`;

            btn.addEventListener('click', () => {
                this.handleOptionSelect(option);
            });

            this.optionsContainer.appendChild(btn);
        });
    }

    /**
     * Обработка выбора опции
     * @param {Object} option - выбранная опция { label, next }
     */
    handleOptionSelect(option) {
        // Добавляем сообщение от Карины
        this.addMessage('karina', option.label);

        // Переходим к следующему узлу
        const script = DASHA_SCRIPT[this.currentLevel];
        const nextNode = script[option.next];

        if (!nextNode) {
            console.warn(`[ChatPanel] Node not found: ${option.next}`);
            return;
        }

        this.currentNode = option.next;

        // Небольшая задержка перед ответом Даши
        setTimeout(() => {
            // Показываем ответ Даши (если есть текст)
            if (nextNode.text) {
                this.addMessage('dasha', nextNode.text);
            }

            // Показываем новые опции
            setTimeout(() => {
                this.showOptions(nextNode.options);
            }, 300);
        }, 500);

        // Вызываем callback
        if (this.onOptionSelect) {
            this.onOptionSelect(option);
        }
    }

    /**
     * Очистить историю сообщений
     */
    clearMessages() {
        this.messagesContainer.innerHTML = '';
        this.messages = [];
    }

    /**
     * Скрыть панель (при открытии любого оверлея/взаимодействия)
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            console.log('[ChatPanel] Hidden');
        }
    }

    /**
     * Показать панель (при закрытии оверлея)
     */
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
            console.log('[ChatPanel] Shown');
        }
    }

    /**
     * Уничтожить панель
     */
    destroy() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        console.log('[ChatPanel] Destroyed');
    }
}
