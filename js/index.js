import { Game } from "../pkg/index";
import { memory } from "../pkg/index_bg";
import * as Pixi from "pixi.js";

// aliases for Pixi's classes
const Application = Pixi.Application;
const Graphics = Pixi.Graphics;
const Text = Pixi.Text;
const TextStyle = Pixi.TextStyle;
const Sprite = Pixi.Sprite;
const Rectangle = Pixi.Rectangle;
const TextureCache = Pixi.utils.TextureCache;

const loader = Pixi.Loader.shared;

// declare some constants
const COLORS = {
    White: 0xFFFFFF,
    GreyFG: 0xEEEEEE,
    MainBgColor: 0x1B262C,
    Cyan: 0x47C7EE,
    Yellow: 0xFFCC00,
    Purple: 0x6D59EF,
    Green: 0xB0CC13,
    Red: 0xFF1149,
    Blue: 0x3C9EE3,
    Orange: 0xFF6536,
};

const WIDTH  = 800;                     // canvas width
const HEIGHT = 600;                     // canvas height

const GAME = {
    Board: { 
        Width: 10,                      // these two define number of tetriminos
        Height: 20                      // across a game board's x and y axis
    },
    Tetrimino: { 
        Length: 25                      // how many pixel a tetrimino takes
    },
    TextStyle: new TextStyle({          // this style will be used to draw everything in-game
        fontFamily: 'armada',           // score, held texture, etc.
        fontSize: 18,
        fill: COLORS.White,
    }),
};

const canvas = document.getElementById("canvas");
const app = new Application({
    width: WIDTH,
    height: HEIGHT,
    transparent: true,
    antialias: true,
    view: canvas,
});
const game = Game.new(GAME.Board.Width, GAME.Board.Height);

loader.add("tileset.png")
      .add("tileset.json")
      .load(() => setup(app));

function setup(app) {
    drawMainGrid(app);
    drawScore(app);
    drawHeld(app);
    drawNext(app, game);
    drawControl(app);
    drawLoop(app);
}

function drawLoop(app) {
}

function drawMainGrid(app) {
    const rectangle = new Graphics();
    const boardWidth = GAME.Tetrimino.Length * GAME.Board.Width;
    const boardHeight = GAME.Tetrimino.Length * GAME.Board.Height;

    rectangle.lineStyle(1, COLORS.White, 1);
    rectangle.drawRect(0, 0, boardWidth, boardHeight);
    rectangle.x = WIDTH/2 - boardWidth/2;
    rectangle.y = HEIGHT/2 - boardHeight/2;
    app.stage.addChild(rectangle);

    // vertical lines
    for (let i=1; i<=GAME.Board.Width; i++) {
        let line = new Graphics();
        line.lineStyle(1, COLORS.White, 0.1);
        line.moveTo(0, 0);
        line.lineTo(0, boardHeight);
        line.x = rectangle.x + (i*GAME.Tetrimino.Length);
        line.y = rectangle.y;
        app.stage.addChild(line);
    }
    
    // horizontal lines
    for (let i=1; i<=GAME.Board.Height; i++) {
        let line = new Graphics();
        line.lineStyle(1, COLORS.White, 0.1);
        line.moveTo(0, 0);
        line.lineTo(boardWidth, 0);
        line.x = rectangle.x;
        line.y = rectangle.y + (i*GAME.Tetrimino.Length);
        app.stage.addChild(line);
    }
}

function drawScore(app) {
    let score = new Text("0000050", GAME.TextStyle);
    score.x = 430;
    score.y = 16;
    app.stage.addChild(score);
}

function drawHeld(app) {
    let label = new Text("HELD", GAME.TextStyle);
    label.x = 190;
    label.y = 53;
    app.stage.addChild(label);
}

function drawNext(app, game) {
    let label = new Text("NEXT", GAME.TextStyle);
    label.x = 555;
    label.y = 53;
    app.stage.addChild(label);

    const nextPiecesPtr = game.next_pieces();
    const nextPieces = new Uint8Array(memory.buffer, nextPiecesPtr, GAME.Board.Width, GAME.Board.Height);
    for (let i=0; i<3; i++) {
        let sprite = getSmallTetriminoSprite(nextPieces[i]);
        sprite.x = 560;
        sprite.y = 91 + i*80;

        app.stage.addChild(sprite);
    }
}

function drawControl(app) {
    let boardWidth = GAME.Tetrimino.Length * GAME.Board.Width;
    let boardHeight = GAME.Tetrimino.Length * GAME.Board.Height;

    let x = WIDTH/2 - boardWidth/2 - 2;
    let y = HEIGHT/2 + boardHeight/2 + 8;

    const id = loader.resources["tileset.json"].textures;
    
    let sprites = [
        ["ctrl_z.png",      x],
        ["ctrl_x.png",      x+32],
        ["ctrl_c.png",      x+64],
        ["ctrl_space.png",  x+96],
        ["ctrl_left.png",   x+168],
        ["ctrl_down.png",   x+200],
        ["ctrl_right.png",  x+232],
    ];

    sprites.forEach(sprite => {
        let [name, xpos] = sprite;
        let s = new Sprite(id[name]);
        s.x = xpos;
        s.y = y;
        app.stage.addChild(s);
    })
}

// methods for drawing tetriminos
function getSmallTetriminoSprite(type) {
    const id = loader.resources["tileset.json"].textures;
    let sprite = new Sprite(id[`t_${type}_small.png`]);
    return sprite;
}