const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'game.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const createUser = (username, password) => {
  const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, password);
  return { id: Number(result.lastInsertRowid), username };
};

const findUserByUsername = (username) =>
  db.prepare('SELECT * FROM users WHERE username = ?').get(username);

const saveScore = (userId, score) => {
  const result = db.prepare('INSERT INTO scores (user_id, score) VALUES (?, ?)').run(userId, score);
  return { id: Number(result.lastInsertRowid), user_id: userId, score };
};

const getScoresByUserId = (userId) =>
  db.prepare('SELECT score, created_at FROM scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(userId);

module.exports = { createUser, findUserByUsername, saveScore, getScoresByUserId };
