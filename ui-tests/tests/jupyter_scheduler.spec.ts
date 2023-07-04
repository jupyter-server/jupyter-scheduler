import { expect, test } from '@jupyterlab/galata';
import { SchedulerHelper } from '../helpers/SchedulerHelper';

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
    await page.sidebar.close(await page.sidebar.getTabPosition('filebrowser') ?? undefined);
  });

  test('"Notebook Jobs" card is visible in JupyterLab launcher', async ({
    page
  }) => {
    const launcher = page.locator('div[role="main"] >> text=Launcher');
    await launcher.waitFor();
    const launcherCard = schedulerHelper.launcherCardLocator;
    const launcherSnapshot = 'launcher-with-scheduler.png';

    await expect(launcherCard).toBeVisible();
    expect(await page.screenshot()).toMatchSnapshot(launcherSnapshot);
  });

  test('"Create a notebook job" button is visible in notebook toolbar and leads to "Create a Job" page', async ({
    page
  }) => {
    await page.notebook.createNew();
    await page.locator('.jp-DebuggerBugButton[aria-disabled="false"]').waitFor();
    await page.locator('.jp-Notebook-ExecutionIndicator[data-status="idle"]').waitFor();
    const createJobButton = schedulerHelper.notebookToolbarButtonLocator;
    const notebookSnapshot = 'notebook-with-createjob-button.png';
    const createViewSnapshot = 'create-view-from-toolbar.png';

    await expect(createJobButton).toBeVisible();
    expect(await page.screenshot()).toMatchSnapshot(notebookSnapshot);
    await page.menu.clickMenuItem('File>Save Notebook');
    await page.click('button:has-text("Rename")');
    await createJobButton.click();

    await page.waitForSelector('text=Loading …', { state: 'hidden'});

    await page.waitForSelector('text=Saving Completed', { state: 'hidden'});
    expect(await page.screenshot()).toMatchSnapshot(createViewSnapshot);
  });

  test('"Create Notebook Job" item is visible when right clicking a notebook in File Browser and leads to "Create a Job" page', async ({
    page
  }) => {
    await page.sidebar.openTab('filebrowser');
    expect(await page.sidebar.isTabOpen('filebrowser')).toBeTruthy();
    await page.filebrowser.refresh();
    await page.click('.jp-DirListing-item[data-file-type="notebook"]', { button : 'right'});

    expect(await page.menu.isAnyOpen()).toBe(true);
    const righClickMenu = page.locator('ul.lm-Menu-content[role="menu"]');
    const createJobItem = schedulerHelper.filebrowserMenuItemLocator;
    const righClickMenuSnapshot = 'filebrowser-notebook-rightclick-menu.png';
    await expect(createJobItem).toBeVisible();
    expect(await righClickMenu.screenshot()).toMatchSnapshot(righClickMenuSnapshot);

    await createJobItem.click();
    await page.waitForSelector('text=Loading …', { state: 'hidden'});
    const createViewSnapshot = 'create-view-empty.png';
    await page.sidebar.close(await page.sidebar.getTabPosition('filebrowser') ?? undefined);
    expect(await page.screenshot()).toMatchSnapshot(createViewSnapshot);
  });

  test('Create a job and see it in the list of jobs', async ({
    page
  }) => {
    await page.sidebar.openTab('filebrowser');
    await page.filebrowser.refresh();
    await page.click('.jp-DirListing-item[data-file-type="notebook"]', { button : 'right'});
    const createJobItem = schedulerHelper.filebrowserMenuItemLocator;
    await createJobItem.click();
    await page.waitForSelector('text=Loading', { state: 'hidden'});

    await page.fill('input[name=jobName]', 'MyTestJob');
    await page.click('button:has-text("Create")');
    const jobNameLink = page.getByText('MyTestJob', { exact: true });
    jobNameLink.waitFor();
    await page.sidebar.close(await page.sidebar.getTabPosition('filebrowser') ?? undefined);
    const timeStamp = schedulerHelper.timestampLocator
    const listViewSnapshot = 'list-view-in-progress.png';
    const contentPanel = page.locator('#jp-main-content-panel');
    await expect(contentPanel).toHaveScreenshot(listViewSnapshot, {mask: [timeStamp], maskColor: "white"});

    const emptyListViewSnapshot = 'list-view-in-empty.png';
    await page.click('button[title*="Delete"]');
    await page.click('text=Delete');
    await page.waitForSelector('a:has-text("MyTestJob")', { state: 'hidden'});
    expect(await page.screenshot()).toMatchSnapshot(emptyListViewSnapshot);
  });
});
