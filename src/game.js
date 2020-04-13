const _ = require('lodash');

const INITIAL_BOARD = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

const DIRECTION = {
  UP: 'w',
  RIGHT: 'd',
  DOWN: 's',
  LEFT: 'a',
};

class Game {
  constructor(game) {
    this.init(game);
  }

  init(game) {
    this.board = game ? _.cloneDeep(game.board) : _.cloneDeep(INITIAL_BOARD);
    this.score = game ? game.score : 0;
    this.turnCount = game ? game.turnCount : 0;
    if (!game) this.newNumber();
  }

  getBoard() {
    return this.board;
  }

  getScore() {
    return this.score;
  }

  getOutput() {
    return {
      board: this.printBoard(),
      score: this.score,
      turnCount: this.turnCount,
    };
  }

  // return board as an array of 4 strings (horizontal lines of the game)
  printBoard() {
    console.log('\n\nTurns ', this.turnCount, ' Score ', this.score);
    const b = this.board.map((x) => x.map((y) => y));
    const lines = [];
    for (let y = 0; y <= 3; y++) {
      let line = '';
      for (let x = 0; x <= 3; x++) {
        const num = `${b[x][y] || '_'}`;
        line += `${Array(5).fill(' ').join('')}${num}${Array(6 - num.length)
          .fill(' ')
          .join('')}`;
      }
      lines.push(line);
      console.log(line);
    }
    return lines;
  }

  getFreeTiles() {
    const tiles = [];
    this.board.forEach((x, ix) =>
      x.forEach((y, iy) => {
        if (y === 0) tiles.push({ x: ix, y: iy });
      })
    );
    return tiles;
  }

  numFreeTiles() {
    return this.getFreeTiles().length;
  }

  someTileIsFree() {
    return this.board.some((x) => x.some((y) => y === 0));
  }

  newNumber(xInput, yInput, valInput) {
    const x = xInput || Math.round(Math.random() * 3);
    const y = yInput || Math.round(Math.random() * 3);
    const value = valInput || 2 + 2 * Math.round(Math.random());
    if (this.board[x][y] === 0) this.board[x][y] = value;
    else if (!xInput) this.newNumber();
  }

  slideBoard(direction, skipNew = false) {
    if (!_.some(DIRECTION, (d) => d === direction)) return;

    // process tiles top left to bottom right
    let xi = 0;
    let dx = 1;
    let yi = 0;
    let dy = 1;

    // bottom right to top left if sliding right or down
    if (direction === DIRECTION.RIGHT || direction === DIRECTION.DOWN) {
      xi = 3;
      dx = -1;
      yi = 3;
      dy = -1;
    }

    let xDir = 0;
    let yDir = 0;

    if (direction === DIRECTION.UP) yDir = -1;
    else if (direction === DIRECTION.DOWN) yDir = 1;
    else if (direction === DIRECTION.LEFT) xDir = -1;
    else if (direction === DIRECTION.RIGHT) xDir = 1;

    // loop through all tiles and slide them
    for (let y = yi; y <= 3 && y >= 0; y += dy) {
      for (let x = xi; x <= 3 && x >= 0; x += dx) {
        let xNext = x + xDir;
        let yNext = y + yDir;

        // skip tile if number is zero or next is off the board
        if (
          this.board[x][y] === 0 ||
          this.board[xNext] == undefined ||
          this.board[xNext][yNext] == undefined
        )
          continue;

        // merge tiles if next is same number, leave zero behind
        if (this.board[x][y] === this.board[xNext][yNext] && this.board[xNext][yNext] > 0) {
          this.board[xNext][yNext] *= -2;
          this.score += -this.board[xNext][yNext];
          this.board[x][y] = 0;
        }

        // move tile if next is zero (up to 3 tiles if all are zero), leave zero behind
        else if (this.board[xNext][yNext] === 0) {
          const move2 = this.board[x + 2 * xDir] && this.board[x + 2 * xDir][y + 2 * yDir];
          if (move2 === 0) {
            xNext += xDir;
            yNext += yDir;

            const move3 = this.board[x + 3 * xDir] && this.board[x + 3 * xDir][y + 3 * yDir];
            if (move3 === 0) {
              xNext += xDir;
              yNext += yDir;
            }
          }

          // merge if next tile is same number after moving to a zero
          if (
            this.board[xNext + xDir] &&
            this.board[xNext + xDir][yNext + yDir] &&
            this.board[xNext + xDir][yNext + yDir] > 0 &&
            this.board[x][y] === this.board[xNext + xDir][yNext + yDir]
          ) {
            this.board[xNext + xDir][yNext + yDir] *= -2;
            this.score += -this.board[xNext + xDir][yNext + yDir];
            this.board[xNext][yNext] = 0;
          }

          // otherwise just move
          else {
            this.board[xNext][yNext] = this.board[x][y];
          }

          // leave zero behind
          this.board[x][y] = 0;
        }

        // blocked - next tile is a different number
        else {
          // do nothing?
        }
      }
    }

    // if there is at least 1 free tile, add a new number to a random one
    if (this.someTileIsFree() && !skipNew) this.newNumber();
    this.turnCount++;

    // reset merged status (negative values) on all tiles
    this.board = this.board.map((x) => x.map((y) => Math.abs(y)));
  }
}

module.exports = { Game, DIRECTION };
