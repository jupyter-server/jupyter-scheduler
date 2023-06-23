import { expect, test } from '@jupyterlab/galata';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test('Should add a Notebook Jobs card to JupyterLab launcher', async ({
  page
}) => {
  await page.goto();
  const launcher = page.locator('div[role="main"] >> text=Launcher');
  await launcher.waitFor();
  const jobsElement = page.locator('div.jp-LauncherCard[title="Notebook Jobs"]');

  await expect(jobsElement).toBeVisible();
});

test('Test should fail', async ({
  page
}) => {
  await page.goto();
  const launcher = page.locator('div[role="main"] >> text=Launcher');
  await launcher.waitFor();
  const jobsElement = page.locator('div.jp-LauncherCard[title="Nonexisting title 2869291980"]');

  await expect(jobsElement).toBeVisible();
});
