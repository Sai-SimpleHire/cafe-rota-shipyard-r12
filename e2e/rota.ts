import { expect, type Browser, type Locator, type Page } from '@playwright/test';

/**
 * Shared steps for the café rota's browser checks.
 *
 * The very first account in an empty café becomes its manager, so every check
 * goes through `signInAsManager`, which creates that account if it is not
 * there yet and signs in with it if it is. Everything else a check needs
 * (staff, shifts, swaps) it makes itself, with names nobody else uses.
 */

export const MANAGER = { email: 'manager@cafe-rota.test', password: 'Espresso-Bar-2026' };
export const STARTING_PASSWORD = 'Flat-white-2026';
export const OWN_PASSWORD = 'Oat-latte-9876!';

/** A short tag that makes this run's names and emails its own. */
export function uniqueTag(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function signInAsManager(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  // 201 when this makes the manager, 409 when an earlier check already did.
  const made = await page.request.post('/api/auth/register', { data: MANAGER });
  expect([201, 409], 'the manager account exists').toContain(made.status());
  await signIn(page, MANAGER.email, MANAGER.password);
  await expect(page).toHaveURL(/\/plan/);
  return page;
}

export interface StaffMember {
  name: string;
  email: string;
}

/** The manager adds a staff member on the Staff screen. */
export async function addStaff(manager: Page, firstName: string): Promise<StaffMember> {
  const tag = uniqueTag();
  const person = {
    name: `${firstName} ${tag}`,
    email: `${firstName.toLowerCase()}.${tag}@cafe.test`,
  };
  await manager.goto('/staff');
  await manager.getByLabel('Name').fill(person.name);
  await manager.getByLabel('Email address').fill(person.email);
  await manager.getByLabel('Starting password').fill(STARTING_PASSWORD);
  await manager.getByRole('button', { name: 'Add to staff' }).click();
  await expect(manager.getByText(`${person.name} is on the staff list.`)).toBeVisible();
  await expect(await findStaffRow(manager, person.name)).toBeVisible();
  return person;
}

/**
 * Rows of the staff list matching this text, found the way a manager with a
 * long list would: by typing it in the list's search box.
 */
export async function findStaffRow(manager: Page, text: string): Promise<Locator> {
  await manager.getByRole('searchbox', { name: 'Search' }).fill(text);
  return manager.getByRole('row', { name: new RegExp(text) });
}

/** A staff member's first sign-in: they choose their own password and land on My shifts. */
export async function firstSignIn(browser: Browser, person: StaffMember): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await signIn(page, person.email, STARTING_PASSWORD);
  await expect(page).toHaveURL(/\/change-password/);
  await page.getByLabel('New password').fill(OWN_PASSWORD);
  await page.getByLabel('Type it again').fill(OWN_PASSWORD);
  await page.getByRole('button', { name: 'Save my password' }).click();
  await expect(page).toHaveURL(/\/shifts/);
  await expect(page.getByRole('heading', { name: 'My shifts' })).toBeVisible();
  return page;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * A Monday far enough ahead that no other check plans it, and every shift in it
 * is still to come.
 */
export function freshMonday(): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const weeksAhead = 20 + Math.floor(Math.random() * 1500);
  date.setUTCDate(date.getUTCDate() + weeksAhead * 7);
  const sinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - sinceMonday);
  return isoDate(date);
}

export function dayOf(monday: string, offset: number): string {
  const date = new Date(`${monday}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return isoDate(date);
}

/** The manager adds one shift on Plan the week. */
export async function addShift(
  manager: Page,
  shift: { day: string; starts: string; ends: string; who: StaffMember },
): Promise<void> {
  await manager.goto(`/plan?week=${shift.day}`);
  await manager.getByLabel('Day').selectOption(shift.day);
  await manager.getByLabel('Starts').fill(shift.starts);
  await manager.getByLabel('Ends').fill(shift.ends);
  await manager.getByLabel('Who').selectOption({ label: shift.who.name });
  await manager.getByRole('button', { name: 'Add shift' }).click();
  const time = `${shift.starts}–${shift.ends}`;
  await expect(
    manager.getByRole('row', { name: new RegExp(`${time}.*${shift.who.name}`) }),
  ).toBeVisible();
}

export async function publishWeek(manager: Page, monday: string): Promise<void> {
  await manager.goto(`/plan?week=${monday}`);
  await manager.getByRole('button', { name: 'Publish this week' }).click();
  await expect(manager.getByText('Published — staff can see this week.')).toBeVisible();
}

/** The page is no wider than a 390 px phone. */
export async function expectFitsPhone(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  const { content, screen } = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    screen: window.innerWidth,
  }));
  expect(content, 'the page is no wider than a 390 px phone').toBeLessThanOrEqual(screen + 1);
}
