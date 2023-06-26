import { expect, test } from '@jupyterlab/galata';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test('"Notebook Jobs" card is visible in JupyterLab launcher', async ({
  page
}) => {
  await page.goto();
  const launcher = page.locator('div[role="main"] >> text=Launcher');
  await launcher.waitFor();
  const jobsEl = page.locator('div.jp-LauncherCard[title="Notebook Jobs"]');
  const snapshotName = 'launcher-with-scheduler.png';

  await expect(jobsEl).toBeVisible();
  expect(await page.screenshot()).toMatchSnapshot(snapshotName);
});

test('"Create a notebook job" button is visible in notebook toolbar', async ({
  page
}) => {
  await page.goto();
  await page.notebook.createNew();
  const createJobButton = page.locator('button.jp-ToolbarButtonComponent[data-command="scheduling:create-from-notebook"][title="Create a notebook job"]');
  const snapshotName = 'notebook-with-createjob-button.png';

  await expect(createJobButton).toBeVisible();
  expect(await page.screenshot()).toMatchSnapshot(snapshotName);
});

test('"Create Notebook Job" item is visible when right clicking a notebook in File Browser', async ({
  page
}) => {
  await page.goto();
  await page.notebook.createNew();
  await page.sidebar.openTab('filebrowser');
  expect(await page.sidebar.isTabOpen('filebrowser')).toBeTruthy();
  await page.filebrowser.refresh();
  await page.click('.jp-DirListing-item[data-file-type="notebook"]', { button : 'right'});

  expect(await page.menu.isAnyOpen()).toBe(true);
  const createJobItem = page.locator('li[data-type="command"][data-command="scheduling:create-from-filebrowser"] >> div:has-text("Create Notebook Job")');
  await expect(createJobItem).toBeVisible();
});
