mod utils;
pub mod tetrimino;

use wasm_bindgen::prelude::*;

pub use tetrimino::*;


// When the `wee_alloc` feature is enabled, this uses `wee_alloc` as the global
// allocator.
//
// If you don't want to use `wee_alloc`, you can safely delete this.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;


// This is like the `main` function, except for JavaScript.
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    // This provides better error messages in debug mode.
    // It's disabled in release mode so it doesn't bloat up the file size.
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();

    Ok(())
}

struct ActivePiece {
    piece: Tetrimino,
    x: isize,
    y: isize,
}

#[wasm_bindgen]
pub struct Game {
    width: usize,
    height: usize,
    board: Vec<Color>,

    // generator to generate next pieces randomly,
    // next_pieces will always contain three pieces according to the ui
    generator: SevenGenerator,
    next_pieces: Vec<PieceType>,

    // current playing piece and it's x, y coordinate
    // x, y coordinate is isize because the pieces can go out of bound
    active_piece: ActivePiece,
}

#[wasm_bindgen]
impl Game {

    pub fn new(width: usize, height: usize) -> Game {
        let mut generator = SevenGenerator::new();
        let mut next_pieces = Vec::new();
        next_pieces.push(generator.next().unwrap());
        next_pieces.push(generator.next().unwrap());
        next_pieces.push(generator.next().unwrap());

        let active_piece = ActivePiece {
            piece: Tetrimino::from(generator.next().unwrap()),
            x: 0,
            y: 0,
        };

        Game {
            width,
            height,
            board: vec![Color::None; width*height],
            generator,
            next_pieces,
            active_piece
        }
    }

    pub fn board(&self) -> *const Color {
        self.board.as_ptr()
    }

    pub fn next_pieces(&self) -> *const PieceType {
        self.next_pieces.as_ptr()
    }

}

impl Game {
    fn get_index(&self, row: usize, col: usize) -> usize {
        (row * self.width) + col
    }
}


// Random generator to generate permutation of 7 pieces of tetriminos
// according to the guideline here:
// https://tetris.fandom.com/wiki/Random_Generator
struct SevenGenerator {
    shuffled: [PieceType; 7],
    index: usize,
}

impl SevenGenerator {

    fn new() -> SevenGenerator {
        use PieceType::*;

        let mut shuffled = [I, O, T, S, Z, J, L];
        utils::shuffle(&mut shuffled);

        SevenGenerator {
            shuffled,
            index: 0,
        }
    }

}

impl Iterator for SevenGenerator {
    type Item = PieceType;

    fn next(&mut self) -> Option<Self::Item> {
        if self.index == 7 {
            use PieceType::*;

            let mut shuffled = [I, O, T, S, Z, J, L];
            utils::shuffle(&mut shuffled);

            self.shuffled = shuffled;
            self.index = 0;
        }

        let result = self.shuffled[self.index];
        self.index += 1;
        Some(result)
    }
}