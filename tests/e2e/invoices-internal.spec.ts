import test, { expect } from '@playwright/test';
import { login, permissions } from '$tests/e2e/helpers';

test('internal invoice create route renders and save is gated by contact', async ({ page }) => {
    const { clear, save, set } = permissions(page);

    await login(page);
    await clear('invoices@example.com');
    await set('create_invoice', 'create_client', 'view_client');
    await save();

    await page
        .locator('[data-cy="navigationBar"]')
        .getByRole('link', { name: 'Invoices', exact: true })
        .click();

    await page
        .getByRole('main')
        .getByRole('link', { name: 'New Invoice' })
        .click();

    // Navigate to dedicated internal form route
    await page.goto('/invoices/create/internal');

    await expect(page.locator('#internal-invoice-banner')).toBeVisible();
    await expect(page.locator('[data-cy="internalClientHint"]')).toBeVisible();

    // Select first internal client option (list filtered to internal only)
    await page.getByRole('combobox').first().click();
    await page.getByRole('option').first().click();

    // Save should be disabled until a contact is checked
    await expect(
        page
            .locator('[data-cy="topNavbar"]')
            .getByRole('button', { name: 'Save', exact: true })
    ).toBeDisabled();

    // Select first contact checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();

    await expect(
        page
            .locator('[data-cy="topNavbar"]')
            .getByRole('button', { name: 'Save', exact: true })
    ).toBeEnabled();
});

test('internal invoice via query param shows banner and gating', async ({ page }) => {
    const { clear, save, set } = permissions(page);

    await login(page);
    await clear('invoices@example.com');
    await set('create_invoice', 'create_client', 'view_client');
    await save();

    await page
        .locator('[data-cy="navigationBar"]')
        .getByRole('link', { name: 'Invoices', exact: true })
        .click();

    await page
        .getByRole('main')
        .getByRole('link', { name: 'New Invoice' })
        .click();

    await page.goto('/invoices/create?internal=true');

    await expect(page.locator('#internal-invoice-banner')).toBeVisible();
    await expect(page.locator('[data-cy="internalClientHint"]')).toBeVisible();

    await page.getByRole('combobox').first().click();
    await page.getByRole('option').first().click();

    await expect(
        page
            .locator('[data-cy="topNavbar"]')
            .getByRole('button', { name: 'Save', exact: true })
    ).toBeDisabled();

    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();

    await expect(
        page
            .locator('[data-cy="topNavbar"]')
            .getByRole('button', { name: 'Save', exact: true })
    ).toBeEnabled();
});


