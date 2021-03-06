import activity from './activity';
import socket from '../socket';
import db from '../db';

import gamesController from './games';

function getUserGameHelper(userId) {
  return db.select(
    'g.id',
    'gu.user_id as userId',
    'u.username as userName',
    'gu.index',
    'gu.role',
    'gu.alive',
    'gu.result'
  )
  .from('game_user as gu')
  .leftJoin('games as g', 'gu.game_id', 'g.id')
  .leftJoin('users as u', 'gu.user_id', 'u.id')
  .where('gu.user_id', userId)
  .where('g.status', 1)
  .then((rows) => {
    const game = {
      id: null,
      users: rows.map((row) => ({
        id: row.userId,
        index: row.index,
        role: row.role,
        alive: row.alive,
        result: row.result,
      })),
    };
    if (rows.length) {
      game.id = rows[0].gameId;
    }
    return game;
  });
}

/*function formatGame(game) {
  
  const game = {
        id: null,
        alive: {
          1: [],
          2: [],
          3: [],
          4: [],
        },
        dead: {
          1: [],
          2: [],
          3: [],
          4: [],
        },
      };
}*/

function isDayCome(req) {
  const gameId = req.user.game.id;
  return db.select()
    .from('activities')
    .where('game_id', gameId)
    .whereIn('type', [2, 3, 4, 5])
    .then((rows) => {
      if (rows.length !== 4) {
        return false;
      }
      let isEnd;
      return gamesController.isEnd(gameId)
        .then((_isEnd) => {
          isEnd = _isEnd;
          return gamesController.getDeadUserIds(gameId);
        })
        .then((_rows) => {
          socket.emit(
            'game',
            {
              type: 5,
              isEnd,
              userIds: _rows,
            }
          );
        });
    });
}

function vote(req, res) {
  const gameActivityId = req.params.gameActivityId;
  const { userId, type } = req.body;
  const voteUserId = req.user.id;
  let content;
  return activity.getActivityAndJSONContent(gameActivityId)
    .then((rows) => {
      if (!rows.length) {
        const err = new Error('投票失败');
        err.status = 403;
        throw err;
      }
      content = rows[0].content.push({ voteUserId, userId, voteTime: new Date() });
      return activity.updateActivityAndStringifyContent(gameActivityId, { content });
    })
    .then(() => {
      // wolf vote for killing
      if (type === 1) {
        socket.emit(
          'game',
          {
            type: 3,
            voteUserId: req.user.id,
            userId,
          },
          req.game.users.filter((user) => (user.id !== req.user.id) && (user.role === 2))
        );
        if (content.length === 2) {
          socket.emit(
            'game',
            {
              type: 4,
              userId,
            },
            req.games.users.map((user) => user.id)
          );
        }
      } else if (type === 2 && content.length >= 5) {
        socket.emit(
          'game',
          {
            type: 8,
            voted: content,
          }
        );
      }
      res.status(200).send();
    });
}

function check(req, res) {
  const userId = req.body.userId;
  const gameId = req.user.game.id;
  return activity.createActivityAndStringifyContent({
    gameId,
    type: 5,
    content: {
      userId,
    },
    startAt: new Date(),
  })
  //.then(())
  .then(() => isDayCome(req));
  //.then((boolean) => );
}

function save(req, res) {
  const userId = req.body.userId;
  const gameId = req.user.game.id;
  return activity.createActivityAndStringifyContent({
    gameId,
    type: 3,
    content: {
      userId,
    },
    startAt: new Date(),
  });
}

function kill(req, res) {
  const userId = req.body.userId;
  const gameId = req.user.game.id;
  return activity.createActivityAndStringifyContent({
    gameId,
    type: 4,
    content: {
      userId,
    },
    startAt: new Date(),
  })
  .then(() => isDayCome(gameId))
  .then((boolean) => boolean);
}

function speak(req, res) {
  const gameId = req.user.game.id;
  const userId = req.user.id;
  return activity.createActivityAndStringifyContent(
    {
      gameId,
      type: 6,
      content: {
        userId,
      },
      startAt: new Date(),
    }
  )
  .then((insertIds) => res.status(200).json({ gameActivityId: insertIds[0] }));
}

function speakDone(req, res) {
  const gameActivityId = req.params.gameActivityId;
  return activity.updateActivityAndStringifyContent(gameActivityId, { endAt: new Date() });
    //.then(() => );
}

export default {
  getUserGameHelper,
};
