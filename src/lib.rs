mod utils;

use wasm_bindgen::prelude::*;
use web_sys::console;


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


    // Your code goes here!
    console::log_1(&JsValue::from_str("Hello world!"));

    Ok(())
}

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Color {
    None = 0,
    Cyan = 1,
    Yellow = 2,
    Purple = 3,
    Green = 4,
    Red = 5,
    Blue = 6,
    Orange = 7
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
}

#[wasm_bindgen]
impl Game {

    pub fn new(width: usize, height: usize) -> Game {
        let mut next_pieces = Vec::new();
        let mut generator = SevenGenerator::new();
        next_pieces.push(generator.next().unwrap());
        next_pieces.push(generator.next().unwrap());
        next_pieces.push(generator.next().unwrap());

        Game {
            width,
            height,
            board: vec![Color::None; width*height],
            generator,
            next_pieces
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

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PieceType {
    I = 0,
    O = 1,
    T = 2,
    S = 3,
    Z = 4,
    J = 5,
    L = 6
}