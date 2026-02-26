Original prompt: Build a classic Snake game in this repo.

- Initialized project as a dependency-free static web app because repo was empty.
- Next: implement deterministic snake game logic module and UI shell.
- Added minimal static UI shell and deterministic snake logic module (`game-logic.js`).
- Wired rendering, keyboard controls (arrows/WASD), touch controls, score/status, and restart button in `snake.js`.
- Added core logic tests with Node test runner for movement, growth, collisions, and food placement.
- Playwright skill client could not run here because `playwright` package is not installed in the environment.
- Next: add minimal pause/resume support to satisfy manual verification scope.
- Added pause/resume support (Space/P key + button) and test coverage for paused tick behavior.
- Final status: classic Snake loop implemented with minimal UI and passing core logic tests.
- TODO (optional): if visual E2E validation is required, install Playwright and rerun the skill client.
