import { expect, test } from '@jupyterlab/galata';
import { SchedulerHelper } from '../helpers/SchedulerHelper';

enum FILENAMES {
  LAUNCHER = 'launcher.png',
  NOTEBOOK_TOOLBAR = 'notebook-toolbar.png',
  FILEBROWSER_MENU = 'filebrowser-menu.png',
  // TODO: resolve this inconsistency in our frontend code. One entry point
  // includes the file extension in the job name, the other does not.
  CREATE_VIEW_FROM_TOOLBAR = 'create-view-from-toolbar.png',
  CREATE_VIEW_FROM_FILEBROWSER = 'create-view-from-filebrowser.png',
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
      mask: [scheduler.enableDebuggerTbutton, scheduler.kernelNameTbutton, scheduler.executionIndicatorTbutton]
    });
  });

  test('opens create job view from notebook toolbar', async ({ page }) => {
    await scheduler.createNotebook();
    await scheduler.createJobTbutton.click();
    await page.waitForSelector('text=Loading …', { state: 'hidden' });
    await page.waitForSelector('text=Saving Completed', { state: 'hidden' });
    await scheduler.assertSnapshot(FILENAMES.CREATE_VIEW_FROM_TOOLBAR);
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
    await scheduler.assertSnapshot(FILENAMES.CREATE_VIEW_FROM_FILEBROWSER);
  });

  test('shows newly created job in job list view', async () => {
    await scheduler.createNotebook();
    await scheduler.createJobFromFilebrowser();

    const timeStamp = scheduler.timestampLocator;
    await scheduler.assertSnapshot(FILENAMES.LIST_VIEW, {
      mask: [timeStamp]
    });
  });

  test.afterEach(async () => {
    await scheduler.cleanup();
  });
});
