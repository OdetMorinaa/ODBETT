const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Low, JSONFile } = require('lowdb');
const path = require('path');
const { nanoid } = require('nanoid');

// Setup
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// DB setup
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

// Initialize DB if empty
async function initDB() {
  await db.read();
  db.data ||= {
    users: [
      { username: 'Odii01', password: 'Odi049', points: 1000 } // admin
    ],
    games: [],
    bets: []
  };
  await db.write();
}

initDB();

// Auth
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user: { username: user.username, points: user.points } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get games
app.get('/api/games', async (req, res) => {
  await db.read();
  res.json(db.data.games);
});

// Add game (admin only)
app.post('/api/games', async (req, res) => {
  const { title, team1, team2, odds1, odds2 } = req.body;
  const newGame = {
    id: nanoid(),
    title,
    team1,
    team2,
    odds1: parseFloat(odds1),
    odds2: parseFloat(odds2),
    result: null
  };
  db.data.games.push(newGame);
  await db.write();
  res.json({ success: true, game: newGame });
});

// Resolve game (admin only)
app.post('/api/games/resolve', async (req, res) => {
  const { gameId, winner } = req.body;
  await db.read();
  const game = db.data.games.find(g => g.id === gameId);
  if (!game || game.result !== null) {
    return res.status(400).json({ success: false, message: 'Invalid game or already resolved' });
  }

  game.result = winner;
  db.data.bets.forEach(bet => {
    if (bet.gameId === gameId) {
      if (bet.team === winner) {
        const user = db.data.users.find(u => u.username === bet.username);
        if (user) {
          user.points += bet.amount * bet.odds;
        }
        bet.status = 'won';
      } else {
        bet.status = 'lost';
      }
    }
  });
  await db.write();
  res.json({ success: true, game });
});

// Create user (admin only)
app.post('/api/users', async (req, res) => {
  const { username, password } = req.body;
  await db.read();
  if (db.data.users.find(u => u.username === username)) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }
  db.data.users.push({ username, password, points: 0 });
  await db.write();
  res.json({ success: true });
});

// Add points to user (admin only)
app.post('/api/users/addpoints', async (req, res) => {
  const { username, points } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  user.points += parseInt(points);
  await db.write();
  res.json({ success: true, user });
});

// Place a bet
app.post('/api/bet', async (req, res) => {
  const { username, gameId, team, amount, odds } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.username === username);
  if (!user || user.points < amount) {
    return res.status(400).json({ success: false, message: 'Invalid user or insufficient points' });
  }

  // Prevent betting on the same game twice
  const existing = db.data.bets.find(b => b.username === username && b.gameId === gameId);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Already bet on this game' });
  }

  user.points -= amount;
  const newBet = {
    id: nanoid(),
    username,
    gameId,
    team,
    amount,
    odds,
    status: 'pending'
  };
  db.data.bets.push(newBet);
  await db.write();
  res.json({ success: true, bet: newBet });
});

// Get user's bet history
app.get('/api/bets/:username', async (req, res) => {
  const { username } = req.params;
  await db.read();
  const bets = db.data.bets.filter(bet => bet.username === username);
  res.json(bets);
});

// Get all users (admin only)
app.get('/api/users', async (req, res) => {
  await db.read();
  res.json(db.data.users.map(u => ({ username: u.username, points: u.points })));
});

// Server start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
