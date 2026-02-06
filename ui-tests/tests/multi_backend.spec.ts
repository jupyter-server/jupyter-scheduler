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
    // Make a direct API request to verify response (avoids race with page load)
    const response = await page.request.get(
      `${page.url().split('/lab')[0]}/scheduler/backends`
    );
    expect(response.ok()).toBe(true);
    const backends = await response.json();

    // Verify response structure
    expect(Array.isArray(backends)).toBe(true);
    expect(backends.length).toBeGreaterThanOrEqual(1);

    // Verify first backend is jupyter_server_nb (server returns sorted alphabetically)
    const firstBackend = backends[0];
    expect(firstBackend.id).toBe('jupyter_server_nb');
    expect(firstBackend.name).toBe('Jupyter Server Notebook');

    // Verify backend has required fields (no is_default)
    expect(firstBackend).toHaveProperty('id');
    expect(firstBackend).toHaveProperty('name');
    expect(firstBackend).toHaveProperty('file_extensions');
    expect(firstBackend).toHaveProperty('output_formats');
  });

  test.afterEach(async () => {
    await scheduler.cleanup();
  });
});

/**
 * Tests for multi-backend picker UI with mocked backends.
 * These tests mock the /scheduler/backends API to simulate multiple backends.
 */
test.describe('Multi-Backend Picker (Mocked)', () => {
  let scheduler: SchedulerHelper;

  const mockBackends = [
    {
      id: 'jupyter_server_nb',
      name: 'Jupyter Server Notebook',
      description: 'Execute notebooks locally',
      file_extensions: ['ipynb'],
      output_formats: [{ id: 'ipynb', label: 'Notebook', description: '' }]
    },
    {
      id: 'k8s_backend',
      name: 'Kubernetes',
      description: 'Execute notebooks on K8s cluster',
      file_extensions: ['ipynb'],
      output_formats: [{ id: 'ipynb', label: 'Notebook', description: '' }]
    }
  ];

  test.beforeEach(async ({ page }, testInfo) => {
    // Mock the backends API BEFORE navigating
    // Use URL predicate to handle query params (glob patterns don't match them)
    await page.route(
      url => url.pathname.endsWith('/scheduler/backends'),
      route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockBackends)
        });
      }
    );

    scheduler = new SchedulerHelper(page, testInfo);
    await page.goto();
  });

  test('backend picker visible with multiple backends', async ({ page }) => {
    await scheduler.createNotebook();
    await scheduler.openCreateJobFromFilebrowser();

    // MUI Select renders as a div with role="combobox"
    const backendSelect = page.locator('#jp-create-job-backend');
    await expect(backendSelect).toBeVisible();
    // With 2 backends, picker should be enabled
    await expect(backendSelect).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('backend picker shows all options', async ({ page }) => {
    await scheduler.createNotebook();
    await scheduler.openCreateJobFromFilebrowser();

    // Click to open the MUI Select dropdown
    await page.click('#jp-create-job-backend');

    // MUI Select options appear in a listbox
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();

    // Verify all backends are listed
    await expect(listbox.getByText('Jupyter Server Notebook')).toBeVisible();
    await expect(listbox.getByText('Kubernetes')).toBeVisible();
  });

  test('backend switching updates request payload', async ({ page }) => {
    await scheduler.createNotebook();
    await scheduler.openCreateJobFromFilebrowser();

    // Fill job name first
    await page.fill('input[name=jobName]', 'K8sJob');

    // Open backend picker and switch to K8s backend
    await page.click('#jp-create-job-backend');
    await page.getByRole('option', { name: 'Kubernetes' }).click();

    // Intercept the job creation request
    const [createRequest] = await Promise.all([
      page.waitForRequest(
        req => req.url().includes('/scheduler/jobs') && req.method() === 'POST'
      ),
      page.click('button:has-text("Create")')
    ]);

    // Verify the request uses the selected backend
    const postData = createRequest.postDataJSON();
    expect(postData.backend_id).toBe('k8s_backend');
  });

  test('backend description shown as helper text', async ({ page }) => {
    await scheduler.createNotebook();
    await scheduler.openCreateJobFromFilebrowser();

    // Default selection should show first backend's description
    await expect(page.getByText('Execute notebooks locally')).toBeVisible();

    // Switch to K8s backend
    await page.click('#jp-create-job-backend');
    await page.getByRole('option', { name: 'Kubernetes' }).click();

    // Description should update to K8s backend's description
    await expect(
      page.getByText('Execute notebooks on K8s cluster')
    ).toBeVisible();
  });

  test.afterEach(async () => {
    await scheduler.cleanup();
  });
});
