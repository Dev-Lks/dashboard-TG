# PRD: Bidirectional mission schedule_mode cascade + date-level mode editing

## Status

Draft

## Problem

The `default_schedule_mode` on missions supports toggling between `slots` (com horários) and `presence_only` (só presença). However:

1. **`updateMissionAction` is one-directional**: switching a mission to `presence_only` correctly cascades (clears all slots from dates). But switching **back to `slots`** does nothing — existing dates stay frozen in `presence_only` with no time slots and no way to recover short of deleting and recreating them.
2. **Individual dates can't change `schedule_mode` after creation**: the edit panel only exposes capacity and notes; the `ScheduleEditor` is hidden in edit mode. Admins must delete and recreate dates to change their mode.
3. **No backfill verification**: existing missions in the DB may have `default_schedule_mode` values that don't match their dates' actual state.

## Goal

- `updateMissionAction` handles **both** directions (slots↔presence_only) when mission mode is changed
- Admins can edit an existing date's `schedule_mode` (with slot regeneration on mode change)
- A verification script checks existing missions for consistency

## Non-goals

- Auto-regenerating slots when switching a mission back to `slots` (slots must be manually configured per date — the original schedule params are lost)
- Changing the public-facing booking experience
- Modifying the `create_appointment` DB function (it already honors `resolveScheduleMode`)

## Existing system notes

Relevant files:
- `app/admin/missoes/actions.ts` — `updateMissionAction` (lines 87–107: presence_only cascade only)
- `app/admin/datas/actions.ts` — `updateDateAction` (only updates capacity + notes)
- `components/admin/dates/MissionDateDetailPanel.tsx` — edit panel hides `ScheduleEditor` (line 152: `{!isEdit && (`)
- `components/admin/dates/ScheduleEditor.tsx` — the schedule mode + slot config UI
- `lib/dates/schedule-mode.ts` — `resolveScheduleMode()`
- `lib/dates/slot-generator.ts` — `generateTimeSlots()`
- `supabase/migrations/004_missions.sql` — missions table with `default_schedule_mode not null default 'slots'`

Current behavior:
- Creating a date: `ScheduleEditor` is shown, admin picks mode + time range
- Editing a date: only capacity and notes are editable; `schedule_mode` is read-only
- Mission mode change to `presence_only`: cascades correctly
- Mission mode change to `slots`: no-op; dates remain frozen

Constraints:
- Do NOT modify `supabase/migrations/` (source of truth)
- Do NOT change `create_appointment` function
- Public API response shapes must stay compatible
- `SUPABASE_SERVICE_ROLE_KEY` is server-only

## Proposed approach

Three focused changes:

### 1. Bidirectional cascade in `updateMissionAction`

When `default_schedule_mode` changes to `slots`:
- Update all mission dates: `schedule_mode = 'slots'`
- Leave `schedule_start/end/interval` as NULL (slots must be configured per-date)
- Do NOT delete or touch existing `donation_time_slots`
- Revalidate affected paths

### 2. Date-level `schedule_mode` editing

Add schedule editing to `updateDateAction` and `MissionDateDetailPanel`:
- `updateDateAction` accepts optional `scheduleMode`, `scheduleStart`, `scheduleEnd`, `slotInterval`
- If `scheduleMode` changes:
  - `slots` → `presence_only`: delete existing slots, clear schedule fields
  - `presence_only` → `slots`: generate new slots from provided params
  - Same mode: update slot config if provided (delete old slots, insert new ones)
- `MissionDateDetailPanel`: show `ScheduleEditor` in edit mode (pre-populated from existing date), add to form submission

### 3. Verification script

A one-off script (`scripts/check-mission-schedule-modes.ts`) that:
- Fetches all missions with their dates
- Reports missions where `default_schedule_mode` is `presence_only` but dates still have `schedule_mode = 'slots'` (inconsistent)
- Optionally provides a dry-run backfill

## Implementation plan

1. Modify `app/admin/datas/actions.ts` — add schedule fields to `updateDateAction`
2. Modify `app/admin/missoes/actions.ts` — add `slots` direction to cascade
3. Modify `components/admin/dates/MissionDateDetailPanel.tsx` — show `ScheduleEditor` in edit mode
4. Create `scripts/check-mission-schedule-modes.ts` — verification script
5. Run `pnpm test` — all 89 tests must pass
6. Run `pnpm lint` — no new warnings

## Acceptance criteria

- [ ] Switching mission from `presence_only` to `slots` updates all dates' `schedule_mode` to `slots`
- [ ] Switching mission from `slots` to `presence_only` still clears slots + updates dates (existing behavior)
- [ ] Editing an existing date shows the `ScheduleEditor` with current mode pre-selected
- [ ] Changing a date from `slots` to `presence_only` deletes its slots
- [ ] Changing a date from `presence_only` to `slots` generates new slots
- [ ] Verification script runs and reports mission consistency
- [ ] All 89 tests pass, no lint errors

## Test plan

```bash
pnpm test
pnpm lint
```

Manual checks:
- Create a mission with `slots`, add a date, then edit mission to `presence_only` → date should become presence_only, slots deleted
- Switch mission back to `slots` → date should become `slots` mode
- Edit an existing date → should see schedule mode toggle, change it → slots should update
- Run `pnpm tsx scripts/check-mission-schedule-modes.ts` → reports clean

## Risks

- **Low**: Deleting slots when changing date from `slots` to `presence_only` is irreversible. Confirmation toast already exists.
- **Low**: The bidirectional cascade in `updateMissionAction` only changes `schedule_mode` on dates; no slots are auto-created. Admins must manually configure slots per date after switching to `slots` mode — this is intentional (we can't guess the schedule params).
- **Medium**: If a mission has many dates, the bidirectional cascade does N+1 queries. Acceptable for admin operations (not hot path).

## Open questions

- None.
