const express = require('express');

const { Game } = require('./game');
const { chooseDirection } = require('./chooser');

const app = express();
const port = 31113;

const game = new Game();

app.get('/', (req, res) => res.status(200).json(game.getOutput()));

app.get('/init', (req, res) => {
  game.init();
  return res.status(201).json(game.getOutput());
});

app.get('/choose', (req, res) => {
  const direction = chooseDirection(game);
  game.slideBoard(direction);
  return res.status(201).json(game.getOutput());
});

app.get('/simulate', (req, res) => {
  game.init();
  while (game.someTileIsFree()) {
    const direction = chooseDirection(game);
    game.slideBoard(direction);
  }
  return res.status(200).json(game.getOutput());
});

app.get('/simulate/:n', (req, res) => {
  const results = [];
  for (let i = 0; i < req.params.n || 0; i++) {
    game.init();
    while (game.someTileIsFree()) {
      const direction = chooseDirection(game);
      game.slideBoard(direction);
      console.log('Game ', i, ' score: ', game.getScore());
    }
    results.push(game.getScore());
  }
  const average = results.length ? results.reduce((a, b) => a + b, 0) / results.length : 0;
  return res.status(200).json({ results, average });
});

app.get('/:direction', (req, res) => {
  if (req.params.direction) {
    game.slideBoard(req.params.direction);
    return res.status(201).json(game.getOutput());
  }
  return res.status(400).json(game.getOutput());
});

app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
