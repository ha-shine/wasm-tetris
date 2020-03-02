import {Game} from "../pkg/index";
import {memory} from "../pkg/index_bg";
import * as WebFont from "webfontloader";
import * as Pixi from "pixi.js";

WebFont.load({
    custom: {
        families: ["armada", "neue-kabel"]
    }
});

// aliases for Pixi's classes
const Application = Pixi.Application;
const Graphics = Pixi.Graphics;
const Text = Pixi.Text;
const TextStyle = Pixi.TextStyle;
const Sprite = Pixi.Sprite;
const Ticker = Pixi.Ticker;

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

    window.addEventListener("keydown", function(event) {
        switch (event.key) {

            case "ArrowLeft":   game.move_left(); break;
            case "ArrowRight":  game.move_right(); break;
            case "ArrowDown":   game.move_down(); break;
            case " ":           game.drop(); break;
            case "Z":
            case "z":           game.rotate_counter_clockwise(); break;
            case "X":
            case "x":           game.rotate_clockwise(); break;
            case "C":
            case "c":           game.hold(); break;

            default: return;
        }

        event.preventDefault();
    });

    startDrawLoop(app);
}

function startDrawLoop(app) {
    drawActivePiece(app);

    const ticker = new Ticker();

    ticker.add(() => {
        game.update(BigInt(Math.floor(ticker.elapsedMS * 1000)));
        drawActivePiece(app);
        drawGround(app);
        drawGroundHint(app);
        drawNextPieces(app);
        drawHeldPiece(app);
    });

    ticker.start();
}

let activePieces = [];
function drawActivePiece(app) {
    // clear the existing active pieces first
    activePieces.forEach((piece) => app.stage.removeChild(piece));
    activePieces = [];

    const idxPtr = game.active_piece_coords();
    const idxes = new Uint8Array(memory.buffer, idxPtr, 4);

    const boardWidth = GAME.Tetrimino.Length * GAME.Board.Width;
    const boardHeight = GAME.Tetrimino.Length * GAME.Board.Height;
    const boardX = WIDTH/2 - boardWidth/2;
    const boardY = HEIGHT/2 - boardHeight/2;

    for (let i=0; i<4; i++) {
        let x = idxes[i] % GAME.Board.Width;
        let y = Math.floor(idxes[i] / GAME.Board.Width);

        const color = game.active_piece_color();
        const sprite = getSmallSquareSprite(color);

        sprite.x = boardX + (x * GAME.Tetrimino.Length);
        sprite.y = boardY + (y * GAME.Tetrimino.Length);

        activePieces.push(sprite);
        app.stage.addChild(sprite);
    }
}

let groundPieces = [];
function drawGround(app) {
    groundPieces.forEach((piece) => app.stage.removeChild(piece));
    groundPieces = [];

    const boardPtr = game.board();
    const board = new Uint8Array(memory.buffer, boardPtr, GAME.Board.Width * GAME.Board.Height);

    const boardWidth = GAME.Tetrimino.Length * GAME.Board.Width;
    const boardHeight = GAME.Tetrimino.Length * GAME.Board.Height;

    const boardX = WIDTH/2 - boardWidth/2;
    const boardY = HEIGHT/2 - boardHeight/2;

    for (let y = 0; y<GAME.Board.Height; y++) {
        for (let x = 0; x<GAME.Board.Width; x++) {
            let i = (y * GAME.Board.Width) + x;
            if (board[i] !== 0) {
                const sprite = getSmallSquareSprite(board[i]);
                sprite.x = boardX + (x * GAME.Tetrimino.Length);
                sprite.y = boardY + (y * GAME.Tetrimino.Length);

                groundPieces.push(sprite);
                app.stage.addChild(sprite);
            }
        }
    }
}

let groundHintSquares = [];
function drawGroundHint(app) {
    groundHintSquares.forEach((piece) => app.stage.removeChild(piece));
    groundHintSquares = [];

    const groundHintPtr = game.ground_hint_coords();
    const groundHint = new Uint8Array(memory.buffer, groundHintPtr, 4);

    const boardWidth = GAME.Tetrimino.Length * GAME.Board.Width;
    const boardHeight = GAME.Tetrimino.Length * GAME.Board.Height;

    const boardX = WIDTH/2 - boardWidth/2;
    const boardY = HEIGHT/2 - boardHeight/2;

    let color = colorOfEnum(game.active_piece_color());

    for (let i=0; i<4; i++) {
        let x = groundHint[i] % GAME.Board.Width;
        let y = Math.floor(groundHint[i] / GAME.Board.Width);

        const rectangle = new Graphics();
        rectangle.lineStyle(0, COLORS.White, 0.5);
        rectangle.beginFill(color);
        rectangle.drawRect(0, 0, 25, 25);
        rectangle.endFill();
        rectangle.x = boardX + (x * GAME.Tetrimino.Length);
        rectangle.y = boardY + (y * GAME.Tetrimino.Length);

        groundHintSquares.push(rectangle);
        app.stage.addChild(rectangle);
    }
}

function drawMainGrid(app) {
    const rectangle = new Graphics();
    const boardWidth = GAME.Tetrimino.Length * GAME.Board.Width;
    const boardHeight = GAME.Tetrimino.Length * GAME.Board.Height;

    rectangle.lineStyle(1, COLORS.White, 1);
    rectangle.drawRect(0, 0, boardWidth + 4, boardHeight + 4);
    rectangle.x = WIDTH/2 - boardWidth/2 - 2;
    rectangle.y = HEIGHT/2 - boardHeight/2 - 2;
    app.stage.addChild(rectangle);

    // vertical lines
    for (let i=1; i<GAME.Board.Width; i++) {
        let line = new Graphics();
        line.lineStyle(1, COLORS.White, 0.1);
        line.moveTo(0, 0);
        line.lineTo(0, boardHeight + 4);
        line.x = rectangle.x + (i*GAME.Tetrimino.Length) + 2;
        line.y = rectangle.y;
        app.stage.addChild(line);
    }
    
    // horizontal lines
    for (let i=1; i<GAME.Board.Height; i++) {
        let line = new Graphics();
        line.lineStyle(1, COLORS.White, 0.1);
        line.moveTo(0, 0);
        line.lineTo(boardWidth + 4, 0);
        line.x = rectangle.x;
        line.y = rectangle.y + (i*GAME.Tetrimino.Length) + 2;
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

    drawHeldPiece(app);
}

let held = null;
function drawHeldPiece(app) {
    let new_held_type = game.get_held();
    if (new_held_type !== 0) {
        let new_held = {
            type: new_held_type,
            sprite: null
        };

        if (!held) {
            new_held.sprite = getSmallTetriminoSprite(new_held_type);
            app.stage.addChild(new_held.sprite);
        } else if (held.type !== new_held_type) {
            app.stage.removeChild(held.sprite);
            new_held.sprite = getSmallTetriminoSprite(new_held_type);
            app.stage.addChild(new_held.sprite);
        } else {
            new_held.sprite = held.sprite;
        }

        held = new_held;
        held.sprite.x = 195;
        held.sprite.y = 91;
    }
}

function drawNext(app, game) {
    let label = new Text("NEXT", GAME.TextStyle);
    label.x = 555;
    label.y = 53;
    app.stage.addChild(label);

    drawNextPieces(app, game);
}

let nextPiecesSprites = [];
function drawNextPieces(app) {
    nextPiecesSprites.forEach(piece => app.stage.removeChild(piece));
    nextPiecesSprites = [];

    const nextPiecesPtr = game.next_pieces();
    const nextPieces = new Uint8Array(memory.buffer, nextPiecesPtr, 3);
    for (let i=0; i<3; i++) {
        let sprite = getSmallTetriminoSprite(nextPieces[i]);
        sprite.x = 560;
        sprite.y = 91 + i*80;

        app.stage.addChild(sprite);
        nextPiecesSprites.push(sprite);
    }
}

function drawControl(app) {
    let boardWidth = GAME.Tetrimino.Length * GAME.Board.Width;
    let boardHeight = GAME.Tetrimino.Length * GAME.Board.Height;

    let x = WIDTH/2 - boardWidth/2 - 2;
    let y = HEIGHT/2 + boardHeight/2 + 10;

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
        let [name, xPos] = sprite;
        let s = new Sprite(id[name]);
        s.x = xPos;
        s.y = y;
        app.stage.addChild(s);
    })
}

// methods for drawing tetriminos
function getSmallTetriminoSprite(type) {
    const id = loader.resources["tileset.json"].textures;
    return new Sprite(id[`t_${type}_small.png`]);
}

function getSmallSquareSprite(type) {
    const id = loader.resources["tileset.json"].textures;
    return new Sprite(id[`square_${type}.png`]);
}

function colorOfEnum(color) {
    switch (color) {
        case 1: return COLORS.Cyan;
        case 2: return COLORS.Yellow;
        case 3: return COLORS.Purple;
        case 4: return COLORS.Green;
        case 5: return COLORS.Red;
        case 6: return COLORS.Blue;
        case 7: return COLORS.Orange;
        default: return COLORS.MainBgColor;
    }
}