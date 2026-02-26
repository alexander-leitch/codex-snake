import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCurrentTickMs,
  getSizeLevel,
  getSpeedLevel,
  getTargetGridSize
} from './progression.js';

test('speed level increases with score and affects tick ms', () => {
  assert.equal(getSpeedLevel(0), 1);
  assert.equal(getCurrentTickMs(0), 220);

  assert.equal(getSpeedLevel(4), 2);
  assert.equal(getCurrentTickMs(4), 212);
});

test('speed progression clamps at minimum tick', () => {
  assert.equal(getCurrentTickMs(1000), 120);
});

test('size level increases gradually across score', () => {
  assert.equal(getSizeLevel(0), 1);
  assert.equal(getTargetGridSize(0), 20);

  assert.equal(getSizeLevel(10), 2);
  assert.equal(getTargetGridSize(10), 22);

  assert.equal(getSizeLevel(20), 3);
  assert.equal(getTargetGridSize(20), 24);
});
