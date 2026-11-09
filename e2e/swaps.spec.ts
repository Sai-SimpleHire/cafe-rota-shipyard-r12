import { expect, test, type Browser } from '@playwright/test';

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
 * Core flow 4: a staff member asks to swap a shift with a named colleague; the
 * manager approves or turns it down, and the rota changes only on approval.
 */

async function setUpSwap(browser: Browser, time: { starts: string; ends: string }) {
  const manager = await signInAsManager(browser);
  const asker = await addStaff(manager, 'Dee');
  const colleague = await addStaff(manager, 'Eli');
  const monday = freshMonday();
  await addShift(manager, { day: dayOf(monday, 3), ...time, who: asker });
  await publishWeek(manager, monday);

  const askerPage = await firstSignIn(browser, asker);
  const colleaguePage = await firstSignIn(browser, colleague);

  const range = `${time.starts}–${time.ends}`;
  const card = askerPage.getByRole('listitem').filter({ hasText: range });
  await card.getByRole('button', { name: /Ask to swap/ }).click();
  const dialog = askerPage.getByRole('dialog', { name: /^Swap Thu / });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Who should take it?').selectOption({ label: colleague.name });
  await dialog.getByRole('button', { name: 'Send to the manager' }).click();
  await expect(dialog).toBeHidden();
  await expect(card).toContainText(`Swap with ${colleague.name} — waiting for the manager`);
  await expect(card.getByRole('button', { name: /Ask to swap/ })).toHaveCount(0);

  // Nothing has changed on the rota yet.
  await expect(colleaguePage.getByText(range)).toHaveCount(0);

  await manager.goto('/swaps');
  const row = manager.getByRole('row', { name: new RegExp(`${asker.name}.*${colleague.name}`) });
  await expect(row).toContainText('Waiting for you');
  return { manager, askerPage, colleaguePage, row, range, card };
}

test('an approved swap moves the shift to the colleague', async ({ browser }) => {
  const swap = await setUpSwap(browser, { starts: '09:00', ends: '15:00' });
  await expectFitsPhone(swap.askerPage);

  await swap.row.getByRole('button', { name: /^Approve/ }).click();
  await expect(swap.row).toContainText('Approved');
  await expect(swap.row.getByRole('button')).toHaveCount(0);

  await swap.colleaguePage.reload();
  await expect(swap.colleaguePage.getByText(swap.range)).toBeVisible();
  await swap.askerPage.reload();
  await expect(swap.askerPage.getByText(swap.range)).toHaveCount(0);
});

test('a turned-down swap leaves the rota as it was', async ({ browser }) => {
  const swap = await setUpSwap(browser, { starts: '11:00', ends: '17:00' });

  await swap.row.getByRole('button', { name: /^Turn down/ }).click();
  await expect(swap.row).toContainText('Turned down');

  await swap.askerPage.reload();
  await expect(swap.card).toContainText('turned down');
  await expect(swap.card.getByRole('button', { name: /Ask to swap/ })).toBeVisible();
  await swap.colleaguePage.reload();
  await expect(swap.colleaguePage.getByText(swap.range)).toHaveCount(0);
});
