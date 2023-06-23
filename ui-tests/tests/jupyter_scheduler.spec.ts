import { expect, test } from '@jupyterlab/galata';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test('Notebook Jobs card is visible in JupyterLab launcher', async ({
  page
}) => {
  await page.goto();
  const launcher = page.locator('div[role="main"] >> text=Launcher');
  await launcher.waitFor();
  const jobsEl = page.locator('div.jp-LauncherCard[title="Notebook Jobs"]');

  await expect(jobsEl).toBeVisible();
});

test('"Create a notebook job" button is visible in notebook toolbar', async ({
  page
}) => {
  await page.goto();
  await page.notebook.createNew();
  const createJobButton = page.locator('button.jp-ToolbarButtonComponent[data-command="scheduling:create-from-notebook"][title="Create a notebook job"]');

  await expect(createJobButton).toBeVisible();
});
