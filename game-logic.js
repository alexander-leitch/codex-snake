export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const OPPOSITE = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left'
};

function cloneSnake(snake) {
  return snake.map((part) => ({ x: part.x, y: part.y }));
}

export function createInitialState(options = {}) {
  const gridSize = options.gridSize ?? 20;
  const start = options.start ?? [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  const direction = options.direction ?? 'right';
  const rng = options.rng ?? Math.random;

  const snake = cloneSnake(start);
  const state = {
    gridSize,
    snake,
    direction,
    pendingDirection: direction,
    directionQueue: [],
    food: { x: 0, y: 0 },
    score: 0,
    status: 'idle',
    rng
  };

  state.food = spawnFood(state, rng);
  return state;
}

export function setDirection(state, nextDirection) {
  if (!DIRECTIONS[nextDirection]) return;
  const lastIntended =
    state.directionQueue.length > 0
      ? state.directionQueue[state.directionQueue.length - 1]
      : state.pendingDirection;

  if (OPPOSITE[lastIntended] === nextDirection) return;
  if (lastIntended === nextDirection) return;
  if (state.directionQueue.length >= 2) return;

  state.directionQueue.push(nextDirection);
}

export function restart(state, options = {}) {
  const fresh = createInitialState({
    gridSize: options.gridSize ?? state.gridSize,
    rng: state.rng
  });
  Object.assign(state, fresh);
}

export function expandGrid(state, amount = 4, maxGridSize = 44) {
  if (state.gridSize >= maxGridSize) {
    return false;
  }

  const nextSize = Math.min(maxGridSize, state.gridSize + amount);
  const offset = Math.floor((nextSize - state.gridSize) / 2);

  state.gridSize = nextSize;
  state.snake = state.snake.map((part) => ({
    x: part.x + offset,
    y: part.y + offset
  }));

  if (state.food.x >= 0 && state.food.y >= 0) {
    state.food = {
      x: state.food.x + offset,
      y: state.food.y + offset
    };
  }

  return true;
}

export function togglePause(state) {
  if (state.status === 'running') {
    state.status = 'paused';
    return;
  }
  if (state.status === 'paused') {
    state.status = 'running';
  }
}

export function step(state) {
  if (state.status === 'gameover') return state;
  if (state.status === 'paused') return state;

  if (state.status === 'idle') {
    state.status = 'running';
  }

  if (state.directionQueue.length > 0) {
    state.pendingDirection = state.directionQueue.shift();
  }
  state.direction = state.pendingDirection;

  const head = state.snake[0];
  const delta = DIRECTIONS[state.direction];
  const nextHead = { x: head.x + delta.x, y: head.y + delta.y };
  const ateFood = nextHead.x === state.food.x && nextHead.y === state.food.y;
  const collisionBody = ateFood ? state.snake : state.snake.slice(0, -1);

  const hitWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize;

  if (hitWall || collides(nextHead, collisionBody)) {
    state.status = 'gameover';
    return state;
  }

  state.snake.unshift(nextHead);
  if (ateFood) {
    state.score += 1;
    state.food = spawnFood(state, state.rng);
  } else {
    state.snake.pop();
  }

  return state;
}

export function spawnFood(state, rng = Math.random) {
  const totalCells = state.gridSize * state.gridSize;
  if (state.snake.length >= totalCells) {
    return { x: -1, y: -1 };
  }

  let x = 0;
  let y = 0;
  do {
    x = Math.floor(rng() * state.gridSize);
    y = Math.floor(rng() * state.gridSize);
  } while (collides({ x, y }, state.snake));

  return { x, y };
}

function collides(point, snake) {
  return snake.some((part) => part.x === point.x && part.y === point.y);
}
