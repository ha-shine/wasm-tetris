import {Game} from "../pkg/index";
import * as C from "./Constants";
import {memory} from "../pkg/index_bg";

class GameWrapper {
    private game: Game;

    constructor() {
        this.game = Game.new(C.BOARD_WIDTH, C.BOARD_HEIGHT);
    }

    // return the indexes of active piece's location on game board
    get activePieceIndexes(): Uint8Array {
        const ptr = this.game.active_piece_coords();
        return new Uint8Array(memory.buffer, ptr, 4);
    }

    moveLeft(): void {
        this.game.move_left();
    }

    moveRight(): void {
        this.game.move_right();
    }

    moveDown(): void {
        this.game.move_down();
    }

    drop(): void {
        this.game.drop();
    }

    rotateClockwise(): void {
        this.game.rotate_clockwise();
    }

    rotateCounterClockwise(): void {
        this.game.rotate_counter_clockwise();
    }

    hold(): void {
        this.game.hold();
    }
}

export {GameWrapper};