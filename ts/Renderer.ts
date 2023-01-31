import {
    Application,
    Container,
    Graphics,
    ITextureDictionary,
    Loader,
    Sprite, Spritesheet,
    Text,
    TextStyle,
} from "pixi.js";
import {
    BOARD_HEIGHT,
    BOARD_HEIGHT_PX,
    BOARD_WIDTH,
    BOARD_WIDTH_PX,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    Color, COLOR_MAINBG,
    COLOR_WHITE, COLOR_YELLOW,
    TETRIMINO_WIDTH_PX,
    toHex
} from "./Constants";
import {GameState} from "./GameState";
import tilesetJson from "./assets/tileset.json";

const TEXT_STYLE = new TextStyle({
    fontFamily: "armada",
    fontSize: 18,
    fill: COLOR_WHITE
});

export class Renderer {
    private pixi: Application;
    private loader: Loader;
    private textures: ITextureDictionary;
    private activePieceSprites: Sprite[];
    private groundSprites: Sprite[];
    private nextPieceSprites: Sprite[];
    private groundHintSquares: Graphics[];
    private startButton: Container;
    private restartButton: Container;

    private readonly heldPieceSprite: Sprite;
    private readonly score: Text;

    constructor(app: Application,
                loader: Loader,
                onStartButtonClicked: () => void,
                onRestartButtonClicked: () => void) {
        this.pixi = app;
        this.pixi.stage.sortableChildren = true;
        this.loader = loader;

        this.score = new Text("", TEXT_STYLE);
        this.score.x = 430;
        this.score.y = 16;

        this.activePieceSprites = [];
        this.groundSprites = [];
        this.groundHintSquares = [];
        this.nextPieceSprites = [];

        this.heldPieceSprite = new Sprite();
        this.heldPieceSprite.visible = false;
        this.heldPieceSprite.x = 195;
        this.heldPieceSprite.y = 91;
        this.pixi.stage.addChild(this.heldPieceSprite);

        this.startButton = Renderer.buildStartButtonContainer(onStartButtonClicked);
        this.pixi.stage.addChild(this.startButton);

        this.restartButton = Renderer.buildRestartButtonContainer(onRestartButtonClicked);
        this.restartButton.visible = false;
        this.pixi.stage.addChild(this.restartButton);
    }

    async setup() {
        let sheet = new Spritesheet(Loader.shared.resources["tileset.png"].texture.baseTexture, tilesetJson);
        this.textures = await new Promise<any>((resolve) => {
            sheet.parse(() => {
                console.log(sheet.textures);
                resolve(sheet.textures);
            })
        });
    }

    private static buildStartButtonContainer(onStartButtonClicked: () => void): Container {
        let container = new Container();
        let x = CANVAS_WIDTH / 2 - 66;
        let y = CANVAS_HEIGHT / 2 - 20;

        const rectangle = new Graphics();
        rectangle.beginFill(COLOR_MAINBG);
        rectangle.lineStyle(1, COLOR_YELLOW, 1);
        rectangle.drawRoundedRect(0, 0, 132, 40, 10);
        rectangle.endFill();
        rectangle.x = x;
        rectangle.y = y;
        container.addChild(rectangle);
        container.zIndex = 10;

        const textStyle = new TextStyle({fontFamily: "armada", fontSize: 18, fontWeight: "bold", fill: COLOR_YELLOW});
        const text = new Text("START", textStyle);
        text.x = x + 32;
        text.y = y + 6;
        container.addChild(text);
        container.interactive = true;
        container.buttonMode = true;
        container.on("pointerdown", () => {
            container.visible = false;
            onStartButtonClicked();
        });

        return container;
    }

    private static buildRestartButtonContainer(onRestartButtonClicked: () => void): Container {
        let container = new Container();
        let x = CANVAS_WIDTH / 2 - 66;
        let y = CANVAS_HEIGHT / 2 - 20;

        const rectangle = new Graphics();
        rectangle.beginFill(COLOR_MAINBG);
        rectangle.lineStyle(1, COLOR_YELLOW, 1);
        rectangle.drawRoundedRect(0, 0, 132, 40, 10);
        rectangle.endFill();
        rectangle.x = x;
        rectangle.y = y;
        container.addChild(rectangle);
        container.zIndex = 10;

        const textStyle = new TextStyle({fontFamily: "armada", fontSize: 18, fontWeight: "bold", fill: COLOR_YELLOW});
        const text = new Text("RESTART", textStyle);
        text.x = x + 20;
        text.y = y + 6;
        container.addChild(text);
        container.interactive = true;
        container.buttonMode = true;
        container.on("pointerdown", () => {
            container.visible = false;
            onRestartButtonClicked();
        });

        return container;
    }

    private static get gridXY(): [number, number] {
        return [
            CANVAS_WIDTH / 2 - BOARD_WIDTH_PX / 2,
            CANVAS_HEIGHT / 2 - BOARD_HEIGHT_PX / 2
        ];
    }

    // render an empty tetris board
    renderEmptyState() {
        this.renderMainGrid();
        this.renderLabels();
        this.renderControlIcons();
    }

    private renderMainGrid(): void {
        let [gridX, gridY] = Renderer.gridXY;
        const rectangle = new Graphics();
        rectangle.lineStyle(1, COLOR_WHITE, 1);
        rectangle.drawRect(0, 0, BOARD_WIDTH_PX + 4, BOARD_HEIGHT_PX + 4);
        rectangle.x = gridX - 2;
        rectangle.y = gridY - 2;
        this.pixi.stage.addChild(rectangle);

        // vertical lines
        for (let i = 1; i < BOARD_WIDTH; i++) {
            let line = new Graphics();
            line.lineStyle(1, COLOR_WHITE, 0.1);
            line.moveTo(0, 0);
            line.lineTo(0, BOARD_HEIGHT_PX + 4);
            line.x = rectangle.x + i * TETRIMINO_WIDTH_PX + 2;
            line.y = rectangle.y;
            line.zIndex = -1;
            this.pixi.stage.addChild(line);
        }

        // horizontal lines
        for (let i = 1; i < CANVAS_HEIGHT; i++) {
            let line = new Graphics();
            line.lineStyle(1, COLOR_WHITE, 0.1);
            line.moveTo(0, 0);
            line.lineTo(BOARD_WIDTH_PX + 4, 0);
            line.x = rectangle.x;
            line.y = rectangle.y + i * TETRIMINO_WIDTH_PX + 2;
            line.zIndex = -1;
            this.pixi.stage.addChild(line);
        }
    }

    private renderLabels(): void {
        this.score.text = "0000000";
        this.pixi.stage.addChild(this.score);

        let heldLabel = new Text("HELD", TEXT_STYLE);
        heldLabel.x = 190;
        heldLabel.y = 53;
        this.pixi.stage.addChild(heldLabel);

        let nextLabel = new Text("NEXT", TEXT_STYLE);
        nextLabel.x = 555;
        nextLabel.y = 53;
        this.pixi.stage.addChild(nextLabel);
    }

    private renderControlIcons(): void {
        let [gridX, gridY] = Renderer.gridXY;
        gridX -= 2;
        gridY += BOARD_HEIGHT_PX + 10;

        let sprites = [
            ["ctrl_z.png", gridX],
            ["ctrl_x.png", gridX + 32],
            ["ctrl_c.png", gridX + 64],
            ["ctrl_space.png", gridX + 96],
            ["ctrl_left.png", gridX + 168],
            ["ctrl_down.png", gridX + 200],
            ["ctrl_right.png", gridX + 232]
        ];

        sprites.forEach(sprite => {
            let [name, xPos] = sprite;
            let s = new Sprite(this.textures[name]);
            s.x = xPos as number;
            s.y = gridY;
            this.pixi.stage.addChild(s);
        });
    }

    // render game on every update
    render(game: GameState): void {
        this.renderActivePiece(game);
        this.renderBoard(game);
        this.renderGroundHint(game);
        this.renderNextPieces(game);
        this.renderHeldPiece(game);
        this.renderScore(game);

        if (game.isLost && !this.restartButton.visible) {
            this.restartButton.visible = true;
        }
    }

    private renderActivePiece(game: GameState): void {
        this.activePieceSprites.forEach(sprite =>
            this.pixi.stage.removeChild(sprite)
        );
        this.activePieceSprites = [];

        const activePieceIndexes = game.activePieceIndexes;
        const [gridX, gridY] = Renderer.gridXY;

        for (let i = 0; i < activePieceIndexes.length; i++) {
            let pieceX = activePieceIndexes[i] % BOARD_WIDTH;
            let pieceY = Math.floor(activePieceIndexes[i] / BOARD_WIDTH);

            const color = game.activePieceColor;
            const sprite = new Sprite(this.textures[`square_${color}.png`]);
            sprite.x = gridX + pieceX * TETRIMINO_WIDTH_PX;
            sprite.y = gridY + pieceY * TETRIMINO_WIDTH_PX;

            this.activePieceSprites.push(sprite);
            this.pixi.stage.addChild(sprite);
        }
    }

    private renderBoard(game: GameState): void {
        this.groundSprites.forEach(sprite => this.pixi.stage.removeChild(sprite));
        this.groundSprites = [];

        const [gridX, gridY] = Renderer.gridXY;
        const board = game.board;

        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                let i = y * BOARD_WIDTH + x;
                if (board[i] !== 0) {
                    const sprite = new Sprite(this.textures[`square_${board[i]}.png`]);
                    sprite.x = gridX + x * TETRIMINO_WIDTH_PX;
                    sprite.y = gridY + y * TETRIMINO_WIDTH_PX;

                    this.groundSprites.push(sprite);
                    this.pixi.stage.addChild(sprite);
                }
            }
        }
    }

    private renderGroundHint(game: GameState): void {
        this.groundHintSquares.forEach(sprite =>
            this.pixi.stage.removeChild(sprite)
        );
        this.groundHintSquares = [];

        const [gridX, gridY] = Renderer.gridXY;
        const groundHintIndexes = game.groundHintIndexes;
        const color = toHex(game.activePieceColor as Color);

        for (let i = 0; i < groundHintIndexes.length; i++) {
            let x = groundHintIndexes[i] % BOARD_WIDTH;
            let y = Math.floor(groundHintIndexes[i] / BOARD_WIDTH);

            const rectangle = new Graphics();
            rectangle.lineStyle(0, COLOR_WHITE, 0);
            rectangle.beginFill(color, 0.5);
            rectangle.drawRect(0, 0, 25, 25);
            rectangle.endFill();
            rectangle.x = gridX + x * TETRIMINO_WIDTH_PX;
            rectangle.y = gridY + y * TETRIMINO_WIDTH_PX;

            this.groundHintSquares.push(rectangle);
            this.pixi.stage.addChild(rectangle);
        }
    }

    private renderNextPieces(game: GameState): void {
        this.nextPieceSprites.forEach(sprite =>
            this.pixi.stage.removeChild(sprite)
        );
        this.nextPieceSprites = [];

        const nextPieces = game.nextPieces;

        for (let i = 0; i < 3; i++) {
            const sprite = new Sprite(this.textures[`t_${nextPieces[i]}_small.png`]);
            sprite.x = 560;
            sprite.y = 91 + i * 80;

            this.pixi.stage.addChild(sprite);
            this.nextPieceSprites.push(sprite);
        }
    }

    private renderHeldPiece(game: GameState): void {
        const heldPiece = game.heldPiece;

        if (heldPiece === 0) {
            this.heldPieceSprite.visible = false;
        } else {
            this.heldPieceSprite.visible = true;
            this.heldPieceSprite.texture = this.textures[`t_${heldPiece}_small.png`];
        }
    }

    private renderScore(game: GameState): void {
        this.score.text = ("0000000" + game.score).substr(-7);
    }
}
