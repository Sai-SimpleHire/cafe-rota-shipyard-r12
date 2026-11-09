import { expect, test } from '@playwright/test';

import {
  addStaff,
  expectFitsPhone,
  findStaffRow,
  signIn,
  signInAsManager,
  STARTING_PASSWORD,
} from './rota';

/**
 * Core flow 1: the manager signs in, adds staff members with a starting
 * password, and removes someone who has left.
 */

test('the manager adds a staff member, who is waiting for their first sign-in', async ({
  browser,
}) => {
  const manager = await signInAsManager(browser);
  await expect(manager.getByRole('link', { name: 'Staff' })).toBeVisible();

  const sam = await addStaff(manager, 'Sam');
  const row = await findStaffRow(manager, sam.name);
  await expect(row).toContainText(sam.email);
  await expect(row).toContainText('Staff');
  await expect(row).toContainText('Waiting for first sign-in');

  // The manager's own row has no Remove button.
  const managerRow = await findStaffRow(manager, 'Manager');
  await expect(managerRow).toHaveCount(1);
  await expect(managerRow.getByRole('button', { name: /Remove/ })).toHaveCount(0);

  await expectFitsPhone(manager);
});

test('the manager removes someone who has left, and they can no longer sign in', async ({
  browser,
}) => {
  const manager = await signInAsManager(browser);
  const alex = await addStaff(manager, 'Alex');

  await manager.getByRole('button', { name: `Remove ${alex.name}` }).click();
  const dialog = manager.getByRole('dialog', { name: `Remove ${alex.name} from the café?` });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Their shifts stay on the rota');
  await dialog.getByRole('button', { name: `Remove ${alex.name}` }).click();

  await expect(dialog).toBeHidden();
  await expect(await findStaffRow(manager, alex.name)).toHaveCount(0);

  const gone = await (await browser.newContext()).newPage();
  await signIn(gone, alex.email, STARTING_PASSWORD);
  await expect(gone.getByText('That email address and password do not go together.')).toBeVisible();
  await expect(gone).toHaveURL(/\/sign-in/);
});

test('a starting password that is too weak is refused with a reason', async ({ browser }) => {
  const manager = await signInAsManager(browser);
  await manager.goto('/staff');
  await manager.getByLabel('Name').fill('Weak Password');
  await manager.getByLabel('Email address').fill('weak.password@cafe.test');
  await manager.getByLabel('Starting password').fill('coffee');
  await manager.getByRole('button', { name: 'Add to staff' }).click();
  await expect(manager.getByText(/^Starting password: Your password needs/)).toBeVisible();
  await expect(await findStaffRow(manager, 'Weak Password')).toHaveCount(0);
});

test('staff cannot open the manager’s screens', async ({ browser }) => {
  const manager = await signInAsManager(browser);
  const jo = await addStaff(manager, 'Jo');

  const page = await (await browser.newContext()).newPage();
  await signIn(page, jo.email, STARTING_PASSWORD);
  await expect(page).toHaveURL(/\/change-password/);

  // Even before choosing a password, the manager's screens send them away.
  for (const screen of ['/staff', '/plan', '/swaps']) {
    await page.goto(screen);
    await expect(page).not.toHaveURL(new RegExp(`${screen}$`));
  }
  const refused = await page.request.post('/api/staff', {
    data: { name: 'Sneaky', email: 'sneaky@cafe.test', password: STARTING_PASSWORD },
  });
  expect(refused.status()).toBe(403);
});
