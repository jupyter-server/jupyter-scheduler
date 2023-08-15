import { expect, IJupyterLabPageFixture } from '@jupyterlab/galata';
import type { Locator, TestInfo } from '@playwright/test';

enum SELECTORS {
  // tbutton = toolbar button
  CREATE_JOB_TBUTTON = 'button.jp-ToolbarButtonComponent[data-command="scheduling:create-from-notebook"][title="Create a notebook job"]',
  LAUNCHER_CARD = 'div.jp-LauncherCard[title="Notebook Jobs"]',
  LIST_VIEW_TIMES = 'td.MuiTableCell-body:has-text(" AM"), td.MuiTableCell-body:has-text(" PM")',
  NOTEBOOK_TOOLBAR = '.jp-NotebookPanel-toolbar[aria-label="notebook actions"]',
  ENABLE_DEBUGGER_TBUTTON = '.jp-DebuggerBugButton',
  KERNEL_NAME_TBUTTON = '.jp-KernelName',
  EXECUTION_INDICATOR_TBUTTON = '.jp-Notebook-ExecutionIndicator'
}

type SnapshotOptions = {
  /**
   * Crops the screenshot to a locator. Uses the current main area widget
   * locator by default.
   */
  locator?: Locator;
  /**
   * Closes the filebrowser when true. True by default.
   */
  closeFb: boolean;
  /**
   * List of locators to mask in the screenshot. See
   * https://playwright.dev/docs/api/class-page#page-screenshot-option-mask.
   */
  mask?: Locator[];
};

const DEFAULT_SNAPSHOT_OPTS: SnapshotOptions = {
  closeFb: true
};

type CreateJobOptions = {
  /**
   * Name of the job.
   */
  name: string;
};

const DEFAULT_CREATE_JOB_OPTS: CreateJobOptions = {
  name: 'MyTestJob'
};

/**
 * Helper class for Jupyter Scheduler testing in JupyterLab
 */
export class SchedulerHelper {
  constructor(
    readonly page: IJupyterLabPageFixture,
    readonly testInfo: TestInfo
  ) {}

  /**
   * JupyterLab launcher "Notebook Jobs" card locator
   */
  get launcherCard() {
    return this.page.locator(SELECTORS.LAUNCHER_CARD);
  }

  /**
   *  Locates notebook toolbar
   */
  get notebookToolbar() {
    return this.page.locator(SELECTORS.NOTEBOOK_TOOLBAR);
  }

  /**
   *  Locates "Create a notebook job" button in notebook toolbar
   */
  get createJobTbutton() {
    return this.page.locator(SELECTORS.CREATE_JOB_TBUTTON);
  }

  /**
   *  Locates "Enable debugger" icon in notebook toolbar
   */
  get enableDebuggerTbutton() {
    return this.page.locator(SELECTORS.ENABLE_DEBUGGER_TBUTTON);
  }

  /**
   *  Locates kernel name button in notebook toolbar
   */
  get kernelNameTbutton() {
    return this.page.locator(SELECTORS.KERNEL_NAME_TBUTTON);
  }

  /**
   *  Locates execution indicator icon in notebook toolbar
   */
  get executionIndicatorTbutton() {
    return this.page.locator(SELECTORS.EXECUTION_INDICATOR_TBUTTON);
  }

  /**
   * Locates the previously created notebook's listing in the filebrowser.
   */
  get notebookFbListing() {
    if (this._nbName == null) {
      throw Error(
        'Notebook was not created via scheduler.createNotebook() prior.'
      );
    }

    return this.page
      .locator('.jp-DirListing-item[data-file-type="notebook"]')
      .getByText(this._nbName);
  }

  /**
   * Locates the column of timestamps in the list view. Used to mask this column
   * during snapshot tests.
   */
  get timestamp() {
    return this.page.locator(SELECTORS.LIST_VIEW_TIMES);
  }

  /**
   * Opens create job view from the filebrowser context menu.
   */
  async openCreateJobFromFilebrowser() {
    await this.page.sidebar.openTab('filebrowser');
    await this.notebookFbListing.click({ button: 'right' });
    await this.page.getByText('Create Notebook Job').click();
    await this._waitForCreateJobLoaded();
  }

  /**
   * Creates a job from the filebrowser context menu. Fills in default values
   * for all required fields. See `CreateJobOptions` for more configuration
   * options.
   */
  async createJobFromFilebrowser(customOpts?: Partial<CreateJobOptions>) {
    const opts: CreateJobOptions = {
      ...DEFAULT_CREATE_JOB_OPTS,
      ...customOpts
    };
    await this.openCreateJobFromFilebrowser();
    await this.page.fill('input[name=jobName]', opts.name);
    await this.page.click('button:has-text("Create")');
  }

  /**
   * Opens create job view from the notebook toolbar button.
   */
  async openCreateJobFromTbutton() {
    await this.createJobTbutton.click();
    await this._waitForCreateJobLoaded();
  }

  /**
   * Creates a notebook, optionally closing the tab after.
   */
  async createNotebook(keepOpen = true) {
    this._nbName = await this.page.notebook.createNew();
    await this.page.notebook.save();
    if (!keepOpen) {
      await this.closeAllTabs();
    }
    return this._nbName;
  }

  /**
   * Cleans up the test environment by deleting any created notebooks.
   */
  async cleanup() {
    if (this._nbName) {
      await this.page.contents.deleteFile(this._nbName);
    }

    await this.closeAllTabs();
  }

  /**
   * Closes all tabs, handling dialogs if necessary. This is preferable to
   * `page.activity.closeAll()`, which does not handle confirmation dialogs.
   */
  async closeAllTabs() {
    await this.page.evaluate(async () => {
      await window.jupyterapp.commands.execute('application:close-all');
    });

    // if a dialog opens, close it
    try {
      await this.page.waitForSelector('.jp-Dialog', { timeout: 200 });
      await this.page.click('.jp-Dialog .jp-mod-accept');
    } catch (e) {
      return;
    }
  }

  /**
   * Asserts a screenshot against the snapshot at `filename`. By default, this
   * method closes the sidebar prior to taking the screenshot. See
   * `SnapshotOptions` for more configuration options.
   */
  async assertSnapshot(
    filename: string,
    customOpts?: Partial<SnapshotOptions>
  ) {
    const opts: SnapshotOptions = { ...DEFAULT_SNAPSHOT_OPTS, ...customOpts };
    if (opts.closeFb) {
      await this.page.sidebar.close('left');
    }

    const target =
      opts.locator ||
      this.page.locator('.jp-MainAreaWidget:not(.lm-mod-hidden)');
    await target.waitFor({ state: 'visible' });
    const screenshotArgs = {
      mask: opts.mask
    };
    expect(await target.screenshot(screenshotArgs)).toMatchSnapshot(filename);
  }

  async standardizeListCreateTime() {
    await this.page.route('**/scheduler/*', async (route, req) => {
      if (req.url().includes('max_items')) {
        const res = await route.fetch();
        const json = await res.json();
        json.jobs[0].create_time = 1;
        route.fulfill({
          status: res.status(),
          headers: res.headers(),
          body: JSON.stringify(json)
        });
      }
    });
  }

  protected async _waitForCreateJobLoaded() {
    await this.page.waitForSelector('text=Loading …', { state: 'hidden' });
  }

  protected _nbName: string | null = null;
}
