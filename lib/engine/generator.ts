/**
 * Phase 4 — Greedy + backtracking timetable generator.
 *
 * Pure logic — no database I/O. Takes a Catalog and produces
 * TimetableEntry[] or a structured failure diagnostic.
 *
 * Every candidate placement is accepted ONLY if validatePlacement() says ok.
 */

import { validatePlacement } from "./validate";
import type {
  Assignment,
  Catalog,
  ClashReason,
  Faculty,
  Period,
  TimetableEntry,
  ValidationResult,
} from "./types";
import { fullyInside, toMinutes } from "./time";

/* ------------------------------------------------------------------ */
/*  Result types                                                       */
/* ------------------------------------------------------------------ */

export type GenerationSuccess = {
  success: true;
  entries: TimetableEntry[];
  entriesCreated: number;
  assignmentsScheduled: number;
  generationTimeMs: number;
};

export type GenerationFailure = {
  success: false;
  assignmentId: number;
  subjectCode: string;
  faculty: string;
  group: string;
  requiredHours: number;
  scheduledHours: number;
  reason: string;
  validationReasons: ClashReason[];
};

export type GenerationResult = GenerationSuccess | GenerationFailure;

/* ------------------------------------------------------------------ */
/*  Internal types                                                     */
/* ------------------------------------------------------------------ */

/** One schedulable unit (1 period for theory, 2 consecutive for practical). */
type WorkItem = {
  assignment: Assignment;
  faculty: Faculty;
  blockSize: number;
  itemIndex: number;
  totalItems: number;
};

/** A concrete candidate: which periods + which room. */
type Candidate = {
  periodIds: number[];
  roomId: number;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MAX_ITERATIONS = 100_000;
const PRACTICAL_BLOCK_SIZE = 2;

/* ------------------------------------------------------------------ */
/*  Public entry point                                                 */
/* ------------------------------------------------------------------ */

export function generateTimetable(catalog: Catalog): GenerationResult {
  const start = performance.now();

  const workItems = buildWorkItems(catalog);
  const placed: TimetableEntry[] = [];
  const stats = { iterations: 0, sessionCounter: 0 };

  const failedItem = solve(workItems, 0, placed, catalog, stats);

  const elapsed = performance.now() - start;

  if (failedItem === null) {
    const scheduledIds = new Set(placed.map((e) => e.assignmentId));
    return {
      success: true,
      entries: placed,
      entriesCreated: placed.length,
      assignmentsScheduled: scheduledIds.size,
      generationTimeMs: Math.round(elapsed),
    };
  }

  return buildFailure(failedItem, placed, catalog);
}

/* ------------------------------------------------------------------ */
/*  Work-item construction                                             */
/* ------------------------------------------------------------------ */

function buildWorkItems(catalog: Catalog): WorkItem[] {
  const sorted = sortAssignments(catalog);
  const items: WorkItem[] = [];

  for (const assignment of sorted) {
    const faculty = catalog.faculty.find((f) => f.id === assignment.facultyId);
    if (!faculty) continue;

    const blockSize =
      assignment.subjectKind === "practical" ? PRACTICAL_BLOCK_SIZE : 1;
    const totalItems = Math.round(assignment.weeklyHours / blockSize);

    for (let i = 0; i < totalItems; i++) {
      items.push({ assignment, faculty, blockSize, itemIndex: i, totalItems });
    }
  }

  return items;
}

/* ------------------------------------------------------------------ */
/*  Assignment ordering — MRV (most-restricted-variable) heuristic     */
/* ------------------------------------------------------------------ */

function sortAssignments(catalog: Catalog): Assignment[] {
  const assignments = [...catalog.assignments];
  const scores = new Map<number, number>();

  for (const a of assignments) {
    const faculty = catalog.faculty.find((f) => f.id === a.facultyId);
    if (!faculty) {
      scores.set(a.id, Infinity);
      continue;
    }

    // Count teachable periods inside the faculty duty window.
    const teachable = catalog.periods.filter(
      (p) =>
        p.kind === "teachable" &&
        fullyInside(
          p.startTime,
          p.endTime,
          faculty.dutyWindow.startsAt,
          faculty.dutyWindow.endsAt,
        ),
    );

    // Count compatible rooms.
    const roomKind = a.subjectKind === "practical" ? "lab" : "classroom";
    const rooms = catalog.rooms.filter((r) => r.kind === roomKind);

    // Fewer options = harder = schedule first (lower score).
    let score = teachable.length * rooms.length;

    // Practical assignments are harder (need consecutive blocks).
    if (a.subjectKind === "practical") score -= 100_000;

    // More weekly hours = harder.
    score -= a.weeklyHours * 10;

    scores.set(a.id, score);
  }

  assignments.sort((a, b) => {
    const sa = scores.get(a.id) ?? 0;
    const sb = scores.get(b.id) ?? 0;
    if (sa !== sb) return sa - sb;
    return a.id - b.id; // stable tiebreaker
  });

  return assignments;
}

/* ------------------------------------------------------------------ */
/*  Backtracking solver                                                */
/* ------------------------------------------------------------------ */

function solve(
  workItems: WorkItem[],
  index: number,
  placed: TimetableEntry[],
  catalog: Catalog,
  stats: { iterations: number; sessionCounter: number },
): WorkItem | null {
  if (index >= workItems.length) return null; // ✓ All placed

  const item = workItems[index];
  const candidates =
    item.assignment.subjectKind === "theory"
      ? generateTheoryCandidates(item, catalog, placed)
      : generatePracticalCandidates(item, catalog, placed);

  for (const candidate of candidates) {
    stats.iterations++;
    if (stats.iterations > MAX_ITERATIONS) return item;

    const entries = buildEntries(candidate, item, stats);

    // Validate every cell (for a 2-cell practical, validate incrementally).
    let valid = true;
    for (let i = 0; i < entries.length; i++) {
      const existing = placed.concat(entries.slice(0, i));
      const result: ValidationResult = validatePlacement(
        entries[i],
        existing,
        catalog,
      );
      if (!result.ok) {
        valid = false;
        break;
      }
    }

    if (valid) {
      placed.push(...entries);
      const failed = solve(workItems, index + 1, placed, catalog, stats);
      if (failed === null) return null; // ✓ downstream succeeded
      // ✗ backtrack — undo this placement
      placed.splice(placed.length - entries.length, entries.length);
    }
  }

  return item; // no candidate worked for this work-item
}

/* ------------------------------------------------------------------ */
/*  Candidate generation — theory                                      */
/* ------------------------------------------------------------------ */

function generateTheoryCandidates(
  item: WorkItem,
  catalog: Catalog,
  placed: TimetableEntry[],
): Candidate[] {
  const { faculty } = item;
  const classrooms = catalog.rooms.filter((r) => r.kind === "classroom");
  const teachable = catalog.periods.filter(
    (p) =>
      p.kind === "teachable" &&
      fullyInside(
        p.startTime,
        p.endTime,
        faculty.dutyWindow.startsAt,
        faculty.dutyWindow.endsAt,
      ),
  );

  const candidates: Candidate[] = [];
  for (const period of teachable) {
    for (const room of classrooms) {
      candidates.push({ periodIds: [period.id], roomId: room.id });
    }
  }

  return orderCandidates(candidates, item, catalog, placed);
}

/* ------------------------------------------------------------------ */
/*  Candidate generation — practical (consecutive block)               */
/* ------------------------------------------------------------------ */

function generatePracticalCandidates(
  item: WorkItem,
  catalog: Catalog,
  placed: TimetableEntry[],
): Candidate[] {
  const { faculty } = item;
  const labs = catalog.rooms.filter((r) => r.kind === "lab");
  const teachable = catalog.periods.filter(
    (p) =>
      p.kind === "teachable" &&
      fullyInside(
        p.startTime,
        p.endTime,
        faculty.dutyWindow.startsAt,
        faculty.dutyWindow.endsAt,
      ),
  );

  // Group by weekday and sort by start time.
  const byDay = new Map<number, Period[]>();
  for (const p of teachable) {
    if (!byDay.has(p.weekday)) byDay.set(p.weekday, []);
    byDay.get(p.weekday)!.push(p);
  }

  const candidates: Candidate[] = [];

  for (const [, dayPeriods] of byDay) {
    const sorted = [...dayPeriods].sort(
      (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      // Must be truly consecutive (end of p1 == start of p2).
      if (p1.endTime.slice(0, 5) !== p2.startTime.slice(0, 5)) continue;
      for (const lab of labs) {
        candidates.push({ periodIds: [p1.id, p2.id], roomId: lab.id });
      }
    }
  }

  return orderCandidates(candidates, item, catalog, placed);
}

/* ------------------------------------------------------------------ */
/*  Deterministic candidate ordering                                   */
/* ------------------------------------------------------------------ */

function orderCandidates(
  candidates: Candidate[],
  item: WorkItem,
  catalog: Catalog,
  placed: TimetableEntry[],
): Candidate[] {
  // Days already used by this assignment — prefer unused days.
  const usedDays = new Set<number>();
  for (const e of placed) {
    if (e.assignmentId !== item.assignment.id) continue;
    const p = catalog.periods.find((p) => p.id === e.periodId);
    if (p) usedDays.add(p.weekday);
  }

  const periodMap = new Map(catalog.periods.map((p) => [p.id, p]));

  candidates.sort((a, b) => {
    const pa = periodMap.get(a.periodIds[0])!;
    const pb = periodMap.get(b.periodIds[0])!;

    // 1. Prefer days not already used by this assignment.
    const aUsed = usedDays.has(pa.weekday) ? 1 : 0;
    const bUsed = usedDays.has(pb.weekday) ? 1 : 0;
    if (aUsed !== bUsed) return aUsed - bUsed;

    // 2. Earlier weekday.
    if (pa.weekday !== pb.weekday) return pa.weekday - pb.weekday;

    // 3. Earlier start time.
    const aMin = toMinutes(pa.startTime);
    const bMin = toMinutes(pb.startTime);
    if (aMin !== bMin) return aMin - bMin;

    // 4. Room id (deterministic tiebreaker).
    return a.roomId - b.roomId;
  });

  return candidates;
}

/* ------------------------------------------------------------------ */
/*  Entry construction                                                 */
/* ------------------------------------------------------------------ */

function buildEntries(
  candidate: Candidate,
  item: WorkItem,
  stats: { sessionCounter: number },
): TimetableEntry[] {
  const { assignment } = item;
  // Lab blocks share a deterministic session id.
  const sessionId =
    candidate.periodIds.length > 1
      ? makeSessionId(stats.sessionCounter++)
      : null;

  return candidate.periodIds.map((periodId) => ({
    assignmentId: assignment.id,
    facultyId: assignment.facultyId,
    panelId: assignment.panelId,
    labBatchId: assignment.labBatchId,
    roomId: candidate.roomId,
    periodId,
    sessionId,
  }));
}

/**
 * Deterministic UUID-shaped session id.
 * Accepted by PostgreSQL's UUID column.
 */
function makeSessionId(counter: number): string {
  const hex = counter.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}`;
}

/* ------------------------------------------------------------------ */
/*  Failure diagnostic                                                 */
/* ------------------------------------------------------------------ */

function buildFailure(
  failedItem: WorkItem,
  placed: TimetableEntry[],
  catalog: Catalog,
): GenerationFailure {
  const { assignment, faculty } = failedItem;
  const group =
    assignment.labBatchId != null
      ? (catalog.batches.find((b) => b.id === assignment.labBatchId)?.code ??
        `batch ${assignment.labBatchId}`)
      : (catalog.panels.find((p) => p.id === assignment.panelId)?.code ??
        `panel ${assignment.panelId}`);

  const scheduledHours = placed.filter(
    (e) => e.assignmentId === assignment.id,
  ).length;

  // Sample validation reasons from the first few candidates.
  const candidates =
    assignment.subjectKind === "theory"
      ? generateTheoryCandidates(failedItem, catalog, placed)
      : generatePracticalCandidates(failedItem, catalog, placed);

  const allReasons: ClashReason[] = [];
  for (const cand of candidates.slice(0, 10)) {
    const entries = buildEntries(cand, failedItem, { sessionCounter: 999_999 });
    for (const entry of entries) {
      const result = validatePlacement(entry, placed, catalog);
      if (!result.ok) allReasons.push(...result.reasons);
    }
  }

  const uniqueReasons = allReasons.filter(
    (r, i) =>
      allReasons.findIndex(
        (o) => o.code === r.code && o.message === r.message,
      ) === i,
  );

  const kind = assignment.subjectKind === "practical" ? "laboratory" : "theory";
  const blockDesc =
    assignment.subjectKind === "practical"
      ? `${PRACTICAL_BLOCK_SIZE}-hour consecutive ${kind} block`
      : `1-hour ${kind} slot`;

  return {
    success: false,
    assignmentId: assignment.id,
    subjectCode: assignment.subjectCode,
    faculty: faculty.fullName,
    group,
    requiredHours: assignment.weeklyHours,
    scheduledHours,
    reason: `Cannot place ${assignment.subjectCode} for ${group}: no valid ${blockDesc} is available within ${faculty.fullName.split(" ")[0]}'s duty window.`,
    validationReasons: uniqueReasons,
  };
}
