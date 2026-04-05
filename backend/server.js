const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory mock database for local testing
const scores = [];

app.post('/score', (req, res) => {
  const { username, score } = req.body;
  if (!username || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  
  const entry = { id: Date.now().toString(), username, score, timestamp: new Date().toISOString() };
  scores.push(entry);
  
  // Sort descending and keep top 100 locally
  scores.sort((a, b) => b.score - a.score);
  if (scores.length > 100) scores.length = 100;
  
  console.log(`[POST /score] Received: ${username} - ${score}`);
  res.status(201).json({ message: 'Success', entry });
});

app.get('/leaderboard', (req, res) => {
  // Return top 10
  console.log(`[GET /leaderboard] Returning ${Math.min(scores.length, 10)} scores.`);
  res.json(scores.slice(0, 10));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`🎲 2048 Local Backend Server is running!`);
  console.log(`🌍 API URL: http://localhost:${PORT}`);
  console.log(`==========================================`);
});
