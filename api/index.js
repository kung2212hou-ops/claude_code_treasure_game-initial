const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = 'treasure-game-secret-key';

app.use(cors());
app.use(express.json());

// In-memory store (resets on cold start — acceptable for Vercel serverless)
const users = new Map();
let nextUserId = 1;
const scores = new Map();

const createUser = (username, password) => {
  const id = nextUserId++;
  users.set(username, { id, username, password });
  return { id, username };
};

const findUserByUsername = (username) => users.get(username);

const saveScore = (userId, score) => {
  const entry = { score, created_at: new Date().toISOString() };
  if (!scores.has(userId)) scores.set(userId, []);
  scores.get(userId).unshift(entry);
  return entry;
};

const getScoresByUserId = (userId) =>
  (scores.get(userId) || []).slice(0, 10);

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/api/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password) return res.status(400).json({ error: 'Username and password required' });
  if (findUserByUsername(username.trim())) return res.status(409).json({ error: 'Username already taken' });
  const hash = await bcrypt.hash(password, 10);
  const user = createUser(username.trim(), hash);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username } });
});

app.post('/api/auth/signin', async (req, res) => {
  const { username, password } = req.body;
  const user = findUserByUsername(username?.trim());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username } });
});

app.post('/api/scores', authenticate, (req, res) => {
  const { score } = req.body;
  if (typeof score !== 'number') return res.status(400).json({ error: 'Score must be a number' });
  res.json(saveScore(req.user.id, score));
});

app.get('/api/scores/me', authenticate, (req, res) => {
  res.json(getScoresByUserId(req.user.id));
});

module.exports = app;
