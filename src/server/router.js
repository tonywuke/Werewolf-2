import express from 'express';

import game from './controllers/game';
import games from './controllers/games';
import session from './controllers/session';

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('main-app', { title: 'Express' });
});

/****** login ******/
router.get('/login', (req, res) => res.render('login'));
router.post('/login', session.login);
router.post('/logout', session.logout);

//router.put('/api/game/vote/:gameId', game);

/****** games *******/
router.post('/games/create', games.createGame);

export default router;
