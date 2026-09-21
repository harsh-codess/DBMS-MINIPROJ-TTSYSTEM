import { describe, expect, it } from "vitest";
import { generateTimetable } from "./generator";
import type { Catalog, Period } from "./types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const period = (
  id: number,
  weekday: number,
  start: string,
  end: string,
  kind: "teachable" | "lunch" = "teachable",
): Period => ({ id, weekday, startTime: start, endTime: end, kind });

/** Minimal catalog that can be customised per test. */
function baseCatalog(overrides: Partial<Catalog> = {}): Catalog {
  return {
    faculty: [
      {
        id: 1,
        fullName: "Shamala Patil",
        dutyWindow: { code: "09-16", startsAt: "09:00", endsAt: "16:00" },
        maxTheoryHours: 4,
        maxPracticalHours: 8,
      },
    ],
    panels: [{ id: 20, code: "G" }],
    batches: [
      { id: 30, panelId: 20, code: "G1" },
      { id: 31, panelId: 20, code: "G2" },
    ],
    rooms: [
      { id: 10, code: "R-204", kind: "classroom", labType: null, capacity: 60 },
      { id: 11, code: "Lab-2", kind: "lab", labType: "programming", capacity: 30 },
    ],
    assignments: [],
    periods: [
      // Monday
      period(501, 1, "08:00", "09:00"),
      period(502, 1, "09:00", "10:00"),
      period(503, 1, "10:00", "11:00"),
      period(504, 1, "11:00", "12:00"),
      period(505, 1, "12:00", "13:00", "lunch"),
      period(506, 1, "13:00", "14:00"),
      period(507, 1, "14:00", "15:00"),
      period(508, 1, "15:00", "16:00"),
      period(509, 1, "16:00", "17:00"),
      // Tuesday
      period(602, 2, "09:00", "10:00"),
      period(603, 2, "10:00", "11:00"),
      period(604, 2, "11:00", "12:00"),
      period(605, 2, "12:00", "13:00", "lunch"),
      period(606, 2, "13:00", "14:00"),
      period(607, 2, "14:00", "15:00"),
      period(608, 2, "15:00", "16:00"),
      // Wednesday
      period(702, 3, "09:00", "10:00"),
      period(703, 3, "10:00", "11:00"),
      period(704, 3, "11:00", "12:00"),
      period(705, 3, "12:00", "13:00", "lunch"),
      period(706, 3, "13:00", "14:00"),
      period(707, 3, "14:00", "15:00"),
      period(708, 3, "15:00", "16:00"),
      // Thursday
      period(802, 4, "09:00", "10:00"),
      period(803, 4, "10:00", "11:00"),
      period(804, 4, "11:00", "12:00"),
      period(805, 4, "12:00", "13:00", "lunch"),
      period(806, 4, "13:00", "14:00"),
      period(807, 4, "14:00", "15:00"),
      period(808, 4, "15:00", "16:00"),
    ],
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("generateTimetable", () => {
  // ── Test 1: Simple theory ──
  it("generates a simple single-assignment theory timetable", () => {
    const catalog = baseCatalog({
      assignments: [
        {
          id: 100,
          facultyId: 1,
          panelId: 20,
          labBatchId: null,
          weeklyHours: 2,
          subjectCode: "DBMS",
          subjectKind: "theory",
        },
      ],
    });
    const result = generateTimetable(catalog);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entriesCreated).toBe(2);
    expect(result.assignmentsScheduled).toBe(1);
    // All entries must belong to the assignment.
    expect(result.entries.every((e) => e.assignmentId === 100)).toBe(true);
    // All entries must use a classroom.
    expect(result.entries.every((e) => e.roomId === 10)).toBe(true);
  });

  // ── Test 2: Faculty collision ──
  it("never double-books a faculty member in the same period", () => {
    const catalog = baseCatalog({
      faculty: [
        {
          id: 1,
          fullName: "Shamala Patil",
          dutyWindow: { code: "09-16", startsAt: "09:00", endsAt: "16:00" },
          maxTheoryHours: 8,
          maxPracticalHours: 8,
        },
      ],
      panels: [
        { id: 20, code: "G" },
        { id: 21, code: "F" },
      ],
      assignments: [
        {
          id: 100,
          facultyId: 1,
          panelId: 20,
          labBatchId: null,
          weeklyHours: 4,
          subjectCode: "DBMS",
          subjectKind: "theory",
        },
        {
          id: 101,
          facultyId: 1,
          panelId: 21,
          labBatchId: null,
          weeklyHours: 4,
          subjectCode: "OS",
          subjectKind: "theory",
        },
      ],
    });
    const result = generateTimetable(catalog);
    expect(result.success).toBe(true);
    if (!result.success) return;

    // Check no faculty collision: no two entries with same facultyId + periodId.
    const keys = result.entries.map((e) => `${e.facultyId}-${e.periodId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  // ── Test 3: Room collision ──
  it("never double-books a room in the same period", () => {
    const catalog = baseCatalog({
      faculty: [
        {
          id: 1,
          fullName: "Shamala Patil",
          dutyWindow: { code: "09-16", startsAt: "09:00", endsAt: "16:00" },
          maxTheoryHours: 8,
          maxPracticalHours: 8,
        },
        {
          id: 2,
          fullName: "Ramesh Kulkarni",
          dutyWindow: { code: "09-16", startsAt: "09:00", endsAt: "16:00" },
          maxTheoryHours: 8,
          maxPracticalHours: 8,
        },
      ],
      panels: [
        { id: 20, code: "G" },
        { id: 21, code: "F" },
      ],
      rooms: [
        { id: 10, code: "R-204", kind: "classroom", labType: null, capacity: 60 },
      ],
      assignments: [
        {
          id: 100,
          facultyId: 1,
          panelId: 20,
          labBatchId: null,
          weeklyHours: 4,
          subjectCode: "DBMS",
          subjectKind: "theory",
        },
        {
          id: 101,
          facultyId: 2,
          panelId: 21,
          labBatchId: null,
          weeklyHours: 4,
          subjectCode: "OS",
          subjectKind: "theory",
        },
      ],
    });
    const result = generateTimetable(catalog);
    expect(result.success).toBe(true);
    if (!result.success) return;

    // No two entries share the same room + period.
    const keys = result.entries.map((e) => `${e.roomId}-${e.periodId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  // ── Test 4: Panel collision ──
  it("never schedules two theory classes for the same panel in the same period", () => {
    const catalog = baseCatalog({
      faculty: [
        {
          id: 1,
          fullName: "Shamala Patil",
          dutyWindow: { code: "09-16", startsAt: "09:00", endsAt: "16:00" },
          maxTheoryHours: 8,
          maxPracticalHours: 8,
        },
        {
          id: 2,
          fullName: "Ramesh Kulkarni",
          dutyWindow: { code: "09-16", startsAt: "09:00", endsAt: "16:00" },
          maxTheoryHours: 8,
          maxPracticalHours: 8,
        },
      ],
      rooms: [
        { id: 10, code: "R-204", kind: "classroom", labType: null, capacity: 60 },
        { id: 12, code: "R-201", kind: "classroom", labType: null, capacity: 60 },
      ],
      assignments: [
        {
          id: 100,
          facultyId: 1,
          panelId: 20,
          labBatchId: null,
          weeklyHours: 4,
          subjectCode: "DBMS",
          subjectKind: "theory",
        },
        {
          id: 101,
          facultyId: 2,
          panelId: 20,
          labBatchId: null,
          weeklyHours: 4,
          subjectCode: "OS",
          subjectKind: "theory",
        },
      ],
    });
    const result = generateTimetable(catalog);
    expect(result.success).toBe(true);
    if (!result.success) return;

    // No two theory entries for the same panel share a period.
    const theoryKeys = result.entries
      .filter((e) => e.labBatchId == null)
      .map((e) => `${e.panelId}-${e.periodId}`);
    expect(new Set(theoryKeys).size).toBe(theoryKeys.length);
  });

  // ── Test 5: Batch collision ──
  it("never schedules two practicals for the same batch in the same period", () => {
    const catalog = baseCatalog({
      faculty: [
        {
          id: 1,
          fullName: "Shamala Patil",
          dutyWindow: { code: "09-16", startsAt: "09:00", endsAt: "16:00" },
          maxTheoryHours: 8,
          maxPracticalHours: 12,
        },
        {
          id: 2,
          fullName: "Ramesh Kulkarni",
          dutyWindow: { code: "09-16", startsAt: "09:00", endsAt: "16:00" },
          maxTheoryHours: 8,
          maxPracticalHours: 12,
        },
      ],
      rooms: [
        { id: 10, code: "R-204", kind: "classroom", labType: null, capacity: 60 },
        { id: 11, code: "Lab-2", kind: "lab", labType: "programming", capacity: 30 },
        { id: 12, code: "Lab-1", kind: "lab", labType: "programming", capacity: 30 },
      ],
      assignments: [
        {
          id: 110,
          facultyId: 1,
          panelId: 20,
          labBatchId: 30,
          weeklyHours: 2,
          subjectCode: "DSA-LAB",
          subjectKind: "practical",
        },
        {
          id: 210,
          facultyId: 2,
          panelId: 20,
          labBatchId: 30,
          weeklyHours: 2,
          subjectCode: "OS-LAB",
          subjectKind: "practical",
        },
      ],
    });
    const result = generateTimetable(catalog);
    expect(result.success).toBe(true);
    if (!result.success) return;

    // No two entries for the same batch share a period.
    const batchEntries = result.entries.filter((e) => e.labBatchId != null);
    const keys = batchEntries.map((e) => `${e.labBatchId}-${e.periodId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  // ── Test 6: Lunch ──
  it("never generates entries during lunch periods", () => {
    const catalog = baseCatalog({
      assignments: [
        {
          id: 100,
          facultyId: 1,
          panelId: 20,
          labBatchId: null,
          weeklyHours: 4,
          subjectCode: "DBMS",
          subjectKind: "theory",
        },
      ],
    });
    const result = generateTimetable(catalog);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const lunchPeriods = new Set(
      catalog.periods.filter((p) => p.kind === "lunch").map((p) => p.id),
    );
    for (const entry of result.entries) {
      expect(lunchPeriods.has(entry.periodId)).toBe(false);
    }
  });

  // ── Test 7: Duty window ──
  it("never places entries outside the faculty duty window", () => {
    const catalog = baseCatalog({
      faculty: [
        {
          id: 1,
          fullName: "Shamala Patil",
          dutyWindow: { code: "10-14", startsAt: "10:00", endsAt: "14:00" },
          maxTheoryHours: 4,
          maxPracticalHours: 4,
        },
      ],
      assignments: [
        {
          id: 100,
          facultyId: 1,
          panelId: 20,
          labBatchId: null,
          weeklyHours: 3,
          subjectCode: "DBMS",
          subjectKind: "theory",
        },
      ],
    });
    const result = generateTimetable(catalog);
    expect(result.success).toBe(true);
    if (!result.success) return;

    // Every entry must be inside 10:00-14:00 (periods 503, 504, 706 etc.)
    const periodMap = new Map(catalog.periods.map((p) => [p.id, p]));
    for (const entry of result.entries) {
      const p = periodMap.get(entry.periodId)!;
      expect(p.startTime >= "10:00").toBe(true);
      expect(p.endTime <= "14:00").toBe(true);
    }
  });

  // ── Test 8: Practical consecutive block ──
  it("places practicals in consecutive periods on the same day", () => {
    const catalog = baseCatalog({
      assignments: [
        {
          id: 110,
          facultyId: 1,
          panelId: 20,
          labBatchId: 30,
          weeklyHours: 2,
          subjectCode: "DSA-LAB",
          subjectKind: "practical",
        },
      ],
    });
    const result = generateTimetable(catalog);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entriesCreated).toBe(2);

    // Both entries share a non-null sessionId.
    expect(result.entries[0].sessionId).not.toBeNull();
    expect(result.entries[0].sessionId).toBe(result.entries[1].sessionId);

    // Same day, consecutive times.
    const periodMap = new Map(catalog.periods.map((p) => [p.id, p]));
    const p0 = periodMap.get(result.entries[0].periodId)!;
    const p1 = periodMap.get(result.entries[1].periodId)!;
    expect(p0.weekday).toBe(p1.weekday);
    expect(p0.endTime.slice(0, 5)).toBe(p1.startTime.slice(0, 5));

    // Both use a lab room.
    expect(result.entries.every((e) => e.roomId === 11)).toBe(true);
  });

  // ── Test 9: Room compatibility ──
  it("assigns theory to classrooms and practicals to labs", () => {
    const catalog = baseCatalog({
      assignments: [
        {
          id: 100,
          facultyId: 1,
          panelId: 20,
          labBatchId: null,
          weeklyHours: 2,
          subjectCode: "DBMS",
          subjectKind: "theory",
        },
        {
          id: 110,
          facultyId: 1,
          panelId: 20,
          labBatchId: 30,
          weeklyHours: 2,
          subjectCode: "DSA-LAB",
          subjectKind: "practical",
        },
      ],
    });
    const result = generateTimetable(catalog);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const roomMap = new Map(catalog.rooms.map((r) => [r.id, r]));
    for (const entry of result.entries) {
      const room = roomMap.get(entry.roomId)!;
      if (entry.labBatchId == null) {
        expect(room.kind).toBe("classroom");
      } else {
        expect(room.kind).toBe("lab");
      }
    }
  });

  // ── Test 10: Backtracking ──
  it("backtracks when a greedy choice causes a later assignment to fail", () => {
    // Scenario: very tight schedule — only 2 teachable slots on Monday,
    // 2 faculty members, 1 classroom. Faculty A takes the first slot
    // greedily, but Faculty B also needs it. The generator must backtrack
    // and rearrange.
    const tightCatalog: Catalog = {
      faculty: [
        {
          id: 1,
          fullName: "Shamala Patil",
          dutyWindow: { code: "09-11", startsAt: "09:00", endsAt: "11:00" },
          maxTheoryHours: 2,
          maxPracticalHours: 0,
        },
        {
          id: 2,
          fullName: "Ramesh Kulkarni",
          // Ramesh can only teach 09-10 — exactly 1 slot.
          dutyWindow: { code: "09-10", startsAt: "09:00", endsAt: "10:00" },
          maxTheoryHours: 2,
          maxPracticalHours: 0,
        },
      ],
      panels: [
        { id: 20, code: "G" },
        { id: 21, code: "F" },
      ],
      batches: [],
      rooms: [
        { id: 10, code: "R-204", kind: "classroom", labType: null, capacity: 60 },
      ],
      assignments: [
        // Shamala has 1 hour for panel G (she'll greedily pick 09:00, the only slot for Ramesh).
        {
          id: 100,
          facultyId: 1,
          panelId: 20,
          labBatchId: null,
          weeklyHours: 1,
          subjectCode: "DBMS",
          subjectKind: "theory",
        },
        // Ramesh can ONLY teach 09:00 (his duty window is 09-10).
        // If Shamala took the room at 09:00, Ramesh can't be placed.
        // The generator must backtrack: move Shamala to 10:00, then place Ramesh at 09:00.
        {
          id: 200,
          facultyId: 2,
          panelId: 21,
          labBatchId: null,
          weeklyHours: 1,
          subjectCode: "OS",
          subjectKind: "theory",
        },
      ],
      periods: [
        period(502, 1, "09:00", "10:00"),
        period(503, 1, "10:00", "11:00"),
      ],
    };

    const result = generateTimetable(tightCatalog);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.entriesCreated).toBe(2);

    // Ramesh (the more constrained one, sorted first by MRV) gets 09:00.
    const rameshEntry = result.entries.find((e) => e.facultyId === 2)!;
    expect(rameshEntry.periodId).toBe(502); // 09:00-10:00

    // Shamala gets 10:00.
    const shamalaEntry = result.entries.find((e) => e.facultyId === 1)!;
    expect(shamalaEntry.periodId).toBe(503); // 10:00-11:00
  });

  // ── Test 11: Unsatisfiable timetable ──
  it("returns a structured diagnostic when an assignment cannot be placed", () => {
    const catalog = baseCatalog({
      faculty: [
        {
          id: 1,
          fullName: "Shamala Patil",
          // Only 1 teachable hour in her window, but she needs 2.
          dutyWindow: { code: "09-10", startsAt: "09:00", endsAt: "10:00" },
          maxTheoryHours: 4,
          maxPracticalHours: 4,
        },
      ],
      assignments: [
        {
          id: 100,
          facultyId: 1,
          panelId: 20,
          labBatchId: null,
          weeklyHours: 2,
          subjectCode: "DBMS",
          subjectKind: "theory",
        },
      ],
      // Only Monday 09:00 is in window. But she needs 2 hours.
      // 1 period per day × 4 days = 4 available slots, but all on different days.
      // Wait, let me give only 1 day so it's truly impossible.
      periods: [period(502, 1, "09:00", "10:00")],
    });

    const result = generateTimetable(catalog);
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.assignmentId).toBe(100);
    expect(result.subjectCode).toBe("DBMS");
    expect(result.faculty).toBe("Shamala Patil");
    expect(result.reason).toContain("DBMS");
    expect(result.requiredHours).toBe(2);
  });

  // ── Test 12: No partial database state ──
  it("returns entries only on success — failed generation produces no entries", () => {
    const catalog = baseCatalog({
      assignments: [
        {
          id: 100,
          facultyId: 1,
          panelId: 20,
          labBatchId: null,
          weeklyHours: 1,
          subjectCode: "DBMS",
          subjectKind: "theory",
        },
        // This one is impossible — needs a lab but no lab exists.
        {
          id: 110,
          facultyId: 1,
          panelId: 20,
          labBatchId: 30,
          weeklyHours: 2,
          subjectCode: "DSA-LAB",
          subjectKind: "practical",
        },
      ],
      rooms: [
        // Only a classroom, no lab.
        { id: 10, code: "R-204", kind: "classroom", labType: null, capacity: 60 },
      ],
    });

    const result = generateTimetable(catalog);
    expect(result.success).toBe(false);
    if (result.success) return;

    // The result must not contain a partially-generated entries array.
    // (On failure the generator does not expose entries.)
    expect("entries" in result).toBe(false);
  });
});
