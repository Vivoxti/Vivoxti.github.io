/**
 * Tic Tac Toe with animations, AI opponent, and smooth win/draw sequences
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ================== CONFIG ================== */
  const CELL_IDS = [
    "left-top", "center-top", "right-top",
    "left-center", "center-center", "right-center",
    "left-bottom", "center-bottom", "right-bottom"
  ];

  const WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const SVG_SIZE = 49;
  const X_STROKE = 6;
  const O_STROKE = 6;
  const WIN_LINE_STROKE = 18;

  const PLAYER_TO_AI_DELAY = 1000;
  const X_LINE_PART_MS = 280;
  const O_DRAW_MS = 560;
  const FIGURE_DRAW_TOTAL = Math.max(O_DRAW_MS, X_LINE_PART_MS * 2);
  const PRE_WIN_LEAD = 100;
  const EXTRA_WIN_DELAY = 400;
  const WIN_LINE_DURATION_MS = 670;
  const COLOR_FADE_MS = WIN_LINE_DURATION_MS;
  const POST_LINE_FADE_MS = 1000;
  const START_WIN_DELAY_MS = Math.max(0, FIGURE_DRAW_TOTAL - PRE_WIN_LEAD + EXTRA_WIN_DELAY);

  /* ================== STATE ================== */
  let board = Array(9).fill(null);
  let currentPlayer = "X";
  let gameActive = true;
  let aiThinking = false;
  let activeTimeouts = [];

  const cells = CELL_IDS.map(id => document.getElementById(id));
  const C_WHITE = document.getElementById("C2-white");
  const C_TOP = document.getElementById("C2-top");
  const C_BOTTOM = document.getElementById("C2-bottom");

  /* ================== HELPERS ================== */
  const getCellByIndex = i => document.getElementById(CELL_IDS[i]);
  const svgCreate = tag => document.createElementNS("http://www.w3.org/2000/svg", tag);
  const isWinner = player => WIN_PATTERNS.some(pat => pat.every(i => board[i] === player));
  const findWinningPattern = player => WIN_PATTERNS.find(pat => pat.every(i => board[i] === player));

  const scheduleTimeout = (fn, ms) => {
    const id = setTimeout(fn, ms);
    activeTimeouts.push(id);
    return id;
  };

  const clearAllTimeouts = () => {
    activeTimeouts.forEach(id => clearTimeout(id));
    activeTimeouts = [];
  };

  /* ================== RENDER ================== */
  function renderFigure(cellEl, player) {
    const svg = svgCreate("svg");
    svg.setAttribute("width", SVG_SIZE);
    svg.setAttribute("height", SVG_SIZE);
    svg.setAttribute("viewBox", `0 0 ${SVG_SIZE} ${SVG_SIZE}`);
    svg.style.position = "absolute";
    svg.style.left = "50%";
    svg.style.top = "50%";
    svg.style.transform = "translate(-50%, -50%)";
    svg.style.pointerEvents = "none";
    svg.style.opacity = "1";
    svg.style.filter = "none";

    if (player === "X") {
      const l1 = svgCreate("line");
      l1.setAttribute("x1", "7");
      l1.setAttribute("y1", "7");
      l1.setAttribute("x2", String(SVG_SIZE - 7));
      l1.setAttribute("y2", String(SVG_SIZE - 7));
      l1.setAttribute("stroke", "#61F2A2");
      l1.setAttribute("stroke-width", String(X_STROKE));
      l1.setAttribute("stroke-linecap", "round");
      l1.style.strokeDasharray = 70;
      l1.style.strokeDashoffset = 70;
      l1.style.animation = `draw ${X_LINE_PART_MS}ms forwards`;

      const l2 = svgCreate("line");
      l2.setAttribute("x1", String(SVG_SIZE - 7));
      l2.setAttribute("y1", "7");
      l2.setAttribute("x2", "7");
      l2.setAttribute("y2", String(SVG_SIZE - 7));
      l2.setAttribute("stroke", "#61F2A2");
      l2.setAttribute("stroke-width", String(X_STROKE));
      l2.setAttribute("stroke-linecap", "round");
      l2.style.strokeDasharray = 70;
      l2.style.strokeDashoffset = 70;
      l2.style.animation = `draw ${X_LINE_PART_MS}ms forwards ${X_LINE_PART_MS}ms`;

      svg.appendChild(l1);
      svg.appendChild(l2);
    } else {
      const c = svgCreate("circle");
      const r = 17.5;
      c.setAttribute("cx", String(SVG_SIZE / 2));
      c.setAttribute("cy", String(SVG_SIZE / 2));
      c.setAttribute("r", String(r));
      c.setAttribute("stroke", "#F06060");
      c.setAttribute("stroke-width", String(O_STROKE));
      c.setAttribute("fill", "none");

      const circumference = 2 * Math.PI * r;
      c.style.strokeDasharray = `${circumference}`;
      c.style.strokeDashoffset = `${circumference}`;
      c.style.animation = `draw ${O_DRAW_MS}ms forwards`;

      svg.appendChild(c);
    }

    cellEl.appendChild(svg);
    return svg;
  }

  /* ================== ANIMATIONS ================== */
  function bounceCell(cellEl) {
    const svg = cellEl.querySelector("svg");
    if (!svg) return;
    svg.style.transition = "transform 80ms ease-in";
    svg.style.transform = "translate(-50%, -50%) scale(0.78)";
    scheduleTimeout(() => {
      svg.style.transition = "transform 280ms cubic-bezier(0.7, -0.6, 0.3, 1.8)";
      svg.style.transform = "translate(-50%, -50%) scale(1)";
    }, 80);
  }

  function flashLetterC() {
    const parts = [C_WHITE, C_TOP, C_BOTTOM].filter(Boolean);
    parts.forEach(p => {
      p.style.transition = "background 180ms ease-out";
      p.style.background = "#FF4D4D";
    });
    scheduleTimeout(() => {
      parts.forEach(p => {
        p.style.transition = "background 700ms cubic-bezier(0.4, 0, 0.2, 1)";
        p.style.background = "rgba(255,255,255,1.0)";
      });
    }, 200);
  }

  /* ================== GAME FLOW ================== */
  function handleCellClick(cellEl) {
    const index = CELL_IDS.indexOf(cellEl.id);
    if (board[index] !== null) {
      bounceCell(cellEl);
      return;
    }
    if (!gameActive || aiThinking) {
      flashLetterC();
      return;
    }
    playAt(index);
  }

  function playAt(index) {
    const cellEl = getCellByIndex(index);
    board[index] = currentPlayer;
    renderFigure(cellEl, currentPlayer);

    if (isWinner(currentPlayer)) {
      scheduleWinSequence();
      return;
    }
    if (board.every(v => v !== null)) {
      endGame(true);
      return;
    }

    gameActive = false;
    aiThinking = true;
    scheduleTimeout(aiMove, PLAYER_TO_AI_DELAY);
  }

  function aiMove() {
    const empty = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if (!empty.length) return;
    const move = empty[Math.floor(Math.random() * empty.length)];
    board[move] = "O";
    const el = getCellByIndex(move);
    renderFigure(el, "O");

    scheduleTimeout(() => {
      if (isWinner("O")) {
        scheduleWinSequence();
      } else if (board.every(v => v !== null)) {
        endGame(true);
      } else {
        gameActive = true;
      }
      aiThinking = false;
    }, O_DRAW_MS * 0.9);
  }

  /* ================== WIN/RESET ================== */
  function scheduleWinSequence() {
    scheduleTimeout(animateWinLineAndFade, START_WIN_DELAY_MS);
    gameActive = false;
    aiThinking = false;
  }

  function animateWinLineAndFade() {
    const winner = ["X", "O"].find(p => isWinner(p));
    const winningPattern = findWinningPattern(winner);
    if (!winningPattern) return;

    const firstEl = getCellByIndex(winningPattern[0]);
    const lastEl = getCellByIndex(winningPattern[2]);
    const r1 = firstEl.getBoundingClientRect();
    const r2 = lastEl.getBoundingClientRect();

    const overlay = svgCreate("svg");
    overlay.classList.add("win-line-overlay");
    overlay.setAttribute("width", String(window.innerWidth));
    overlay.setAttribute("height", String(window.innerHeight));
    overlay.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
    Object.assign(overlay.style, {
      position: "fixed", left: "0", top: "0", zIndex: "10000",
      pointerEvents: "none", overflow: "visible", opacity: "1"
    });

    const x1 = r1.left + r1.width / 2;
    const y1 = r1.top + r1.height / 2;
    const x2 = r2.left + r2.width / 2;
    const y2 = r2.top + r2.height / 2;

    const line = svgCreate("line");
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    line.setAttribute("stroke", "#2980B9");
    line.setAttribute("stroke-width", String(WIN_LINE_STROKE));
    line.setAttribute("stroke-linecap", "round");

    const len = Math.hypot(x2 - x1, y2 - y1);
    line.style.strokeDasharray = `${len}`;
    line.style.strokeDashoffset = `${len}`;
    line.style.transition = `stroke-dashoffset ${WIN_LINE_DURATION_MS}ms ease`;

    overlay.appendChild(line);
    document.body.appendChild(overlay);

    const nonParticipants = CELL_IDS.map((_, i) => i).filter(i => !winningPattern.includes(i));

    requestAnimationFrame(() => {
      nonParticipants.forEach(i => {
        const s = getCellByIndex(i)?.querySelector("svg");
        if (s) {
          s.style.transition = `filter ${COLOR_FADE_MS}ms ease`;
          s.style.filter = "grayscale(1)";
        }
      });
      requestAnimationFrame(() => {
        line.style.strokeDashoffset = "0";
      });
    });

    scheduleTimeout(() => {
      CELL_IDS.forEach((_, i) => {
        const s = getCellByIndex(i)?.querySelector("svg");
        if (s) {
          s.style.transition = `opacity ${POST_LINE_FADE_MS}ms ease`;
          s.style.opacity = "0";
        }
      });
      overlay.style.transition = `opacity ${POST_LINE_FADE_MS}ms ease`;
      overlay.style.opacity = "0";
    }, WIN_LINE_DURATION_MS + 120);

    scheduleTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      resetGame();
    }, WIN_LINE_DURATION_MS + POST_LINE_FADE_MS + 300);
  }

  function animateDraw() {
    CELL_IDS.forEach((_, i) => {
      const s = getCellByIndex(i)?.querySelector("svg");
      if (!s) return;
      s.style.transition = "filter 1000ms ease";
      s.style.filter = "grayscale(1)";
      scheduleTimeout(() => {
        s.style.transition = "opacity 1000ms ease";
        s.style.opacity = "0";
      }, 1000);
    });
    scheduleTimeout(resetGame, 2500);
  }

  function endGame(isDraw) {
    gameActive = false;
    aiThinking = false;
    if (isDraw) animateDraw();
    else scheduleWinSequence();
  }

  function resetGame() {
    clearAllTimeouts();
    const overlay = document.querySelector(".win-line-overlay");
    if (overlay?.parentNode) overlay.parentNode.removeChild(overlay);

    board = Array(9).fill(null);
    currentPlayer = "X";
    gameActive = true;
    aiThinking = false;

    CELL_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = "";
        el.style.background = "transparent";
        el.style.filter = "none";
      }
    });
  }

  /* ================== INIT ================== */
  cells.forEach(c => {
    if (!c || c._hasTicHandler) return;
    c.addEventListener("click", () => handleCellClick(c));
    c._hasTicHandler = true;
  });

  const styleTag = document.createElement("style");
  styleTag.innerHTML = `@keyframes draw { to { stroke-dashoffset: 0; } }`;
  document.head.appendChild(styleTag);

  window._ttt = { resetGame, getBoard: () => [...board] };
});
