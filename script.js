let snake, food, gridSize = 20, tileSize = 20, score = 0, gameState = 'waiting', speed;
let playerName = '', difficulty = 'easy', direction = null;
const leaderboardBody = document.getElementById('leaderboard-body');
const startButton = document.getElementById('start-button');
const nameInput = document.getElementById('player-name');
const nameError = document.getElementById('name-error');
let currentLeaderboard = 'easy';

// Backend API URL (replace with your Render backend URL after deployment)
const BACKEND_URL = 'https://neon-snake-backend.onrender.com'; // e.g., 'https://neon-snake-backend.onrender.com'

// p5.js setup
function setup() {
  createCanvas(400, 400).parent('game-canvas');
  frameRate(60);
  fetchLeaderboard();
  console.log('Game setup complete.');
}

// Reset game state
function resetGame() {
  speed = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15;
  snake = [{ x: 10, y: 10 }];
  food = spawnFood();
  score = 0;
  direction = null;
  document.getElementById('score-display').innerText = `Score: ${score}`;
  gameState = 'playing';
  console.log('Game reset. Snake:', snake, 'Food:', food, 'GameState:', gameState);
}

// Spawn food at random position
function spawnFood() {
  let x = floor(random(0, gridSize));
  let y = floor(random(0, gridSize));
  while (snake.some(segment => segment.x === x && segment.y === y)) {
    x = floor(random(0, gridSize));
    y = floor(random(0, gridSize));
  }
  return { x, y };
}

// p5.js draw loop
function draw() {
  background(26, 26, 46);
  if (gameState === 'waiting') {
    textSize(24);
    fill(255, 46, 99);
    textAlign(CENTER, CENTER);
    text('Press Start Game', width / 2, height / 2);
  } else if (gameState === 'playing') {
    if (frameCount % (60 / speed) === 0) {
      updateSnake();
    }
    drawSnake();
    drawFood();
  } else if (gameState === 'gameover') {
    textSize(32);
    fill(255, 46, 99);
    textAlign(CENTER, CENTER);
    text('Game Over', width / 2, height / 2);
    text(`Score: ${score}`, width / 2, height / 2 + 40);
    console.log('Game Over. Final Score:', score);
  }
}

// Update snake position
function updateSnake() {
  if (!direction) return;

  let head = { x: snake[0].x, y: snake[0].y };
  if (direction === 'right') head.x += 1;
  else if (direction === 'left') head.x -= 1;
  else if (direction === 'down') head.y += 1;
  else if (direction === 'up') head.y -= 1;

  if (snake.length > 1 && head.x === snake[1].x && head.y === snake[1].y) {
    console.log('Prevented reverse direction');
    return;
  }

  if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize ||
      snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameState = 'gameover';
    console.log('Collision detected. Head:', head, 'Snake:', snake);
    updateLeaderboard();
    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    document.getElementById('score-display').innerText = `Score: ${score}`;
    food = spawnFood();
    console.log('Ate food. New score:', score, 'New food:', food);
  } else {
    snake.pop();
  }
}

// Draw snake
function drawSnake() {
  fill(0, 255, 184);
  snake.forEach(segment => rect(segment.x * tileSize, segment.y * tileSize, tileSize, tileSize));
}

// Draw food
function drawFood() {
  fill(255, 46, 99);
  rect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);
}

// Fetch leaderboard from backend
async function fetchLeaderboard() {
  try {
    const response = await fetch(`${BACKEND_URL}/leaderboard/${currentLeaderboard}`);
    const current = await response.json();
    leaderboardBody.innerHTML = '';
    if (current.length === 0) {
      leaderboardBody.innerHTML = '<tr><td colspan="3">No scores yet!</td></tr>';
    } else {
      current.forEach((entry, index) => {
        const row = `<tr><td>${index + 1}</td><td>${entry.name}</td><td>${entry.score}</td></tr>`;
        leaderboardBody.innerHTML += row;
      });
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    leaderboardBody.innerHTML = '<tr><td colspan="3">Error loading leaderboard</td></tr>';
  }
}

// Update leaderboard via backend
async function updateLeaderboard() {
  if (!playerName) return;
  try {
    const response = await fetch(`${BACKEND_URL}/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName, score, difficulty })
    });
    if (response.ok) {
      console.log(`Leaderboard (${difficulty}) updated: ${playerName} scored ${score}`);
      fetchLeaderboard();
    } else {
      console.error('Failed to update leaderboard:', response.status);
    }
  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

// Handle key presses
function keyPressed() {
  if (gameState !== 'playing') return;
  if ((keyCode === RIGHT_ARROW || key === 'd' || key === 'D') && direction !== 'left') {
    direction = 'right';
  } else if ((keyCode === LEFT_ARROW || key === 'a' || key === 'A') && direction !== 'right') {
    direction = 'left';
  } else if ((keyCode === DOWN_ARROW || key === 's' || key === 'S') && direction !== 'up') {
    direction = 'down';
  } else if ((keyCode === UP_ARROW || key === 'w' || key === 'W') && direction !== 'down') {
    direction = 'up';
  }
  console.log('Direction set to:', direction);
}

// Validate name input
nameInput.addEventListener('input', () => {
  const name = nameInput.value.trim();
  startButton.disabled = name.length < 4;
  nameError.style.display = name.length < 4 && name.length > 0 ? 'block' : 'none';
});

// Event listeners
startButton.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (name.length < 4) {
    nameError.style.display = 'block';
    return;
  }
  playerName = name;
  difficulty = document.getElementById('difficulty').value;
  resetGame();
});

document.getElementById('tutorial-button').addEventListener('click', () => {
  document.getElementById('tutorial-modal').style.display = 'flex';
});

document.getElementById('close-tutorial').addEventListener('click', () => {
  document.getElementById('tutorial-modal').style.display = 'none';
});

// Leaderboard switch buttons
const leaderboardButtons = {
  easy: document.getElementById('leaderboard-easy'),
  medium: document.getElementById('leaderboard-medium'),
  hard: document.getElementById('leaderboard-hard')
};

Object.keys(leaderboardButtons).forEach(key => {
  leaderboardButtons[key].addEventListener('click', () => {
    currentLeaderboard = key;
    Object.values(leaderboardButtons).forEach(btn => btn.classList.remove('active'));
    leaderboardButtons[key].classList.add('active');
    fetchLeaderboard();
    console.log(`Switched to ${key} leaderboard`);
  });
});