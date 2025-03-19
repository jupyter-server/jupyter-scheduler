import { expect, test } from '@jupyterlab/galata';
import { SchedulerHelper } from '../helpers/SchedulerHelper';

/**
 * Snapshot files are mapped by Galata basis the configuration set in file:
 * https://github.com/jupyterlab/jupyterlab/blob/main/galata/update_snapshots.py
 */
enum FILENAMES {
  LAUNCHER = 'launcher.png',
  NOTEBOOK_TOOLBAR = 'notebook-toolbar.png',
  FILEBROWSER_MENU = 'filebrowser-menu.png',
  CREATE_JOB_VIEW = 'create-job-view.png',
  LIST_VIEW = 'list-view.png'
}

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test.describe('Jupyter Scheduler', () => {
  let scheduler: SchedulerHelper;

  test.beforeEach(async ({ page }, testInfo) => {
    scheduler = new SchedulerHelper(page, testInfo);
    await page.goto();
  });

  test('shows card in launcher', async () => {
    await expect(scheduler.launcherCard).toBeVisible();
    await scheduler.assertSnapshot(FILENAMES.LAUNCHER);
  });

  test('shows notebook toolbar button', async () => {
    await scheduler.createNotebook();
    await expect(scheduler.createJobTbutton).toBeVisible();
    await scheduler.assertSnapshot(FILENAMES.NOTEBOOK_TOOLBAR, {
      locator: scheduler.notebookToolbar,
      mask: [
        scheduler.enableDebuggerTbutton,
        scheduler.kernelNameTbutton,
        scheduler.executionIndicatorTbutton
      ]
    });
  });

  test('opens create job view from notebook toolbar', async ({ page }) => {
    await scheduler.createNotebook();
    await scheduler.createJobTbutton.click();
    await page.waitForSelector('text=Loading …', { state: 'hidden' });
    await page.waitForSelector('text=Saving Completed', { state: 'hidden' });
    await scheduler.assertSnapshot(FILENAMES.CREATE_JOB_VIEW);
  });

  test('shows filebrowser menu item', async ({ page }) => {
    await scheduler.createNotebook();
    await page.sidebar.openTab('filebrowser');
    await scheduler.notebookFbListing.click({ button: 'right' });
    const fbCtxMenu = page.locator('.lm-Menu');
    await scheduler.assertSnapshot(FILENAMES.FILEBROWSER_MENU, {
      locator: fbCtxMenu,
      closeFb: false
    });
  });

  test('opens create job view from filebrowser menu item', async () => {
    await scheduler.createNotebook();
    await scheduler.openCreateJobFromFilebrowser();
    await scheduler.assertSnapshot(FILENAMES.CREATE_JOB_VIEW);
  });

  test('shows newly created job in job list view', async ({ page }) => {
    await scheduler.createNotebook();
    await scheduler.createJobFromFilebrowser();
    await scheduler.standardizeListCreateTime();
    await scheduler.assertSnapshot(FILENAMES.LIST_VIEW);
  });

  test.afterEach(async () => {
    await scheduler.cleanup();
  });
});
