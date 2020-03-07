// HTML canvas dimension in pixels
const [CANVAS_WIDTH, CANVAS_HEIGHT] = [800, 600];

// Game board dimensions in number of tetriminos
const [BOARD_WIDTH, BOARD_HEIGHT] = [10, 20];

// Width of a tetrimino in pixels
const TETRIMINO_WIDTH = 25;

// Hex values of tetriminos
const COLOR_WHITE = 0xFFFFFF;
const COLOR_GREYFG = 0xEEEEEE;
const COLOR_MAINBG = 0x1B262C;
const COLOR_CYAN = 0x47C7EE;
const COLOR_YELLOW = 0xFFCC00;
const COLOR_PURPLE = 0x6D59EF;
const COLOR_GREEN = 0xB0CC13;
const COLOR_RED = 0xFF1149;
const COLOR_BLUE = 0x3C9EE3;
const COLOR_ORANGE = 0xFF6536;

enum Color {
    None = 0,
    Cyan = 1,
    Yellow = 2,
    Purple = 3,
    Green = 4,
    Red = 5,
    Blue = 6,
    Orange = 7
}

function toHex(color: Color): number {
    switch (color) {
        case Color.None:
            return COLOR_MAINBG;
        case Color.Cyan:
            return COLOR_CYAN;
        case Color.Yellow:
            return COLOR_YELLOW;
        case Color.Purple:
            return COLOR_PURPLE;
        case Color.Green:
            return COLOR_GREEN;
        case Color.Red:
            return COLOR_RED;
        case Color.Blue:
            return COLOR_BLUE;
        case Color.Orange:
            return COLOR_ORANGE;
    }
}

export {
    CANVAS_WIDTH, CANVAS_HEIGHT,
    BOARD_WIDTH, BOARD_HEIGHT,
    TETRIMINO_WIDTH,
    Color, toHex
};