// --- CONFIGURATION ---
// Change this to your AWS API Gateway URL when deploying to the cloud
const API_URL = 'http://localhost:3000';

// --- GAME LOGIC ---
const SIZE = 4;
let grid = [];
let score = 0;
let bestScore = localStorage.getItem('2048_best') || 0;
let isGameOver = false;

// DOM Elements
const tileContainer = document.getElementById('tile-container');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const gameOverOverlay = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const tryAgainBtn = document.getElementById('try-again-btn');

const submitScoreBtn = document.getElementById('submit-score-btn');
const playerNameInput = document.getElementById('player-name');
const submitMsg = document.getElementById('submit-msg');
const submitLoading = document.getElementById('submit-loading');

const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardLoading = document.getElementById('leaderboard-loading');
const refreshLbBtn = document.getElementById('refresh-lb-btn');

// --- INITIALIZATION ---
function init() {
  grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
  score = 0;
  isGameOver = false;
  gameOverOverlay.classList.add('hidden');
  submitMsg.innerText = '';
  playerNameInput.value = '';
  
  updateScore();
  bestScoreEl.innerText = bestScore;
  tileContainer.innerHTML = '';
  
  addRandomTile();
  addRandomTile();
  renderGrid();
  fetchLeaderboard();
}

function updateScore() {
  scoreEl.innerText = score;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('2048_best', bestScore);
    bestScoreEl.innerText = bestScore;
  }
}

// --- GRID OPERATIONS ---
function getEmptyCells() {
  const cells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) cells.push({r, c});
    }
  }
  return cells;
}

function addRandomTile() {
  const emptyCells = getEmptyCells();
  if (emptyCells.length === 0) return;
  const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  
  // Directly append this tile so we can animate it
  renderTile(r, c, grid[r][c], true);
}

function renderGrid() {
  tileContainer.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] !== 0) {
        renderTile(r, c, grid[r][c]);
      }
    }
  }
}

function renderTile(r, c, value, isNew = false) {
  const tile = document.createElement('div');
  let colorClass = value <= 2048 ? `tile-${value}` : 'tile-super';
  tile.className = `tile ${colorClass} ${isNew ? 'tile-new' : ''}`;
  tile.innerText = value;
  
  // Calculate position: (cellSize + gap) * index + gap
  const cellSize = 80;
  const gap = 12;
  const x = c * (cellSize + gap) + gap;
  const y = r * (cellSize + gap) + gap;
  
  tile.style.transform = `translate(${x}px, ${y}px) ${isNew ? 'scale(1)' : ''}`; // animation overrides inline scale, so this just sets initial
  tileContainer.appendChild(tile);
}

// --- MOVEMENT ---
function slideLine(row) {
  // Extract non-zero numbers
  let arr = row.filter(val => val);
  let merged = [];
  
  for (let i = 0; i < arr.length; i++) {
    if (i < arr.length - 1 && arr[i] === arr[i+1]) {
      merged.push(arr[i] * 2);
      score += arr[i] * 2;
      i++; // skip next since it's merged
    } else {
      merged.push(arr[i]);
    }
  }
  // Fill the rest with 0
  while (merged.length < SIZE) {
    merged.push(0);
  }
  return merged;
}

function move(direction) {
  if (isGameOver) return;
  
  let tempGrid = JSON.parse(JSON.stringify(grid));
  let changed = false;
  
  if (direction === 'Left' || direction === 'Right') {
    for (let r = 0; r < SIZE; r++) {
      let row = grid[r];
      if (direction === 'Right') row.reverse();
      row = slideLine(row);
      if (direction === 'Right') row.reverse();
      grid[r] = row;
    }
  } else if (direction === 'Up' || direction === 'Down') {
    for (let c = 0; c < SIZE; c++) {
      let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
      if (direction === 'Down') col.reverse();
      col = slideLine(col);
      if (direction === 'Down') col.reverse();
      for (let r = 0; r < SIZE; r++) {
        grid[r][c] = col[r];
      }
    }
  }
  
  // Check if changed
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (tempGrid[r][c] !== grid[r][c]) {
        changed = true;
      }
    }
  }
  
  if (changed) {
    renderGrid();
    updateScore();
    addRandomTile();
    checkGameOver();
  }
}

function checkGameOver() {
  if (getEmptyCells().length > 0) return;
  
  // Check if any merges are possible
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      let current = grid[r][c];
      if (
        (r < SIZE - 1 && grid[r+1][c] === current) || 
        (c < SIZE - 1 && grid[r][c+1] === current)
      ) {
        return; // Merges still possible
      }
    }
  }
  
  // Game Over
  isGameOver = true;
  finalScoreEl.innerText = score;
  gameOverOverlay.classList.remove('hidden');
}

// --- EVENTS ---
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'w', 'W'].includes(e.key)) move('Up');
  else if (['ArrowDown', 's', 'S'].includes(e.key)) move('Down');
  else if (['ArrowLeft', 'a', 'A'].includes(e.key)) move('Left');
  else if (['ArrowRight', 'd', 'D'].includes(e.key)) move('Right');
});

restartBtn.addEventListener('click', init);
tryAgainBtn.addEventListener('click', init);

// Touch support for swiping
let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, {passive: true});

window.addEventListener('touchend', e => {
  if (isGameOver) return;
  let touchEndX = e.changedTouches[0].clientX;
  let touchEndY = e.changedTouches[0].clientY;
  
  let dx = touchEndX - touchStartX;
  let dy = touchEndY - touchStartY;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) > 30) {
      if (dx > 0) move('Right');
      else move('Left');
    }
  } else {
    if (Math.abs(dy) > 30) {
      if (dy > 0) move('Down');
      else move('Up');
    }
  }
});


// --- API INTEGRATION ---
refreshLbBtn.addEventListener('click', fetchLeaderboard);

async function fetchLeaderboard() {
  leaderboardLoading.classList.remove('hidden');
  leaderboardList.innerHTML = '';
  try {
    const res = await fetch(`${API_URL}/leaderboard`);
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    
    if (data.length === 0) {
        leaderboardList.innerHTML = '<li class="lb-placeholder">No scores yet!</li>';
    } else {
        data.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'lb-entry';
        li.innerHTML = `
            <span class="lb-rank">#${index + 1}</span>
            <span class="lb-name">${entry.username}</span>
            <span class="lb-score">${entry.score}</span>
        `;
        leaderboardList.appendChild(li);
        });
    }
  } catch (error) {
    console.error(error);
    leaderboardList.innerHTML = '<li class="lb-placeholder" style="color: #ff4d4d">Failed to load leaderboard.</li>';
  } finally {
    leaderboardLoading.classList.add('hidden');
  }
}

submitScoreBtn.addEventListener('click', async () => {
  const username = playerNameInput.value.trim();
  if (!username) {
    submitMsg.innerText = 'Please enter a name!';
    submitMsg.style.color = '#f87171'; // red
    return;
  }
  
  submitLoading.classList.remove('hidden');
  submitScoreBtn.disabled = true;
  submitMsg.innerText = '';
  
  try {
    const res = await fetch(`${API_URL}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, score })
    });
    
    if (!res.ok) throw new Error('Failed to submit');
    submitMsg.innerText = 'Score submitted! 🎉';
    submitMsg.style.color = '#a7f3d0'; // green
    playerNameInput.disabled = true;
    submitScoreBtn.style.display = 'none';
    
    // Refresh leaderboard
    fetchLeaderboard();
    
  } catch (err) {
    submitMsg.innerText = 'Submission failed. Is backend running?';
    submitMsg.style.color = '#f87171';
  } finally {
    submitLoading.classList.add('hidden');
    submitScoreBtn.disabled = false;
  }
});

// Start Game
init();
