<!-- shipyard:design -->

# project: design blueprint

*Shipyard writes the part between the `shipyard:design` markers from the approved pages, the theme and the installed parts, and rewrites it when they change. Add your decisions below the closing marker: they are kept.*

## Purpose

Plan a small cafe's weekly shifts, show each person their own shifts, and handle swap requests.

Used by: The café manager, who plans the week, and the staff, who need to know their own shifts and sometimes swap one.

## Flows

1. The manager signs in, adds staff members (name and email, with a starting password the staff member changes when they first sign in), and removes someone who ha
2. The manager plans a week: adds shifts (day, start time, end time, who is working), and publishes the week when it is ready. Staff cannot see a week until it is 
3. A staff member signs in and sees only their own published shifts, soonest first.
4. A staff member asks to swap one of their shifts with a named colleague. The manager approves or turns down the request, and the rota changes only when it is app

## Screens

1. **Sign in** (form) — Manager and staff sign in; a staff member changes their starting password the first time.
   One task, top to bottom: labels above fields, one primary button, errors next to the field. Buttons and messages from `ui_foundation`.
2. **Plan the week** (table) — The manager adds shifts for a week and publishes it.
   A list people scan, sort and filter. Use the data table if it is installed. Built with `data_table`.
3. **Staff** (table) — The manager adds and removes staff members.
   A list people scan, sort and filter. Use the data table if it is installed. Built with `data_table`.
4. **My shifts** (cards) — A staff member's own published shifts, soonest first, with a button to ask for a swap.
   A small number of items people compare at a glance, one card each.
5. **Swap requests** (table) — The manager approves or turns down swap requests.
   A list people scan, sort and filter. Use the data table if it is installed. Built with `data_table`.

## Frame and density

- Frame: a top bar with the app's name and one link per screen above (`ui_blocks` AppShell). No sidebar for this few screens.
- Each screen starts with its title and at most one primary action; other actions are quiet buttons.
- Lists are compact: one line per record, the columns people scan first on the left, actions at the end of the row.
- Forms are one column, labels above fields, the primary button at the end; errors sit next to their field.

## Tokens

Theme: **Calm** — The default. Quiet, high contrast, no personality — it gets out of the way.

Use these values through their CSS variables. Never write a colour, a radius or a spacing step by hand.

| Role | CSS variable | Light value |
| --- | --- | --- |
| bg | `var(--bg)` | `#ffffff` |
| surface | `var(--surface)` | `#f7f8fa` |
| fg | `var(--fg)` | `#14181f` |
| muted | `var(--muted)` | `#5b6472` |
| line | `var(--line)` | `#e3e7ec` |
| accent | `var(--accent)` | `#1f5fd0` |
| accentFg | `var(--accent-fg)` | `#ffffff` |
| focus | `var(--focus)` | `#1f5fd0` |
| ok | `var(--ok)` | `#e6f4ea` |
| okFg | `var(--ok-fg)` | `#1b5e34` |
| warn | `var(--warn)` | `#fdf3e0` |
| warnFg | `var(--warn-fg)` | `#7a4f0c` |
| danger | `var(--danger)` | `#fdecec` |
| dangerFg | `var(--danger-fg)` | `#96201f` |
| radius | `var(--radius)` | from the theme |
| space | `var(--space)` | from the theme |
| fontFamily | `var(--font-family)` | from the theme |
| fontSize | `var(--font-size)` | from the theme |
| lineHeight | `var(--line-height)` | from the theme |

The theme decides light and dark (dark follows the computer's setting, with the same variables). The page is `var(--bg)`; panels, cards and quiet buttons are `var(--surface)`. Those are the pairs the theme's contrast is checked on.

## Components in use

- **How the app looks** (`ui_foundation`): import as `docs/components/ui_foundation.md` shows; do not copy or edit its files. Use it for every button (`ui-button`), status message and focus ring. Adapt it through `src/theme.ts`.
- **The screens every app starts with** (`ui_blocks`): import as `docs/components/ui_blocks.md` shows; do not copy or edit its files. Use it for the frame (AppShell), every confirm or create dialog (Dialog), and number tiles (StatGrid) only on an approved dashboard screen. Adapt it through `src/components/ui_blocks/copy.ts`.
- **The screens people sign in on** (`auth_screens`): import as `docs/components/auth_screens.md` shows; do not copy or edit its files. It ships `/sign-in`, `/register`, `/forgot-password`, `/reset-password`: link to it only if a screen above needs it. Adapt it through `src/components/auth_screens/copy.ts`, `src/components/auth_screens/auth-screens.css`.
- **A list people can sort and search** (`data_table`): import as `docs/components/data_table.md` shows; do not copy or edit its files. Use it for every list of records: sorting, paging and its own empty state; never a hand-written `<table>`. Adapt it through `src/components/data_table/presentation.tsx`, `src/components/data_table/table.css`.

## States every screen has

- **Empty**: what this is for and what to do first; never a blank panel.
- **Loading**: say what is loading; never a frozen screen.
- **Some data**: the ordinary view.
- **Too much data**: a sixty-character name and a hundred rows still read; lists page or scroll.
- **Broken**: a plain sentence and a way to try again; never a stack trace or a dead end.

## Not in this version

- pay and hours totals
- text or email reminders
- clocking in
- more than one café.

No screen, field or action beyond the flows and screens above without asking the founder first.

## Accessibility

- Text contrast at least 4.5:1 and controls at least 3:1, in both light and dark.
- Everything works with the keyboard, and the focus is always visible (`var(--focus)`).
- Every field has a label; every icon-only button has a name.
- Meaning is never carried by colour alone; respect reduced motion.

## Rules for building screens

- Build each screen in the order above, sample data first, then the real data behind it.
- One look across the app: the variables above, the installed parts, nothing else.
- Avoid the generic AI look: gradients, glows, rows of identical cards, big number tiles nobody asked for.
- Before calling a screen done, check it against this file and say which section it meets.

<!-- /shipyard:design -->

## Decisions made while building

The UI designer adds what the generated part cannot know: the details of each screen, wording, and anything decided with the founder.

### The scene

A café manager on a Sunday evening, at the counter after close or on the sofa with a laptop,
planning next week in five minutes. A barista on the bus or in the back room checking a
phone in daylight, wanting one answer: "when am I on next?" — in under ten seconds.

So: phone first for staff (one column, big tap targets, the next shift first and loudest);
laptop-comfortable for the manager (a compact list, the add-shift form one tap away).

### What this must not look like

- **Not an enterprise workforce suite** (Deputy, When I Work): no dashboards, no number tiles,
  no coloured calendar grid of 168 hour cells. Eight people, one week, a list.
- **Not a group-chat imitation**: no bubbles, avatars or emoji. It replaces the chat by being
  calmer and more certain than it.

### Colour

Restrained. The Calm theme as it is, with a coffee-brown accent set in `src/theme.ts`
(light `#7a4419`, dark `#e0a874`) so it reads as a café and not as a bank. The accent is only
on the primary button, the current nav item and links: well under 10% of the screen.
Meaning of the status roles, always with a word beside them (`Status` from `ui_foundation`):

| Role | Means |
| --- | --- |
| `ok` | Published · Approved |
| `warn` | Draft (staff cannot see it yet) · Waiting for the manager |
| `danger` | Turned down · Left the café |
| `neutral` | Everything else |

Page `var(--bg)`; shift cards and the add-shift panel `var(--surface)` with a 1px `var(--line)`.

### Type

The theme's single family. Hierarchy from size and weight: page title 1.75rem/700, card day
1.125rem/700, shift time 1.375rem/600 (the thing staff look for), everything else body size.
Times as `09:00–15:00` (24-hour, en dash); days as `Mon 10 Nov`.

### Motion

Almost none. Dialogs and new rows appear without animation; buttons show the busy state from
`ui_foundation`. Nothing loops, so nothing needs a reduced-motion alternative.

### Frame

`AppShell` from `ui_blocks`, laid out as a top bar (the app name "Café rota", the nav links
for the role, then "Sign out" on the right). Manager nav: **Plan the week · Staff · Swap
requests · My shifts**. Staff nav: **My shifts**. Content column at most 60rem, 16px gutters
on phones.

### Screens

**Sign in** (`/sign-in`, from `auth_screens`). Heading "Sign in". Below the form: "Setting up
the café for the first time? Create the manager account" (links to `/register`). The very
first account made becomes the manager; anyone else who registers is told to ask the manager.
**Change your password** (`/change-password`): shown after a staff member's first sign-in and
nowhere else. Lede "Your manager set a starting password. Choose your own to carry on." Fields
"New password", "Type it again"; button "Save my password". Errors under the field.

**Plan the week** (`/plan?week=YYYY-MM-DD`, manager). Title "Week of Mon 10 Nov", beside it
the status chip (Draft / Published). Quiet links "← Previous week" "Next week →". Primary
action "Publish this week" (only while Draft); once published the line reads "Published —
staff can see this week." Add-shift form inline above the list: Day (select of the 7 days),
Starts, Ends (time inputs), Who (select of current staff), button "Add shift". The list
(`DataTable`, caption "Shifts this week"): Day · Time · Who · Remove. Empty: "No
shifts this week yet. Add the first one above — staff will not see anything until you
publish." Errors: "The shift has to end after it starts."

**Staff** (`/staff`, manager). Title "Staff". Add form: Name, Email address, Starting password
(hint "Give them this in person. They choose their own when they first sign in."), button "Add
to staff". List (`DataTable`, caption "Everyone on the rota"): Name · Email · Role · Status
(Waiting for first sign-in / Active) · Remove. Remove opens a confirm `Dialog`: "Remove Sam
from the café?" body "They will not be able to sign in. Their shifts stay on the rota for you
to reassign." buttons "Remove Sam" (danger) and "Cancel". The manager has no Remove button.
Empty: "Nobody here yet but you. Add your first staff member above."

**My shifts** (`/shifts`, everyone). Title "My shifts". One card per published shift from
today on, soonest first: day and date, time large, then the swap line. Button "Ask to swap"
opens a `Dialog` "Swap Thu 13 Nov, 09:00–15:00" with "Who should take it?" (select of
colleagues) and buttons "Send to the manager" / "Cancel". After asking, the card shows
`warn` "Swap with Sam — waiting for the manager". Empty: "No shifts coming up. When your
manager publishes next week, your shifts appear here."

**Swap requests** (`/swaps`, manager). Title "Swap requests". `DataTable`, caption "Swap
requests, newest first": Shift · From · To · Asked · Status · actions "Approve" (primary) and
"Turn down" (quiet) on waiting rows only. Approving moves the shift to the colleague. Empty:
"No swap requests. When someone asks to swap a shift it appears here for you to decide."

All screens: loading is the server render (no spinners); a failed save shows the server's
sentence next to the form, never a success; a page that cannot load says "We could not load
this. Reload the page to try again."
