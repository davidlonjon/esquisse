# Feature Plan: Yearly Calendar Overview

## Overview

A global shortcut that opens a minimalist yearly calendar overlay showing dots under days with entries. Single-entry days navigate directly; multi-entry days show a selection popover.

## Shortcut

- **New shortcut**: `mod+y` (Cmd+Y / Ctrl+Y) - "Show yearly calendar"
- Add to `shortcuts.ts` under `navigation` category

## New Components

### 1. `YearlyCalendarOverlay.tsx` (`src/renderer/components/layout/`)

- Full-screen modal overlay triggered by shortcut
- Uses existing `Modal` pattern (disables global hotkeys, Escape to close)

### 2. `YearlyCalendar.tsx` (`src/renderer/components/ui/`)

- Displays 12 months in a 3x4 grid
- Each month is a mini calendar (7 columns x ~6 rows)
- **Dot indicator** under days with entries
- Uses existing `react-day-picker` locale support (en/fr)

### 3. `DayEntriesPopover.tsx` (`src/renderer/components/ui/`)

- Shown when clicking a day with **multiple entries**
- List shows time + preview snippet for each entry
- Clicking an entry navigates to it

## Hook

### `useYearlyCalendar.ts` (`src/renderer/hooks/`)

- Manages overlay open/close state
- Computes `Map<dateKey, Entry[]>` from entries store (grouped by day)
- Handles day click logic (single entry -> navigate, multiple -> show popover)

## Data Flow

1. Reuse `useEntryStore` entries (already loaded)
2. Group entries by `YYYY-MM-DD` key from `createdAt`
3. On day click with 1 entry: `setCurrentEntryId(id)` + `router.navigate({ to: '/' })`
4. On day click with N entries: show `DayEntriesPopover` with selection

## Files to Modify

- `src/renderer/config/shortcuts.ts` - add `yearlyCalendar` shortcut
- `src/renderer/locales/{en,fr}/common.json` - add translation keys
- `src/renderer/App.tsx` - register shortcut + render overlay

## No Backend Changes

- All data already available via existing `ENTRY_GET_ALL` IPC channel
