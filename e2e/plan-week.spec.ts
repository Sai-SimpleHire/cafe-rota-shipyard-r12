import { expect, test } from '@playwright/test';

import {
  addShift,
  addStaff,
  dayOf,
  expectFitsPhone,
  firstSignIn,
  freshMonday,
  publishWeek,
  signInAsManager,
} from './rota';

/**
 * Core flow 2: the manager plans a week (day, start, end, who) and publishes
 * it. Staff cannot see a week until it is published.
 */

test('a new week starts as an empty draft', async ({ browser }) => {
  const manager = await signInAsManager(browser);
  const monday = freshMonday();
  await manager.goto(`/plan?week=${monday}`);
  await expect(manager.getByRole('heading', { name: /^Week of Mon / })).toBeVisible();
  await expect(manager.getByText('Draft')).toBeVisible();
  await expect(manager.getByText(/No shifts this week yet/)).toBeVisible();
  await expect(manager.getByRole('button', { name: 'Publish this week' })).toBeVisible();
  await expectFitsPhone(manager);
});

test('a shift that ends before it starts is refused', async ({ browser }) => {
  const manager = await signInAsManager(browser);
  await addStaff(manager, 'Robin');
  const monday = freshMonday();
  await manager.goto(`/plan?week=${monday}`);
  await manager.getByLabel('Starts').fill('15:00');
  await manager.getByLabel('Ends').fill('09:00');
  await manager.getByRole('button', { name: 'Add shift' }).click();
  await expect(manager.getByText('The shift has to end after it starts.')).toBeVisible();
  await expect(manager.getByText(/No shifts this week yet/)).toBeVisible();
});

test('staff see a planned shift only once the week is published', async ({ browser }) => {
  const manager = await signInAsManager(browser);
  const kim = await addStaff(manager, 'Kim');
  const kimPage = await firstSignIn(browser, kim);

  const monday = freshMonday();
  const wednesday = dayOf(monday, 2);
  await addShift(manager, { day: wednesday, starts: '07:30', ends: '13:00', who: kim });
  await expect(manager.getByText('Draft')).toBeVisible();

  // Still a draft: Kim sees nothing.
  await kimPage.reload();
  await expect(kimPage.getByText('07:30–13:00')).toHaveCount(0);

  await publishWeek(manager, monday);
  await expect(manager.getByText('Draft')).toHaveCount(0);
  await expect(manager.getByRole('button', { name: 'Publish this week' })).toHaveCount(0);

  await kimPage.reload();
  const card = kimPage.getByRole('listitem').filter({ hasText: '07:30–13:00' });
  await expect(card).toBeVisible();
  await expect(card).toContainText(/^Wed /);
});

test('the manager moves between weeks and removes a shift', async ({ browser }) => {
  const manager = await signInAsManager(browser);
  const lee = await addStaff(manager, 'Lee');
  const monday = freshMonday();
  await addShift(manager, { day: dayOf(monday, 4), starts: '10:00', ends: '16:00', who: lee });

  await manager.getByRole('link', { name: 'Next week →' }).click();
  await expect(manager).toHaveURL(new RegExp(`week=${dayOf(monday, 7)}`));
  await expect(manager.getByText(/No shifts this week yet/)).toBeVisible();
  await manager.getByRole('link', { name: '← Previous week' }).click();
  await expect(manager).toHaveURL(new RegExp(`week=${monday}`));

  await manager.getByRole('button', { name: new RegExp(`Remove ${lee.name}`) }).click();
  await expect(manager.getByText(/No shifts this week yet/)).toBeVisible();
});
