use std::time::Duration;

use wasm_bindgen::prelude::*;

pub use tetrimino::*;
use std::collections::HashSet;

mod utils;
pub mod tetrimino;

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

enum State {
    Playing,
    Lost,
}

#[derive(Hash, Eq, PartialEq, Debug, Clone, Copy)]
enum Rotation {
    Clockwise,
    CounterClockwise,
}

#[derive(Hash, Eq, PartialEq, Debug, Clone, Copy)]
enum Event {
    MoveLeft,
    MoveRight,
    MoveDown,
    Rotate(Rotation),
    Drop,
    Hold,
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

    // type of tetrimino currently being held, it can be empty
    // can_hold flag to indicate whether the player can hold the active piece
    // when a piece is held, it can be exchanged only on when the active piece change
    held_type: Option<PieceType>,
    can_hold: bool,

    state: State,

    // elapsed time since the last update
    elapsed: Duration,

    // fall rate defines how fast a piece fall
    // if time delta greater than this is elapsed, I move one piece down by one unit
    fall_rate: Duration,

    // indexes of lines which can be cleared/erased
    clearable_lines: Vec<u8>,

    // vector to hold pairs of x,y coordinates in the form of index
    // for current active piece's individual squares
    // have to do this way because there is no other good way to pass a vector
    // without incurring performance cost for serializing into js
    active_piece_indexes: Vec<u8>,

    // Set to hold all the user events for this update
    // Set because I only want to process one event of each
    events: HashSet<Event>,
}

#[wasm_bindgen]
impl Game {
    pub fn new(width: usize, height: usize) -> Game {
        let mut generator = SevenGenerator::new();
        let mut next_pieces = Vec::new();
        next_pieces.push(generator.next().unwrap());
        next_pieces.push(generator.next().unwrap());
        next_pieces.push(generator.next().unwrap());

        let active_piece = Self::initialize_tetrimino(generator.next().unwrap());

        let mut game = Game {
            width,
            height,
            board: vec![Color::None; width * height],
            generator,
            next_pieces,
            active_piece,
            held_type: None,
            can_hold: true,
            state: State::Playing,
            elapsed: Duration::from_micros(0),
            fall_rate: Duration::from_millis(500), // TODO: this should update
            clearable_lines: Vec::new(),
            active_piece_indexes: Vec::new(),
            events: HashSet::new(),
        };
        game.update_active_piece_coords();

        game
    }

    pub fn board(&self) -> *const Color {
        self.board.as_ptr()
    }

    pub fn next_pieces(&self) -> *const PieceType {
        self.next_pieces.as_ptr()
    }

    pub fn active_piece_coords(&self) -> *const u8 {
        self.active_piece_indexes.as_ptr()
    }

    pub fn active_piece_color(&self) -> Color {
        self.active_piece.piece.color()
    }

    pub fn update(&mut self, elapsed: u64) {
        let elapsed = Duration::from_micros(elapsed);
        self.elapsed += elapsed;

        // delta movement across x and y axis, must process these movements separately
        // limit these movement to 1 on each tick because I want smooth movement animation
        let mut delta_x = 0;
        let mut delta_y = 0;

        let mut rotation = None;

        if self.elapsed >= self.fall_rate {
            delta_y = 1;
            self.elapsed -= self.fall_rate;
        }

        for event in &self.events {
            match event {
                // These movement change delta value independently
                Event::MoveLeft => delta_x -= 1,
                Event::MoveRight => delta_x += 1,

                // only update if it's 0
                Event::MoveDown => if delta_y == 0 {
                    delta_y = 1
                },
                Event::Drop => delta_y = self.height,

                Event::Rotate(rot) => rotation = Some(*rot),
                Event::Hold => (),
            }
        }
        self.events.clear();

        if let Some(rot) = rotation {
            let new_piece = match rot {
                Rotation::Clockwise => self.active_piece.piece.rotate_clockwise(),
                Rotation::CounterClockwise => self.active_piece.piece.rotate_counter_clockwise()
            };
            let block = new_piece.block();

            if self.can_fit_block(block, self.active_piece.x, self.active_piece.y) {
                self.active_piece.piece = new_piece;
            }
        }

        let block = self.active_piece.piece.block();

        if delta_x != 0 && self.can_fit_block(block, self.active_piece.x + delta_x, self.active_piece.y) {
            self.active_piece.x += delta_x;
        }

        if delta_y > 1 {
            // the player dropped the active piece, move the active piece until it hit the ground
            for _ in 0..delta_y {
                if self.can_fit_block(block, self.active_piece.x, self.active_piece.y + 1) {
                    self.active_piece.y += 1;
                }
            }
            self.try_fuse_active_piece();
        } else if delta_y == 1 {
            // fusing and dropping are considered two separate fall events
            // to allow player to move the pieces into the gaps in the middle of the board
            // if the block can drop one more line it must mean the piece wasn't touching the ground
            // else the piece is touching the ground on the previous tick, and we merge it now
            if self.can_fit_block(block, self.active_piece.x, self.active_piece.y + 1) {
                self.active_piece.y += 1;
            } else {
                self.try_fuse_active_piece();
            }
        }

        self.update_active_piece_coords();
    }

    pub fn move_left(&mut self) {
        self.events.insert(Event::MoveLeft);
    }

    pub fn move_right(&mut self) {
        self.events.insert(Event::MoveRight);
    }

    pub fn move_down(&mut self) {
        self.events.insert(Event::MoveDown);
    }

    pub fn rotate_clockwise(&mut self) {
        self.events.insert(Event::Rotate(Rotation::Clockwise));
    }

    pub fn rotate_counter_clockwise(&mut self) {
        self.events.insert(Event::Rotate(Rotation::CounterClockwise));
    }

    pub fn drop(&mut self) {
        self.events.insert(Event::Drop);
    }

    pub fn hold(&mut self) {
        self.events.insert(Event::Hold);
    }
}

impl Game {
    fn get_index(&self, row: usize, col: usize) -> usize {
        (row * self.width) + col
    }

    fn update_active_piece_coords(&mut self) {
        self.active_piece_indexes.clear();

        let block = self.active_piece.piece.block();
        let piece_x = self.active_piece.x;
        let piece_y = self.active_piece.y;

        for y in 0..4 {
            for x in 0..4 {
                if block[y * 4 + x] == 1 {
                    let x = piece_x + x as isize;
                    let y = piece_y + y as isize;
                    let idx = self.get_index(y as usize, x as usize);
                    self.active_piece_indexes.push(idx as u8);
                }
            }
        }
    }

    // try fusing current active piece with the ground
    // return true if the active piece has successfully fused with the ground
    fn try_fuse_active_piece(&mut self) {
        let block = self.active_piece.piece.block();

        if !self.can_fuse_active_piece(block) {
            return;
        }

        self.fuse_active_piece(block);
        self.active_piece = Self::initialize_tetrimino(self.next_pieces[0]);
        self.next_pieces[0] = self.next_pieces[1];
        self.next_pieces[1] = self.next_pieces[2];
        self.next_pieces[2] = self.generator.next().unwrap();
    }

    fn can_fuse_active_piece(&self, block: &'static Block) -> bool {
        let piece_x = self.active_piece.x;
        let piece_y = self.active_piece.y;

        for y in 0..4 {
            for x in 0..4 {
                if block[y * 4 + x] == 1 {
                    // check the next row, current col if there's any occupied piece
                    let check_y = piece_y + y as isize; // coord y on the board
                    let check_x = piece_x + x as isize; // coord x

                    // is the current piece on the last row of the board?
                    if check_y == self.height as isize - 1 {
                        return true;
                    }

                    // is the next row not empty?
                    let idx = self.get_index(check_y as usize + 1, check_x as usize);
                    if *self.board.get(idx).unwrap() != Color::None {
                        return true;
                    }
                }
            }
        }

        false
    }

    fn fuse_active_piece(&mut self, block: &'static Block) {
        let color = self.active_piece.piece.color();
        let piece_x = self.active_piece.x;
        let piece_y = self.active_piece.y;

        for y in 0..4 {
            for x in 0..4 {
                if block[y * 4 + x] == 1 {
                    let x = piece_x + x as isize;
                    let y = piece_y + y as isize;
                    let idx = self.get_index(y as usize, x as usize);
                    self.board[idx] = color;
                }
            }
        }
    }

    fn can_fit_block(&self, block: &'static Block, x: isize, y: isize) -> bool {
        for block_y in 0..4 {
            for block_x in 0..4 {
                if block[block_y * 4 + block_x] == 1 {
                    let board_x = x + block_x as isize;
                    let board_y = y + block_y as isize;

                    if board_x < 0
                        || board_y < 0
                        || board_x == self.width as isize
                        || board_y == self.height as isize {
                        return false;
                    }

                    let idx = self.get_index(board_y as usize, board_x as usize);
                    if self.board[idx] != Color::None {
                        return false;
                    }
                }
            }
        }

        true
    }

    // apply displacements to move the next active tetrimino into the center of board
    fn initialize_tetrimino(ttype: PieceType) -> ActivePiece {
        let (x, y) = match ttype {
            PieceType::T => (3, -1),
            PieceType::J => (4, 0),
            _ => (3, 0)
        };

        let current_tetrimino = ActivePiece {
            piece: Tetrimino::from(ttype),
            x,
            y,
        };

        current_tetrimino
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