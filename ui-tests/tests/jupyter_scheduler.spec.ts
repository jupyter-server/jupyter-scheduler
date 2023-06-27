import { expect, test } from '@jupyterlab/galata';
import { SchedulerHelper } from '../helpers/SchedulerHelper';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test.describe('File selection for normal staging', () => {
  let schedulerHelper: SchedulerHelper;
  test.beforeEach(async ({ page }) => {
    schedulerHelper = new SchedulerHelper(page);
    await page.goto();
  });

  test('"Notebook Jobs" card is visible in JupyterLab launcher', async ({
    page
  }) => {
    const launcher = page.locator('div[role="main"] >> text=Launcher');
    await launcher.waitFor();
    const launcherCard = schedulerHelper.launcherCardLocator;
    const snapshotName = 'launcher-with-scheduler.png';

    await expect(launcherCard).toBeVisible();
    expect(await page.screenshot()).toMatchSnapshot(snapshotName);
  });

  test('"Create a notebook job" button is visible in notebook toolbar', async ({
    page
  }) => {
    await page.notebook.createNew();
    await page.locator('.jp-DebuggerBugButton[aria-disabled="false"]').waitFor();
    await page.locator('.jp-Notebook-ExecutionIndicator[data-status="idle"]').waitFor();
    const createJobButton = schedulerHelper.notebookToolbarButtonLocator;
    const snapshotName = 'notebook-with-createjob-button.png';

    await expect(createJobButton).toBeVisible();
    expect(await page.screenshot()).toMatchSnapshot(snapshotName);
  });

  test('"Create Notebook Job" item is visible when right clicking a notebook in File Browser', async ({
    page
  }) => {
    await page.notebook.createNew();
    await page.sidebar.openTab('filebrowser');
    expect(await page.sidebar.isTabOpen('filebrowser')).toBeTruthy();
    await page.filebrowser.refresh();
    await page.click('.jp-DirListing-item[data-file-type="notebook"]', { button : 'right'});

    expect(await page.menu.isAnyOpen()).toBe(true);
    const righClickMenu = page.locator('ul.lm-Menu-content[role="menu"]');
    const createJobItem = schedulerHelper.filebrowserMenuItemLocator;
    const snapshotName = 'filebrowser-notebook-rightclick-menu.png';
    await expect(createJobItem).toBeVisible();
    expect(await righClickMenu.screenshot()).toMatchSnapshot(snapshotName);
  });
});
