import buildLevel from "../src/utils/level_procedural_generator/level-builder";
import CharacterFactory from "../src/characters/character_factory";
import Union from "../src/ai/steerings/union"
import Group from "../src/characters/group";
import auroraSpriteSheet from '../assets/sprites/characters/aurora.png'
import punkSpriteSheet from '../assets/sprites/characters/punk.png'
import blueSpriteSheet from '../assets/sprites/characters/blue.png'
import yellowSpriteSheet from '../assets/sprites/characters/yellow.png'
import greenSpriteSheet from '../assets/sprites/characters/green.png'
import slimeSpriteSheet from '../assets/sprites/characters/slime.png'
import Footsteps from "../assets/audio/footstep_ice_crunchy_run_01.wav";
import EffectsFactory from "../src/utils/effects-factory";
import tilemapPng from '../assets/tileset/Dungeon_Tileset.png'
import create_map from "../src/utils/evseenko_chukhin/map_creation";
import CellularAutomataMapGenerator from '../src/utils/automata_generator/map-generator';
import CellularAutomataLevelBuilder from '../src/utils/automata_generator/level-builder';
import { TILES } from '../src/utils/automata_generator/tiles';

let ScenePatseevUshakov = new Phaser.Class({

    Extends: Phaser.Scene,


    initialize: function StartingScene() {
        Phaser.Scene.call(this, {key: 'ScenePatseevUshakov'});
    },

    effectsFrameConfig: {frameWidth: 32, frameHeight: 32},
    characterFrameConfig: {frameWidth: 31, frameHeight: 31},
    slimeFrameConfig: {frameWidth: 32, frameHeight: 32},

    preload: function () {
        //this.load.image("islands-tiles", tilemapPng);
        this.load.image("tiles", tilemapPng);
        //loading spitesheets
        this.load.spritesheet('aurora', auroraSpriteSheet, this.characterFrameConfig);
        this.load.spritesheet('blue', blueSpriteSheet, this.characterFrameConfig);
        this.load.spritesheet('green', greenSpriteSheet, this.characterFrameConfig);
        this.load.spritesheet('yellow', yellowSpriteSheet, this.characterFrameConfig);
        this.load.spritesheet('punk', punkSpriteSheet, this.characterFrameConfig);
        this.load.spritesheet('slime', slimeSpriteSheet, this.slimeFrameConfig);
        this.load.audio('footsteps', Footsteps);
        this.effectsFactory = new EffectsFactory(this);
    },

    create: function () {
        this.gameObjects = [];
        this.characterFactory = new CharacterFactory(this);
        this.level++;
        this.tileSize = 32;
        this.effectsFactory.loadAnimations();

        const generator = new CellularAutomataMapGenerator(200, 200);
        const levelMatrix = generator.buildLevel();
        const map = this.make.tilemap({
            tileWidth: this.tileSize,
            tileHeight: this.tizeSize,
            width: 200,
            height: 200
        });
        console.log(map);
        this.map = map;

        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels, true, true, true, true);

        const tileset = map.addTilesetImage("Dungeon_Tileset", "tiles");
        console.log(tileset);
        this.groundLayer = map.createBlankDynamicLayer("Ground", tileset);
        this.stuffLayer = map.createBlankDynamicLayer("Stuff", tileset);
        for (let x = 0; x < map.width; x++) {
            for (let y = 0; y < map.height; y++) {
                if (levelMatrix[x][y] == 0)
                    this.groundLayer.putTileAt(TILES.WALL, x, y);
                else this.stuffLayer.putTileAt(TILES.FLOOR, x, y);
            }
        }

        this.groundLayer.setCollisionBetween(17, 17);
        this.stuffLayer.setCollisionBetween(17, 17);

        const levelBuilder = new CellularAutomataLevelBuilder(levelMatrix, 5);
        create_map();

        const playerPosition = this.tileToPixels(levelBuilder.playerPosition);

        this.player = this.characterFactory.buildCharacter("aurora", playerPosition.x, playerPosition.y, {
            player: true
        });
        this.effectsFactory.buildEffect('flamelash', playerPosition.x, playerPosition.y);

        this.gameObjects.push(this.player);

        this.physics.add.collider(this.player, this.groundLayer);
        this.physics.add.collider(this.player, this.stuffLayer);

        const group = new Group([]);
        for (let i = 0; i < 200; i++) {
            const npc = this.tileToPixels(levelBuilder.calculateNpcPosition());
            this.explorer = this.characterFactory.buildCharacter('green', npc.x, npc.y, {Steering: new Union(this, group, i)});
            this.gameObjects.push(this.explorer);
            group.join(this.explorer);
            this.physics.add.collider(this.explorer, this.groundLayer);
            this.physics.add.collider(this.explorer, this.stuffLayer);
            this.physics.add.collider(this.explorer, this.player);
            //console.log(npc);
        }

        const camera = this.cameras.main;

        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        camera.startFollow(this.player);

        this.input.keyboard.once("keydown_D", event => {
            // Turn on physics debugging to show player's hitbox
            this.physics.world.createDebugGraphic();

            const graphics = this.add
                .graphics()
                .setAlpha(0.75)
                .setDepth(20);
        });


    },

    update: function () {
        if (this.gameObjects) {
            this.gameObjects.forEach( function(element) {
                element.update();
            });
        }
    },

    tileToPixels({ x, y }) {
        return { x: x * this.tileSize, y: y * this.tileSize };
    }
});

export default ScenePatseevUshakov
