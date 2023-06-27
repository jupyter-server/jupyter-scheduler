import { Page } from '@playwright/test';

/**
 * Helper class for Jupyter Scheduler testing in JupyterLab
 */
export class SchedulerHelper {
  constructor(readonly page: Page) { }

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
