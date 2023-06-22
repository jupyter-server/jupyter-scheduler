import { expect, test } from '@jupyterlab/galata';

test('Should add a Notebook Jobs card to JupyterLab launcher', async ({
  page
}) => {
  await page.getByRole('tabpanel', { name: 'Launcher' }).waitFor({ state: 'detached' });
  expect(page.getByTitle('Notebook Jobs')).toBeDefined();
});
