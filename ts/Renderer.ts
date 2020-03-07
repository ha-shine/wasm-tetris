import {Application} from "pixi.js";
import {GameWrapper} from "./GameWrapper";

export class Renderer {
    private pixi: Application;
    private game: GameWrapper;

    constructor(app: Application, state: GameWrapper) {
        this.pixi = app;
        this.game = state;
    }

    setup(): void {
        this.setupControls();
    }

    setupControls(): void {
        window.addEventListener("keydown", (event) => {
            switch (event.key) {

                case "ArrowLeft":
                    this.game.moveLeft();
                    break;
                case "ArrowRight":
                    this.game.moveRight();
                    break;
                case "ArrowDown":
                    this.game.moveDown();
                    break;
                case " ":
                    this.game.drop();
                    break;
                case "Z":
                case "z":
                    this.game.rotateCounterClockwise();
                    break;
                case "X":
                case "x":
                    this.game.rotateClockwise();
                    break;
                case "C":
                case "c":
                    this.game.hold();
                    break;

                default:
                    return;
            }

            event.preventDefault();
        });
    }
}