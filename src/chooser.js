const _ = require('lodash');

const { Game, DIRECTION } = require('./game');

const TURN_LOOKAHEAD = 4;
const FUTURES_PER_MOVE = 2;
const SCORE_MOD = 1;
const FREE_TILES_MOD = 1;
const ORDEREDNESS_MOD = 100;
const SAMENESS_MOD = 10;

const getOrderedness = (game) => {
  const b = game.board;
  if (!b) return 0;

  let result = 0;
  for (let y = 0; y <= 3; y++) {
    let row = 0;
    for (let x = 1; x <= 3; x++) {
      if (b[x][y] > b[x - 1][y]) row++;
      if (b[x][y] < b[x - 1][y]) row--;
    }
    result += row * row;
  }
  for (let x = 0; x <= 3; x++) {
    let col = 0;
    for (let y = 1; y <= 3; y++) {
      if (b[x][y] > b[x][y - 1]) col++;
      if (b[x][y] < b[x][y - 1]) col--;
    }
    result += col * col;
  }
  return result;
};

const getSameness = (game) => {
  const b = game.board;
  if (!b) return 0;

  let result = 0;
  for (let y = 0; y <= 3; y++) {
    let row = 0;
    for (let x = 1; x <= 3; x++) {
      if (b[x][y] === b[x - 1][y]) row++;
    }
    result += row;
  }
  for (let x = 0; x <= 3; x++) {
    let col = 0;
    for (let y = 1; y <= 3; y++) {
      if (b[x][y] === b[x][y - 1]) col++;
    }
    result += col;
  }
  return result;
};

const getFitness = (game) =>
  SCORE_MOD * game.score +
  FREE_TILES_MOD * game.numFreeTiles +
  ORDEREDNESS_MOD * getOrderedness(game) +
  SAMENESS_MOD * getSameness(game);

const sortByFitness = (games) => games.sort((a, b) => getFitness(b) - getFitness(a));

const getNextGames = ({ game, directions }) =>
  _.map(DIRECTION, (direction) => {
    const nextGame = new Game(game);
    nextGame.slideBoard(direction);
    return {
      game: nextGame,
      directions: [...(directions || []), direction],
    };
  });

const generateFutures = (gameObj, depth = 1) => {
  const games = [];
  for (let i = 0; i < FUTURES_PER_MOVE; i++) {
    const nextGames = getNextGames(gameObj);
    games.push(...nextGames);
  }
  if (depth < TURN_LOOKAHEAD) {
    const nextGames = [];
    games.forEach((g) => nextGames.push(...generateFutures(g, depth + 1)));
    return nextGames;
  }
  return games;
};

const sum = (games, field) => games.reduce((a, b) => a + b[field], 0);
// const max = (games, field) => games.reduce((a, b) => (b[field] > a ? b[field] : a), 0);
// const median = (array, field) => {
//   array.sort(function (a, b) {
//     return a[field] - b[field];
//   });
//   var mid = array.length / 2;
//   return mid % 1 ? array[mid - 0.5][field] : (array[mid - 1][field] + array[mid][field]) / 2;
// };

const chooseBestDirection = (games) => {
  const directions = _.map(DIRECTION, (direction) => {
    const dirGames = games.filter((game) => game.directions[0] === direction);
    const score = sum(dirGames, 'score');
    const numFreeTiles = sum(dirGames, 'numFreeTiles');
    return { direction, score, numFreeTiles };
  });
  return sortByFitness(directions)[0].direction;
};

module.exports.chooseDirection = (game) => {
  const games = generateFutures({ game });
  const results = sortByFitness(
    games.map((gameObj) => ({
      directions: gameObj.directions,
      board: gameObj.game.getBoard(),
      score: gameObj.game.getScore(),
      numFreeTiles: gameObj.game.numFreeTiles(),
    }))
  );
  return chooseBestDirection(results);
};
