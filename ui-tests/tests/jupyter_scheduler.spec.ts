import { expect, test } from '@jupyterlab/galata';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test('Should add a Notebook Jobs card to JupyterLab launcher', async ({
  page
}) => {
  await page.waitForSelector('div[role="main"] >> text=Launcher');
  expect(page.getByTitle('Notebook Job')).toBeDefined();
});
