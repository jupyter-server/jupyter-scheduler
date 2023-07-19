import { expect, test } from '@jupyterlab/galata';
import { SchedulerHelper } from '../helpers/SchedulerHelper';

const CREATE_FROM_NOTEBOOK_SNAPSHOT_FILENAME = 'create-view-from-toolbar.png';
const CREATE_VIEW_SNAPSHOT_FILENAME = 'create-view-empty.png';
const LAUNCHER_SNAPSHOT_FILENAME = 'launcher-with-scheduler.png';
const LIST_VIEW_IN_PROGRESS_SNAPSHOT_FILENAME = 'list-view-in-progress.png';
const NOTEBOOK_SNAPSHOT_FILENAME = 'notebook-with-createjob-button.png';
const RIGHTCLICK_MENU_SNAPSHOT_FILENAME =
  'filebrowser-notebook-rightclick-menu.png';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test.describe('Jupyter Scheduler integration tests for JupyterLab', () => {
  let schedulerHelper: SchedulerHelper;
  test.beforeEach(async ({ page }) => {
    schedulerHelper = new SchedulerHelper(page);
    await page.goto();
    await page.sidebar.close(
      (await page.sidebar.getTabPosition('filebrowser')) ?? undefined
    );
  });

  test('"Notebook Jobs" card is visible in JupyterLab launcher', async ({
    page
  }) => {
    const launcher = page.locator('div[role="main"] >> text=Launcher');
    await launcher.waitFor();
    const launcherCard = schedulerHelper.launcherCardLocator;

    await expect(launcherCard).toBeVisible();
    expect(await page.screenshot()).toMatchSnapshot(LAUNCHER_SNAPSHOT_FILENAME);
  });

  test('"Create a notebook job" button in notebook toolbar is visible', async ({
    page
  }) => {
    await page.notebook.createNew();
    await page
      .locator('.jp-DebuggerBugButton[aria-disabled="false"]')
      .waitFor();
    await page
      .locator('.jp-Notebook-ExecutionIndicator[data-status="idle"]')
      .waitFor();
    const createJobButton = schedulerHelper.notebookToolbarButtonLocator;

    await expect(createJobButton).toBeVisible();
    expect(await page.screenshot()).toMatchSnapshot(NOTEBOOK_SNAPSHOT_FILENAME);
    await page.menu.clickMenuItem('File>Save Notebook');
    await page.click('button:has-text("Rename")');
  });

  test('"Create a notebook job" button in notebook toolbar leads to "Create a Job" page', async ({
    page
  }) => {
    await page.sidebar.openTab('filebrowser');
    expect(await page.sidebar.isTabOpen('filebrowser')).toBeTruthy();
    await page.filebrowser.refresh();
    await page.dblclick('.jp-DirListing-item[data-file-type="notebook"]');
    await page.sidebar.close(
      (await page.sidebar.getTabPosition('filebrowser')) ?? undefined
    );
    const createJobButton = schedulerHelper.notebookToolbarButtonLocator;
    await createJobButton.click();
    await page.waitForSelector('text=Loading …', { state: 'hidden' });

    await page.waitForSelector('text=Saving Completed', { state: 'hidden' });
    expect(await page.screenshot()).toMatchSnapshot(
      CREATE_FROM_NOTEBOOK_SNAPSHOT_FILENAME
    );
  });

  test('"Create Notebook Job" item is visible when right clicking a notebook in File Browser', async ({
    page
  }) => {
    await page.sidebar.openTab('filebrowser');
    expect(await page.sidebar.isTabOpen('filebrowser')).toBeTruthy();
    await page.filebrowser.refresh();
    await page.click('.jp-DirListing-item[data-file-type="notebook"]', {
      button: 'right'
    });

    expect(await page.menu.isAnyOpen()).toBe(true);
    const righClickMenu = page.locator('ul.lm-Menu-content[role="menu"]');
    const createJobItem = schedulerHelper.filebrowserMenuItemLocator;
    await expect(createJobItem).toBeVisible();
    expect(await righClickMenu.screenshot()).toMatchSnapshot(
      RIGHTCLICK_MENU_SNAPSHOT_FILENAME
    );
  });

  test('"Create Notebook Job" button from File Browser right-click menu leads to "Create a Job" page', async ({
    page
  }) => {
    await page.sidebar.openTab('filebrowser');
    expect(await page.sidebar.isTabOpen('filebrowser')).toBeTruthy();
    await page.filebrowser.refresh();
    await page.click('.jp-DirListing-item[data-file-type="notebook"]', {
      button: 'right'
    });
    expect(await page.menu.isAnyOpen()).toBe(true);
    const createJobItem = schedulerHelper.filebrowserMenuItemLocator;
    await createJobItem.click();
    await page.waitForSelector('text=Loading …', { state: 'hidden' });
    await page.sidebar.close(
      (await page.sidebar.getTabPosition('filebrowser')) ?? undefined
    );

    expect(await page.screenshot()).toMatchSnapshot(
      CREATE_VIEW_SNAPSHOT_FILENAME
    );
  });

  test('Create a job and see it in the list of jobs', async ({ page }) => {
    await page.sidebar.openTab('filebrowser');
    await page.filebrowser.refresh();
    await page.click('.jp-DirListing-item[data-file-type="notebook"]', {
      button: 'right'
    });
    const createJobItem = schedulerHelper.filebrowserMenuItemLocator;
    await createJobItem.click();
    await page.waitForSelector('text=Loading', { state: 'hidden' });

    await page.fill('input[name=jobName]', 'MyTestJob');
    await page.click('button:has-text("Create")');
    const jobNameLink = page.getByText('MyTestJob', { exact: true });
    jobNameLink.waitFor();
    await page.sidebar.close(
      (await page.sidebar.getTabPosition('filebrowser')) ?? undefined
    );
    const timeStamp = schedulerHelper.timestampLocator;
    const contentPanel = page.locator('#jp-main-content-panel');

    await expect(contentPanel).toHaveScreenshot(
      LIST_VIEW_IN_PROGRESS_SNAPSHOT_FILENAME,
      {
        mask: [timeStamp],
        maskColor: 'white',
        maxDiffPixelRatio: 0.01
      }
    );
  });
});
