use wasm_bindgen::prelude::*;

pub type Block = [u8; 16];

const BLOCK_I: [Block; 4] = [
    [
        0, 0, 1, 0,
        0, 0, 1, 0,
        0, 0, 1, 0,
        0, 0, 1, 0,
    ],
    [
        0, 0, 0, 0,
        0, 0, 0, 0,
        1, 1, 1, 1,
        0, 0, 0, 0,
    ],
    [
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 0, 0,
    ],
    [
        0, 0, 0, 0,
        1, 1, 1, 1,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ],
];

const BLOCK_O: Block = [
    0, 1, 1, 0,
    0, 1, 1, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
];

const BLOCK_T: [Block; 4] = [
    [
        0, 0, 0, 0,
        1, 1, 1, 0,
        0, 1, 0, 0,
        0, 0, 0, 0,
    ],
    [
        0, 1, 0, 0,
        1, 1, 0, 0,
        0, 1, 0, 0,
        0, 0, 0, 0,
    ],
    [
        0, 1, 0, 0,
        1, 1, 1, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ],
    [
        0, 1, 0, 0,
        0, 1, 1, 0,
        0, 1, 0, 0,
        0, 0, 0, 0,
    ],
];

const BLOCK_S: [Block; 4] = [
    [
        0, 1, 1, 0,
        1, 1, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ],
    [
        0, 1, 0, 0,
        0, 1, 1, 0,
        0, 0, 1, 0,
        0, 0, 0, 0,
    ],
    [
        0, 0, 0, 0,
        0, 1, 1, 0,
        1, 1, 0, 0,
        0, 0, 0, 0,
    ],
    [
        1, 0, 0, 0,
        1, 1, 0, 0,
        0, 1, 0, 0,
        0, 0, 0, 0,
    ]
];

const BLOCK_Z: [Block; 4] = [
    [
        1, 1, 0, 0,
        0, 1, 1, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ],
    [
        0, 0, 1, 0,
        0, 1, 1, 0,
        0, 1, 0, 0,
        0, 0, 0, 0,
    ],
    [
        0, 0, 0, 0,
        1, 1, 0, 0,
        0, 1, 1, 0,
        0, 0, 0, 0,
    ],
    [
        0, 1, 0, 0,
        1, 1, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
    ]
];

const BLOCK_J: [Block; 4] = [
    [
        0, 1, 0, 0,
        0, 1, 0, 0,
        1, 1, 0, 0,
        0, 0, 0, 0,
    ],
    [
        1, 0, 0, 0,
        1, 1, 1, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ],
    [
        0, 1, 1, 0,
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 0, 0, 0,
    ],
    [
        0, 0, 0, 0,
        1, 1, 1, 0,
        0, 0, 1, 0,
        0, 0, 0, 0,
    ],
];

const BLOCK_L: [Block; 4] = [
    [
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 1, 0,
        0, 0, 0, 0,
    ],
    [
        1, 1, 1, 0,
        1, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ],
    [
        1, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 0, 0, 0,
    ],
    [
        0, 0, 1, 0,
        1, 1, 1, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ],
];

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

pub struct Tetrimino {
    ttype: PieceType,
    state: usize,
}

impl Tetrimino {

    pub fn from(ttype: PieceType) -> Self {
        Tetrimino { ttype, state: 0 }
    }

    pub fn color(&self) -> Color {
        Self::color_of(self.ttype)
    }

    pub fn color_of(ttype: PieceType) -> Color {
        match ttype {
            PieceType::I => Color::Cyan,
            PieceType::O => Color::Yellow,
            PieceType::T => Color::Purple,
            PieceType::S => Color::Green,
            PieceType::Z => Color::Red,
            PieceType::J => Color::Blue,
            PieceType::L => Color::Orange,
        }
    }

    pub fn block(&self) -> &'static Block {
        Self::block_of(self.ttype, self.state)
    }

    pub fn block_of(ttype: PieceType, state: usize) -> &'static Block {
        match ttype {
            PieceType::I => BLOCK_I.get(state).unwrap(),
            PieceType::O => &BLOCK_O,
            PieceType::T => BLOCK_T.get(state).unwrap(),
            PieceType::S => BLOCK_S.get(state).unwrap(),
            PieceType::Z => BLOCK_Z.get(state).unwrap(),
            PieceType::J => BLOCK_J.get(state).unwrap(),
            PieceType::L => BLOCK_L.get(state).unwrap(),
        }
    }

    pub fn rotate_clockwise(&self) -> Tetrimino {
        Tetrimino {
            ttype: self.ttype,
            state: match self.state {
                0 => 3,
                _ => self.state - 1
            },
        }
    }

    pub fn rotate_counter_clockwise(&self) -> Tetrimino {
        Tetrimino {
            ttype: self.ttype,
            state: match self.state {
                3 => 0,
                _ => self.state + 1
            },
        }
    }

}