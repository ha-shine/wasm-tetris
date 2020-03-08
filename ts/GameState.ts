import { Game } from "../pkg/index";
import { memory } from "../pkg/index_bg";
import { BOARD_HEIGHT, BOARD_WIDTH } from "./Constants";

class GameState {
  private game: Game;

  constructor() {
    this.game = Game.new(BOARD_WIDTH, BOARD_HEIGHT);
  }

  // get the indexes of active piece's location on game board
  get activePieceIndexes(): Uint8Array {
    const len = this.game.active_piece_coords_len();
    const ptr = this.game.active_piece_coords();
    return new Uint8Array(memory.buffer, ptr, len);
  }

  get activePieceColor(): number {
    return this.game.active_piece_color();
  }

  get board(): Uint8Array {
    const ptr = this.game.board();
    return new Uint8Array(memory.buffer, ptr, BOARD_WIDTH * BOARD_HEIGHT);
  }

  get groundHintIndexes(): Uint8Array {
    const len = this.game.ground_hint_coords_len();
    const ptr = this.game.ground_hint_coords();
    return new Uint8Array(memory.buffer, ptr, len);
  }

  get nextPieces(): Uint8Array {
    const ptr = this.game.next_pieces();
    return new Uint8Array(memory.buffer, ptr, 3);
  }

  get heldPiece(): number {
    return this.game.get_held();
  }

  get score(): number {
    return this.game.score;
  }

  setupControls(): void {
    window.addEventListener("keydown", event => {
      switch (event.key) {
        case "ArrowLeft":
          this.game.move_left();
          break;
        case "ArrowRight":
          this.game.move_right();
          break;
        case "ArrowDown":
          this.game.move_down();
          break;
        case " ":
          this.game.drop();
          break;
        case "Z":
        case "z":
          this.game.rotate_counter_clockwise();
          break;
        case "X":
        case "x":
          this.game.rotate_clockwise();
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

  tick(elapsedMS: number): void {
    this.game.update(BigInt(Math.floor(elapsedMS * 1000)));
  }
}

export { GameState };
