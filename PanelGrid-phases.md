# PanelGrid — Phase Plan

Send this file **together with** the implementation prompt for the phase being built (`PanelGrid-phase-4-5-prompt.md` or `PanelGrid-phase-6-prompt.md`). This doc is the spec. The prompt is how to implement that phase in the repo.

College DBMS mini-project: clash-free weekly faculty timetable.

Stack: Figma → Neon Postgres → Next.js (App Router) → Clerk (one admin) → constraint engine → generator → week-grid editor.

Repo: https://github.com/harsh-codess/DBMS-MINIPROJ-TTSYSTEM
Figma: https://www.figma.com/design/MIB9AYixGdDVKmW8MS604r

Rule: finish a phase, stop, get approval, then start the next one.

---

## Phase 0 — Figma
**Status: done**

Design before any screen is coded.

- Landing, dashboard, week-grid, faculty list, rooms list
- University black / white / `#F5F5F5` chrome
- Plus Jakarta Sans at 150% line-height (Satoshi stand-in)

**Deliverable:** shareable Figma file for landing + dashboard + timetable studio.

---

## Phase 1 — Domain + database
**Status: done**

DBMS heart. No UI yet.

- Neon project **PanelGrid**
- Tables: duty windows, faculty, panels, lab batches, subjects, rooms, teaching assignments, periods, timetable entries
- Unique indexes: faculty×period, room×period, panel×period, batch×period
- Seed: Shamala / Ramesh / Neha, panels G F H, 4h theory + 8h practical, Mon–Sat grid with lunch blocked

**Deliverable:** tables in the Neon SQL editor, plus ER as comments in `db/schema.sql`.

---

## Phase 2 — Landing + Clerk + dashboard + master data
**Status: done**

Next.js implements the Figma. Each screen talks to Neon.

- Public `/` landing
- One Clerk admin login (`/sign-in`, `/sign-up` for the first account)
- Protected `/app` dashboard on live seed counts
- CRUD: faculty, rooms, teaching assignments

**Deliverable:** open `/`, sign in as admin, see Shamala’s load, edit assignments.

---

## Phase 3 — Constraint engine
**Status: done**

Shared by auto-generate (Phase 4) and drag-edit (Phase 5).

```
validatePlacement(candidate, existing, catalog) → ok | list of reasons
```

Checks:

- inside faculty duty window
- not lunch
- faculty / room / panel / batch not double-booked
- whole-panel theory cannot overlap that panel’s batch lab
- weekly theory / practical caps
- per-assignment hour caps
- theory in classroom, practical in lab
- consecutive lab blocks in one room

**Deliverable:** `npm test` — Shamala-style unit tests. This is the viva explanation.

---

## Phase 4 — Auto-generator


Greedy + backtracking. Explainable in a viva (not OR-Tools).

- Place theory as 1-hour cells
- Place practicals as consecutive lab blocks
- Pick a free compatible room
- Respect shift and hours
- Call the Phase 3 engine on every candidate

**Deliverable:** generate fills the week, or returns the first unsatisfiable assignment  
(example: *cannot place Shamala DSA Lab for G1: no 2-hour lab free inside 09–16*).

---

## Phase 5 — Hybrid editor


Generate first, then human correction. No silent conflicts.

- Week grid: Mon–Sat × periods
- Faculty / Panel / Room views of the same cells
- Invalid drop blocked with the engine’s reason
- Save to `timetable_entry`

**Deliverable:** the product: automated first pass, then edit, never a hidden clash.

---

## Phase 6 — Reports + submission wrap
**Status: not started**

- Printable faculty timetable
- Panel timetable
- Room occupancy
- Workload vs scheduled hours
- Report artifacts: ER, schema, sample queries

**Deliverable:** viva pack.

---

## Locked product rules

1. Load is **weekly hours**, not “6 classes.”
2. `08–15` / `09–16` / `10–17` are **duty windows**, not periods.
3. G / F / H are **panels**. G1 / G2 are **lab batches**.
4. Faculty only teach **assigned** panels.
5. At any day+period: one teacher, one panel-or-batch, one room.
6. Faculty are Postgres rows. Clerk is **one admin login** for the viva, not roles.

---

## Build order (why this sequence)

Figma → schema → vertical slices (real UI on real Shamala data) → clash engine → generator → grid editor → reports.

Do not finish all UI on fake data. Do not build every API before the screens.
