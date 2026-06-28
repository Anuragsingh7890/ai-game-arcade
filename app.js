const games = [
  {
    id: "duel",
    title: "Circuit Duel",
    type: "Strategy",
    summary: "Play tic-tac-toe against a compact minimax AI.",
    intel: "The opponent searches the board, blocks forks, and takes wins immediately. Corners matter more than edges.",
    render: renderDuel
  },
  {
    id: "snake",
    title: "Data Snake",
    type: "Arcade",
    summary: "Collect data packets while your signal trail grows.",
    intel: "The path gets harder as the model grows. Use the arrow keys or WASD and keep turns early.",
    render: renderSnake
  },
  {
    id: "memory",
    title: "Memory Matrix",
    type: "Puzzle",
    summary: "Match all hidden neural symbols.",
    intel: "Open two tiles at a time. The best strategy is to scan in rows and keep a location map in your head.",
    render: renderMemory
  },
  {
    id: "simon",
    title: "Signal Recall",
    type: "Rhythm",
    summary: "Repeat the AI's color sequence.",
    intel: "The sequence grows after every correct round. Chunk colors into pairs once it gets long.",
    render: renderSimon
  },
  {
    id: "reaction",
    title: "Latency Test",
    type: "Speed",
    summary: "Click only when the alert turns hot.",
    intel: "Do not predict the timer. The test punishes early clicks and rewards clean reaction speed.",
    render: renderReaction
  },
  {
    id: "quiz",
    title: "AI Lab Quiz",
    type: "Knowledge",
    summary: "Answer fast questions about AI concepts.",
    intel: "Short, practical AI questions. No trick math, just core concepts every builder should know.",
    render: renderQuiz
  }
];

const state = {
  active: games[0],
  wins: Number(localStorage.getItem("na-wins") || 0),
  plays: Number(localStorage.getItem("na-plays") || 0),
  cleanup: null
};

const els = {
  list: document.querySelector("#gameList"),
  title: document.querySelector("#gameTitle"),
  type: document.querySelector("#gameType"),
  board: document.querySelector("#gameBoard"),
  intel: document.querySelector("#gameIntel"),
  status: document.querySelector("#statusText"),
  wins: document.querySelector("#wins"),
  plays: document.querySelector("#plays"),
  reset: document.querySelector("#resetGame")
};

function init() {
  els.list.innerHTML = games.map((game) => `
    <button class="game-card" type="button" data-game="${game.id}">
      <strong>${game.title}</strong>
      <small>${game.summary}</small>
    </button>
  `).join("");

  els.list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-game]");
    if (!button) return;
    chooseGame(button.dataset.game);
  });

  els.reset.addEventListener("click", () => renderActive());
  renderScores();
  renderActive();
}

function chooseGame(id) {
  state.active = games.find((game) => game.id === id) || games[0];
  renderActive();
}

function renderActive() {
  if (typeof state.cleanup === "function") state.cleanup();
  state.cleanup = null;
  els.title.textContent = state.active.title;
  els.type.textContent = state.active.type;
  els.intel.textContent = state.active.intel;
  els.status.textContent = "Ready";
  els.board.innerHTML = "";
  document.querySelectorAll(".game-card").forEach((button) => {
    button.classList.toggle("active", button.dataset.game === state.active.id);
  });
  state.cleanup = state.active.render();
}

function renderScores() {
  els.wins.textContent = state.wins;
  els.plays.textContent = state.plays;
  localStorage.setItem("na-wins", String(state.wins));
  localStorage.setItem("na-plays", String(state.plays));
}

function recordPlay(won) {
  state.plays += 1;
  if (won) state.wins += 1;
  renderScores();
}

function setStatus(text) {
  els.status.textContent = text;
}

function renderDuel() {
  let board = Array(9).fill("");
  let locked = false;
  els.board.innerHTML = `<div class="matrix" style="grid-template-columns: repeat(3, 1fr)"></div>`;
  const matrix = els.board.querySelector(".matrix");

  function draw(winLine = []) {
    matrix.innerHTML = board.map((value, index) => `
      <button class="cell ${winLine.includes(index) ? "win" : ""}" type="button" data-index="${index}">
        ${value}
      </button>
    `).join("");
  }

  function winner(cells) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const line of lines) {
      const [a, b, c] = line;
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
        return { mark: cells[a], line };
      }
    }
    return cells.includes("") ? null : { mark: "draw", line: [] };
  }

  function score(cells, turn) {
    const result = winner(cells);
    if (result?.mark === "O") return 10;
    if (result?.mark === "X") return -10;
    if (result?.mark === "draw") return 0;
    const scores = cells.map((value, index) => {
      if (value) return null;
      const next = [...cells];
      next[index] = turn;
      return score(next, turn === "O" ? "X" : "O");
    }).filter((value) => value !== null);
    return turn === "O" ? Math.max(...scores) : Math.min(...scores);
  }

  function aiMove() {
    const moves = board.map((value, index) => {
      if (value) return null;
      const next = [...board];
      next[index] = "O";
      return { index, value: score(next, "X") };
    }).filter(Boolean).sort((a, b) => b.value - a.value);
    if (moves[0]) board[moves[0].index] = "O";
  }

  function finishCheck() {
    const result = winner(board);
    if (!result) return false;
    draw(result.line);
    locked = true;
    if (result.mark === "draw") {
      setStatus("Draw. The circuit stayed balanced.");
      recordPlay(false);
    } else {
      setStatus(result.mark === "X" ? "You win. Nice read." : "AI wins this round.");
      recordPlay(result.mark === "X");
    }
    return true;
  }

  matrix.addEventListener("click", (event) => {
    const cell = event.target.closest("[data-index]");
    if (!cell || locked) return;
    const index = Number(cell.dataset.index);
    if (board[index]) return;
    board[index] = "X";
    if (!finishCheck()) {
      aiMove();
      finishCheck();
    }
    draw(winner(board)?.line || []);
  });

  setStatus("Your move. You are X.");
  draw();
}

function renderSnake() {
  els.board.innerHTML = `
    <div class="snake-wrap">
      <canvas width="520" height="520" aria-label="Data Snake game board"></canvas>
      <button class="action-button" type="button">Start Run</button>
    </div>
  `;
  const canvas = els.board.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const start = els.board.querySelector("button");
  const size = 20;
  let snake = [{ x: 8, y: 8 }];
  let dir = { x: 1, y: 0 };
  let food = { x: 14, y: 12 };
  let timer = null;
  let running = false;
  let score = 0;

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
    } while (snake.some((part) => part.x === food.x && part.y === food.y));
  }

  function draw() {
    ctx.fillStyle = "#13252b";
    ctx.fillRect(0, 0, 520, 520);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i <= size; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 26, 0);
      ctx.lineTo(i * 26, 520);
      ctx.moveTo(0, i * 26);
      ctx.lineTo(520, i * 26);
      ctx.stroke();
    }
    ctx.fillStyle = "#f0a202";
    ctx.fillRect(food.x * 26 + 4, food.y * 26 + 4, 18, 18);
    snake.forEach((part, index) => {
      ctx.fillStyle = index === 0 ? "#e4572e" : "#2d9d78";
      ctx.fillRect(part.x * 26 + 3, part.y * 26 + 3, 20, 20);
    });
  }

  function tick() {
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const crashed = head.x < 0 || head.y < 0 || head.x >= size || head.y >= size ||
      snake.some((part) => part.x === head.x && part.y === head.y);
    if (crashed) {
      clearInterval(timer);
      running = false;
      setStatus(`Run ended with ${score} packets.`);
      recordPlay(score >= 8);
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 1;
      setStatus(`Packets collected: ${score}`);
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function key(event) {
    const map = {
      ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }
    };
    const next = map[event.key];
    if (!next || (next.x === -dir.x && next.y === -dir.y)) return;
    dir = next;
  }

  start.addEventListener("click", () => {
    if (running) return;
    snake = [{ x: 8, y: 8 }];
    dir = { x: 1, y: 0 };
    score = 0;
    placeFood();
    running = true;
    setStatus("Run active. Collect packets.");
    timer = setInterval(tick, 130);
    draw();
  });
  window.addEventListener("keydown", key);
  draw();
  return () => {
    clearInterval(timer);
    window.removeEventListener("keydown", key);
  };
}

function renderMemory() {
  const symbols = ["AI", "GPU", "ML", "NN", "RL", "API", "BOT", "CPU"];
  const cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5)
    .map((symbol, index) => ({ id: index, symbol, open: false, matched: false }));
  let open = [];
  let moves = 0;
  els.board.innerHTML = `<div class="memory-grid"></div>`;
  const grid = els.board.querySelector(".memory-grid");

  function draw() {
    grid.innerHTML = cards.map((card) => `
      <button class="memory-card ${card.open ? "open" : ""} ${card.matched ? "matched" : ""}" type="button" data-id="${card.id}">
        ${card.symbol}
      </button>
    `).join("");
  }

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button || open.length === 2) return;
    const card = cards.find((item) => item.id === Number(button.dataset.id));
    if (!card || card.open || card.matched) return;
    card.open = true;
    open.push(card);
    if (open.length === 2) {
      moves += 1;
      if (open[0].symbol === open[1].symbol) {
        open.forEach((item) => item.matched = true);
        open = [];
      } else {
        setTimeout(() => {
          open.forEach((item) => item.open = false);
          open = [];
          draw();
        }, 650);
      }
    }
    const done = cards.every((cardItem) => cardItem.matched);
    setStatus(done ? `Matrix solved in ${moves} moves.` : `Moves: ${moves}`);
    draw();
    if (done) recordPlay(moves <= 18);
  });

  setStatus("Find the pairs.");
  draw();
}

function renderSimon() {
  const colors = ["#0f8b8d", "#e4572e", "#f0a202", "#2d9d78"];
  let sequence = [];
  let cursor = 0;
  let accepting = false;
  els.board.innerHTML = `
    <div class="word-game">
      <div class="simon-grid"></div>
      <button class="action-button" type="button">Start Sequence</button>
    </div>
  `;
  const grid = els.board.querySelector(".simon-grid");
  const start = els.board.querySelector(".action-button");
  grid.innerHTML = colors.map((color, index) => `
    <button class="simon-pad" style="background:${color}" type="button" data-index="${index}" aria-label="Signal ${index + 1}"></button>
  `).join("");
  const pads = [...grid.querySelectorAll(".simon-pad")];

  function flash(index) {
    pads[index].classList.add("lit");
    setTimeout(() => pads[index].classList.remove("lit"), 260);
  }

  function playSequence() {
    accepting = false;
    cursor = 0;
    sequence.forEach((item, index) => setTimeout(() => flash(item), 520 * index));
    setTimeout(() => {
      accepting = true;
      setStatus(`Repeat ${sequence.length} signals.`);
    }, 520 * sequence.length);
  }

  function nextRound() {
    sequence.push(Math.floor(Math.random() * colors.length));
    setStatus(`Level ${sequence.length}`);
    playSequence();
  }

  start.addEventListener("click", () => {
    sequence = [];
    nextRound();
  });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-index]");
    if (!button || !accepting) return;
    const value = Number(button.dataset.index);
    flash(value);
    if (value !== sequence[cursor]) {
      accepting = false;
      setStatus(`Sequence dropped at level ${sequence.length}.`);
      recordPlay(sequence.length >= 6);
      return;
    }
    cursor += 1;
    if (cursor === sequence.length) {
      accepting = false;
      setTimeout(nextRound, 650);
    }
  });

  setStatus("Press start.");
}

function renderReaction() {
  let timeout = null;
  let startTime = 0;
  let armed = false;
  els.board.innerHTML = `
    <div class="reaction-game">
      <div class="reaction-target" role="button" tabindex="0">Press New Test</div>
      <button class="action-button" type="button">New Test</button>
    </div>
  `;
  const target = els.board.querySelector(".reaction-target");
  const button = els.board.querySelector(".action-button");

  function arm() {
    clearTimeout(timeout);
    armed = false;
    target.classList.remove("hot");
    target.textContent = "Wait for hot alert";
    setStatus("Waiting...");
    timeout = setTimeout(() => {
      armed = true;
      startTime = performance.now();
      target.classList.add("hot");
      target.textContent = "Click now";
      setStatus("React.");
    }, 900 + Math.random() * 2400);
  }

  target.addEventListener("click", () => {
    if (!armed) {
      clearTimeout(timeout);
      target.textContent = "Too early";
      setStatus("False start. Try again.");
      recordPlay(false);
      return;
    }
    const ms = Math.round(performance.now() - startTime);
    armed = false;
    target.classList.remove("hot");
    target.textContent = `${ms} ms`;
    setStatus(ms < 260 ? "Fast response." : "Clean, but room to sharpen.");
    recordPlay(ms < 260);
  });
  button.addEventListener("click", arm);
  setStatus("Click New Test.");
  return () => clearTimeout(timeout);
}

function renderQuiz() {
  const questions = [
    { q: "What does training data help an AI model learn?", a: "Patterns", options: ["Patterns", "Battery level", "Screen size"] },
    { q: "Which word means a model is too tuned to examples and weak on new data?", a: "Overfitting", options: ["Overfitting", "Rendering", "Compression"] },
    { q: "What is a prompt?", a: "Input instructions", options: ["Input instructions", "A monitor cable", "A database backup"] },
    { q: "Which task fits computer vision best?", a: "Finding objects in images", options: ["Finding objects in images", "Charging a laptop", "Sorting CSS colors"] }
  ];
  let index = 0;
  let correct = 0;
  els.board.innerHTML = `<div class="quiz-game"></div>`;
  const quiz = els.board.querySelector(".quiz-game");

  function draw() {
    const item = questions[index];
    if (!item) {
      quiz.innerHTML = `
        <h3>Score: ${correct}/${questions.length}</h3>
        <button class="action-button" type="button">Play Again</button>
      `;
      setStatus(correct >= 3 ? "Quiz cleared." : "Quiz complete.");
      recordPlay(correct >= 3);
      quiz.querySelector("button").addEventListener("click", () => {
        index = 0;
        correct = 0;
        draw();
      });
      return;
    }
    quiz.innerHTML = `
      <h3>${item.q}</h3>
      <div class="quiz-options">
        ${item.options.map((option) => `<button type="button">${option}</button>`).join("")}
      </div>
    `;
  }

  quiz.addEventListener("click", (event) => {
    const button = event.target.closest(".quiz-options button");
    if (!button) return;
    const item = questions[index];
    if (button.textContent === item.a) correct += 1;
    index += 1;
    setStatus(`Correct: ${correct}/${questions.length}`);
    draw();
  });

  setStatus("Choose an answer.");
  draw();
}

init();
