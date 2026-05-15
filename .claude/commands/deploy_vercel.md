Deploy this project to Vercel and return the live URL. Follow these steps in order:

## Step 1 — Check Vercel CLI

Run `vercel --version`. If the command fails, install it:
```
npm install -g vercel
```

## Step 2 — Verify login

Run `vercel whoami`. If not logged in, run `vercel login` and wait for the user to authenticate.

## Step 3 — Create vercel.json

Check if `vercel.json` exists. If not, create it at the project root:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" }
  ]
}
```

## Step 4 — Add Node.js version to package.json

Vercel needs Node 22 for `node:sqlite`. Add `"engines": { "node": "22.x" }` to `package.json` if it's not already there.

## Step 5 — Create Vercel API serverless function

Create `api/index.js`. This wraps the Express app for Vercel serverless. The key difference from `server/index.js`: replace the SQLite database with in-memory Maps (Vercel's filesystem is ephemeral — data resets on cold start, which is acceptable for this game demo).

Create `api/index.js` with this content:

```js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = 'treasure-game-secret-key';

app.use(cors());
app.use(express.json());

// In-memory store (resets on cold start — acceptable for Vercel serverless)
const users = new Map(); // username -> { id, username, password }
let nextUserId = 1;
const scores = new Map(); // userId -> [{ score, created_at }]

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
```

## Step 6 — Check frontend API base URL

Open `src/App.tsx` and look for all `fetch('/api/...')` calls. On Vercel, the frontend and backend are on the same domain, so relative paths like `/api/...` will work correctly. No changes needed unless you find absolute URLs pointing to `localhost:3001`.

If you find any `localhost:3001` references, replace them with relative `/api/...` paths.

## Step 7 — Deploy

Run:
```
vercel --prod
```

Answer the prompts:
- Set up and deploy: Y
- Which scope: pick the user's account
- Link to existing project: N (first deploy)
- Project name: press Enter to accept default
- In which directory is your code?: press Enter (current directory)

## Step 8 — Return the URL

After deployment succeeds, Vercel prints a production URL like `https://your-project.vercel.app`. 

Output this URL clearly to the user so they can open it in their browser.

Also remind the user: **scores and accounts reset on cold start** because Vercel serverless functions are stateless. If they want persistent data, they should connect a database like Vercel Postgres or Turso later.
