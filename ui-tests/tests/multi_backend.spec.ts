import { expect, test } from '@jupyterlab/galata';
import { SchedulerHelper } from '../helpers/SchedulerHelper';

/**
 * Tests for multi-backend support.
 * Note: No snapshot tests as requested.
 */

test.use({ autoGoto: false });

test.describe('Multi-Backend Support', () => {
  let scheduler: SchedulerHelper;

  test.beforeEach(async ({ page }, testInfo) => {
    scheduler = new SchedulerHelper(page, testInfo);
    await page.goto();
  });

  test('backend picker is hidden with single backend', async ({ page }) => {
    // Create notebook and open create job view
    await scheduler.createNotebook();
    await scheduler.createJobTbutton.click();
    await page.waitForSelector('text=Loading …', { state: 'hidden' });

    // Backend picker should NOT be visible when only one backend is configured
    // The component returns null when backendList.length === 1
    const backendPicker = page.locator('select[name="backend"]');
    await expect(backendPicker).not.toBeVisible();
  });

  test('create job form loads successfully', async ({ page }) => {
    await scheduler.createNotebook();
    await scheduler.createJobTbutton.click();
    await page.waitForSelector('text=Loading …', { state: 'hidden' });

    // Verify create job form elements are visible
    const jobNameInput = page.locator('input[name="jobName"]');
    await expect(jobNameInput).toBeVisible();

    const inputFileField = page.locator('input[name="inputFile"]');
    await expect(inputFileField).toBeVisible();

    const createButton = page.locator('button:has-text("Create")');
    await expect(createButton).toBeVisible();
  });

  test('job creation works with default backend', async ({ page }) => {
    await scheduler.createNotebook();
    await scheduler.createJobFromFilebrowser({ name: 'TestBackendJob' });

    // Wait for job list to appear
    await page.waitForSelector('text=TestBackendJob');

    // Verify job appears in the list
    const jobRow = page.locator('tr:has-text("TestBackendJob")');
    await expect(jobRow).toBeVisible();
  });

  test('backend API returns expected response', async ({ page }) => {
    // Intercept the backends API call
    const backendsResponse = await page.waitForResponse(
      response =>
        response.url().includes('/scheduler/backends') &&
        response.status() === 200
    );

    const backends = await backendsResponse.json();

    // Verify response structure
    expect(Array.isArray(backends)).toBe(true);
    expect(backends.length).toBeGreaterThanOrEqual(1);

    // Verify default backend is present
    const defaultBackend = backends.find(
      (b: { is_default: boolean }) => b.is_default
    );
    expect(defaultBackend).toBeDefined();
    expect(defaultBackend.id).toBe('local');
    expect(defaultBackend.name).toBe('Local Execution');
  });

  test('job creation includes backend in request', async ({ page }) => {
    await scheduler.createNotebook();
    await scheduler.openCreateJobFromFilebrowser();

    // Fill in job name
    await page.fill('input[name=jobName]', 'BackendTestJob');

    // Intercept the job creation request
    const [createRequest] = await Promise.all([
      page.waitForRequest(
        request =>
          request.url().includes('/scheduler/jobs') &&
          request.method() === 'POST'
      ),
      page.click('button:has-text("Create")')
    ]);

    // Verify the request includes backend field
    const postData = createRequest.postDataJSON();
    expect(postData).toHaveProperty('backend');
    expect(postData.backend).toBe('local');
  });

  test.afterEach(async () => {
    await scheduler.cleanup();
  });
});
