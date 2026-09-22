# PanelGrid — Phase 6 implementation prompt

You are also given **PanelGrid-phases.md**. That file is the spec. This prompt is how to implement **Phase 6 only** in the existing repo.

Treat the phases doc as source of truth for *what*. Treat this file as source of truth for *where* and *how*. Do not contradict the phases doc. Do not redo Phases 0–5. Do not rebuild the generator, week-grid editor, Clerk, or clash engine.

Paste both documents into the coding agent.

---

You are continuing **PanelGrid**. Implement **Phase 6 (reports + mini-project wrap)** as defined in the phases doc. Stop when the viva pack exists.

**Repo:** https://github.com/harsh-codess/DBMS-MINIPROJ-TTSYSTEM  
**Start branch:** prefer the branch where Phase 4 + 5 already landed (ask Harsh). If generate is not merged yet, start from `cursor/panelgrid-phased-commits` and still build the report screens — they will be empty until `timetable_entry` has rows.

```bash
git clone https://github.com/harsh-codess/DBMS-MINIPROJ-TTSYSTEM
cd DBMS-MINIPROJ-TTSYSTEM
git checkout <branch Harsh names>
git checkout -b cursor/phase-6-reports
npm install
# Harsh gives you .env.local. Never print or commit it.
npm test
npm run dev
```

Work on that `cursor/` branch. Do not force-push `main`. Do not commit `.env.local`, `.neon`, `node_modules`, `.next`. `npm test` must stay green.

---

## Do not rebuild

| Already done | Use it |
|---|---|
| Schema, seed, ER comments | `db/schema.sql`, `db/seed.sql` |
| SQL views | `v_faculty_timetable`, `v_panel_timetable`, `v_room_occupancy`, `v_faculty_load` |
| Admin chrome | `components/app-shell.tsx`, `components/ui.tsx` |
| Clash engine | `lib/engine/` — reports are read-only; do not fork validators |

Protect routes under `/app`. `await auth()`. Next.js 16: `proxy.ts`, Promise `params`. Match Figma: black / white / `#F5F5F5`, Plus Jakarta Sans.

---

## What to build (Phase 6 deliverable)

### 1. Printable in-app reports (required)

Under `/app/reports` (or similar), still inside AppShell, with a **Print** action (`window.print` + print CSS is enough; no need for a PDF library unless it is trivial).

Four surfaces, all from Neon (prefer the existing views):

- **Faculty timetable** — pick a teacher, Mon–Sat × periods (Shamala’s week is the viva demo).
- **Panel timetable** — pick G / F / H; show batch on lab cells (G1/G2).
- **Room occupancy** — pick a room; empty slots stay empty, lunch stays lunch.
- **Workload vs scheduled** — for each faculty: assigned theory/practical hours vs hours actually placed in `timetable_entry`. Call out unplaced hours.

Empty week is a valid state: say **Generate the week first** rather than fake data.

### 2. Submission artifacts (required)

Add a `docs/` (or `report/`) folder Harsh can zip for college:

- **ER** — a real diagram file (Mermaid in `docs/er.md` is fine). Do not leave ER as SQL comments only.
- **Schema** — pointer to `db/schema.sql` plus a short table list.
- **Sample queries** — `docs/sample-queries.sql` that a viva examiner can paste into Neon: faculty week, panel week, room occupancy, load vs placed, clash-oriented selects (e.g. count entries per faculty×period should be 0 or 1). Use the views.

Do not dump secrets. Do not rewrite the schema.

---

## Done when

Harsh can: log in → open reports → print Shamala / Panel G / Lab-2 → show workload vs scheduled → hand over `docs/` with ER + sample SQL.

Then **stop**.
