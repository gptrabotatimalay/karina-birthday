/**
 * MusicManager - Глобальная система управления музыкой
 *
 * Отвечает за:
 * - Хранение состояния музыки между сценами
 * - Продолжение воспроизведения при переходе между комнатами
 * - Регулировка громкости в зависимости от локации
 */

class MusicManager {
    constructor() {
        // Состояние музыки
        this.selectedRecord = null; // Объект пластинки {id, name, cover, track}
        this.isPlaying = false;      // Играет ли музыка
        this.currentAudio = null;    // HTML Audio объект
        this.sourceRoom = null;      // Комната, где включили музыку ('GameScene' или 'KitchenScene')

        // Настройки громкости
        this.baseVolume = 0.5;       // Базовая громкость (50%)
        this.quietVolume = 0.25;     // Тихая громкость для других комнат (25% - в 2 раза тише)
    }

    /**
     * Выбрать пластинку
     */
    selectRecord(record) {
        console.log(`[MusicManager] Selected record: ${record.name}`);

        // Останавливаем текущий трек если играет
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }

        // Сохраняем выбранную пластинку
        this.selectedRecord = record;
        this.isPlaying = false;
        this.sourceRoom = null;

        // Готовим новый аудио объект
        if (record) {
            this.currentAudio = new Audio(record.track);
            this.currentAudio.loop = true; // Зацикливаем музыку
            this.currentAudio.volume = this.baseVolume;
        }
    }

    /**
     * Включить музыку в определенной комнате
     */
    playMusic(roomName) {
        if (!this.selectedRecord) {
            console.log('[MusicManager] No record selected');
            return false;
        }

        // Сохраняем комнату, где включили музыку
        this.sourceRoom = roomName;

        // Устанавливаем полную громкость
        this.currentAudio.volume = this.baseVolume;

        // Включаем музыку
        this.currentAudio.play().catch(err => {
            console.error('[MusicManager] Failed to play:', err);
        });

        this.isPlaying = true;
        console.log(`[MusicManager] Playing in ${roomName} at volume ${this.baseVolume}`);
        return 'playing';
    }

    /**
     * Пауза музыки
     */
    pauseMusic() {
        if (!this.selectedRecord) {
            console.log('[MusicManager] No record selected');
            return false;
        }

        this.currentAudio.pause();
        this.isPlaying = false;
        this.sourceRoom = null;
        console.log('[MusicManager] Paused');
        return 'paused';
    }

    /**
     * Полная остановка музыки (для финала игры)
     */
    stopAllMusic() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        this.isPlaying = false;
        this.sourceRoom = null;
        console.log('[MusicManager] All music stopped');
    }

    /**
     * Включить/выключить музыку (toggle)
     */
    toggleMusic(roomName) {
        if (!this.selectedRecord) {
            console.log('[MusicManager] No record selected');
            return false;
        }

        if (this.isPlaying) {
            return this.pauseMusic();
        } else {
            return this.playMusic(roomName);
        }
    }

    /**
     * Обновить громкость при переходе в другую комнату
     */
    updateVolumeForRoom(currentRoomName) {
        if (!this.isPlaying || !this.currentAudio) {
            return;
        }

        // Если мы в комнате, где включили музыку - полная громкость
        if (currentRoomName === this.sourceRoom) {
            this.currentAudio.volume = this.baseVolume;
            console.log(`[MusicManager] In source room (${currentRoomName}), volume: ${this.baseVolume}`);
        } else {
            // Если в другой комнате - тихая громкость (в 2 раза тише)
            this.currentAudio.volume = this.quietVolume;
            console.log(`[MusicManager] In different room (${currentRoomName}), volume: ${this.quietVolume}`);
        }
    }

    /**
     * Получить текущее состояние
     */
    getState() {
        return {
            selectedRecord: this.selectedRecord,
            isPlaying: this.isPlaying,
            sourceRoom: this.sourceRoom
        };
    }
}

// Создаем глобальный экземпляр (singleton)
const musicManager = new MusicManager();

export default musicManager;
