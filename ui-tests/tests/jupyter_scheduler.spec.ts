import { expect, test } from '@jupyterlab/galata';
import { Page } from '@playwright/test';

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
    await page.waitForSelector('text=Kernel status: Idle');
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

/**
 * Helper class for Jupyter Scheduler testing in JupyterLab
 */
class SchedulerHelper {
  constructor(readonly page: Page) {}

  /**
   * JupyterLab launcher "Notebook Jobs" card selector
   */
  get launcherCardSelector() {
    return 'div.jp-LauncherCard[title="Notebook Jobs"]';
  }

  /**
   * JupyterLab launcher "Notebook Jobs" card locator
   */
  get launcherCardLocator() {
    return this.page.locator(this.launcherCardSelector);
  }

  /**
   * JupyterLab notebook toolbar "Create a notebook job" button selector
   */
  get notebookToolbarButtonSelector() {
    return 'button.jp-ToolbarButtonComponent[data-command="scheduling:create-from-notebook"][title="Create a notebook job"]';
  }

  /**
   * JupyterLab notebook toolbar "Create a notebook job" button locator
   */
  get notebookToolbarButtonLocator() {
    return this.page.locator(this.notebookToolbarButtonSelector);
  }

  /**
   * JupyterLab File Browser right-click menu "Create Notebook Job" item selector
   */
  get filebrowserMenuItemSelector() {
    return 'li[data-type="command"][data-command="scheduling:create-from-filebrowser"] >> div:has-text("Create Notebook Job")';
  }

  /**
   * JupyterLab File Browser right-click menu "Create Notebook Job" item locator
   */
  get filebrowserMenuItemLocator() {
    return this.page.locator(this.filebrowserMenuItemSelector);
  }
}
