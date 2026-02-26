export const PROGRESSION = {
  baseTickMs: 220,
  minTickMs: 120,
  speedLevelTickDrop: 8,
  speedPointsPerLevel: 4,
  baseGridSize: 20,
  maxGridSize: 44,
  sizeLevelGridIncrease: 2,
  sizePointsPerLevel: 10
};

export function getMaxSpeedLevel(cfg = PROGRESSION) {
  return Math.ceil((cfg.baseTickMs - cfg.minTickMs) / cfg.speedLevelTickDrop) + 1;
}

export function getSpeedLevel(score, cfg = PROGRESSION) {
  const raw = Math.floor(score / cfg.speedPointsPerLevel) + 1;
  return Math.min(getMaxSpeedLevel(cfg), raw);
}

export function getTickMsForSpeedLevel(speedLevel, cfg = PROGRESSION) {
  return Math.max(cfg.minTickMs, cfg.baseTickMs - (speedLevel - 1) * cfg.speedLevelTickDrop);
}

export function getCurrentTickMs(score, cfg = PROGRESSION) {
  return getTickMsForSpeedLevel(getSpeedLevel(score, cfg), cfg);
}

export function getMaxSizeLevel(cfg = PROGRESSION) {
  return Math.floor((cfg.maxGridSize - cfg.baseGridSize) / cfg.sizeLevelGridIncrease) + 1;
}

export function getSizeLevel(score, cfg = PROGRESSION) {
  const raw = Math.floor(score / cfg.sizePointsPerLevel) + 1;
  return Math.min(getMaxSizeLevel(cfg), raw);
}

export function getTargetGridSize(score, cfg = PROGRESSION) {
  return (
    cfg.baseGridSize +
    (getSizeLevel(score, cfg) - 1) * cfg.sizeLevelGridIncrease
  );
}
