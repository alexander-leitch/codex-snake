import { expect, test } from '@playwright/test';

test('loads game shell with header stats', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Snake' })).toBeVisible();
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('#speed-level')).toHaveText('1');
  await expect(page.locator('#size-level')).toHaveText('1');
  await expect(page.locator('#board-size')).toHaveText('20x20');
  await expect(page.locator('#status')).toContainText('Press any direction');
});

test('keyboard controls move snake and R restarts', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(260);

  const runningState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(runningState.status).toBe('running');
  expect(runningState.snake[0].y).toBeLessThan(10);

  await page.keyboard.press('r');
  await page.waitForTimeout(80);

  const resetState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(resetState.status).toBe('idle');
  expect(resetState.score).toBe(0);
  await expect(page.locator('#board-size')).toHaveText('20x20');
});

test('score updates after eating food', async ({ page }) => {
  await page.addInitScript(() => {
    const values = [0.55, 0.5, 0.65, 0.5, 0.75, 0.5];
    let idx = 0;
    Math.random = () => values[idx++] ?? 0.5;
  });

  await page.goto('/');
  await page.keyboard.press('ArrowRight');

  await expect(page.locator('#score')).toHaveText('1', { timeout: 2000 });
});
