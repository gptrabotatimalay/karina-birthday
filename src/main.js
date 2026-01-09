import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import PreloadScene from './scenes/PreloadScene';
import GameScene from './scenes/GameScene';
import KitchenScene from './scenes/KitchenScene';
import BathroomScene from './scenes/BathroomScene';
import HallwayScene from './scenes/HallwayScene';

const config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 900,
    parent: 'game-container',
    backgroundColor: '#2d2d2d',
    pixelArt: true,
    roundPixels: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false  // Debug отключен
        }
    },
    scene: [BootScene, PreloadScene, GameScene, KitchenScene, BathroomScene, HallwayScene]
};

const game = new Phaser.Game(config);
