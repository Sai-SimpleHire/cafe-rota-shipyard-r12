import { expect, test } from '@playwright/test';

import {
  addShift,
  addStaff,
  dayOf,
  expectFitsPhone,
  findStaffRow,
  firstSignIn,
  freshMonday,
  OWN_PASSWORD,
  publishWeek,
  signIn,
  signInAsManager,
  STARTING_PASSWORD,
} from './rota';

/**
 * Core flow 3: a staff member signs in and sees only their own published
 * shifts, soonest first.
 */

test('first sign-in asks for their own password, and the starting one stops working', async ({
  browser,
}) => {
  const manager = await signInAsManager(browser);
  const ana = await addStaff(manager, 'Ana');
  const page = await firstSignIn(browser, ana);
  await expect(page.getByText(/No shifts coming up/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Plan the week' })).toHaveCount(0);
  await expectFitsPhone(page);

  const again = await (await browser.newContext()).newPage();
  await signIn(again, ana.email, STARTING_PASSWORD);
  await expect(
    again.getByText('That email address and password do not go together.'),
  ).toBeVisible();
  await signIn(again, ana.email, OWN_PASSWORD);
  await expect(again).toHaveURL(/\/shifts/);

  await manager.goto('/staff');
  await expect(await findStaffRow(manager, ana.name)).toContainText('Active');
});

test('staff see only their own shifts, soonest first', async ({ browser }) => {
  const manager = await signInAsManager(browser);
  const ben = await addStaff(manager, 'Ben');
  const cat = await addStaff(manager, 'Cat');

  const monday = freshMonday();
  // Added out of order on purpose.
  await addShift(manager, { day: dayOf(monday, 5), starts: '12:00', ends: '18:00', who: ben });
  await addShift(manager, { day: dayOf(monday, 1), starts: '08:00', ends: '14:00', who: ben });
  await addShift(manager, { day: dayOf(monday, 1), starts: '06:00', ends: '11:00', who: cat });
  await publishWeek(manager, monday);

  const page = await firstSignIn(browser, ben);
  const cards = page.getByRole('list', { name: 'Your shifts' }).getByRole('listitem');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText('08:00–14:00');
  await expect(cards.nth(0)).toContainText(/^Tue /);
  await expect(cards.nth(1)).toContainText('12:00–18:00');
  await expect(cards.nth(1)).toContainText(/^Sat /);
  await expect(page.getByText('06:00–11:00')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Ask to swap/ })).toHaveCount(2);
  await expectFitsPhone(page);
});
