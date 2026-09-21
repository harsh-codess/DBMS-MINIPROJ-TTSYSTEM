import { describe, expect, it } from "vitest";
import { catalog, rameshLabG2, rameshTheory, shamalaLab, shamalaTheory } from "./fixtures";
import { validateBlock, validatePlacement } from "./validate";
import type { ClashCode, TimetableEntry } from "./types";

function codes(entry: TimetableEntry, existing: TimetableEntry[] = []): ClashCode[] {
  return validatePlacement(entry, existing, catalog).reasons.map((reason) => reason.code);
}

describe("validatePlacement — Shamala / CSE Sem 5", () => {
  it("accepts DBMS for Panel G inside the 09–16 window", () => {
    const result = validatePlacement(shamalaTheory(502), [], catalog);
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("rejects 08:00–09:00 as outside Shamala’s window", () => {
    const result = validatePlacement(shamalaTheory(501), [], catalog);
    expect(result.ok).toBe(false);
    expect(codes(shamalaTheory(501))).toContain("DUTY_WINDOW");
    expect(result.reasons[0].message).toMatch(/outside the 09–16 window/);
  });

  it("rejects 16:00–17:00 as outside Shamala’s window", () => {
    expect(codes(shamalaTheory(509))).toContain("DUTY_WINDOW");
  });

  it("accepts 15:00–16:00, the last hour of 09–16", () => {
    expect(validatePlacement(shamalaTheory(508), [], catalog).ok).toBe(true);
  });

  it("blocks lunch", () => {
    const result = validatePlacement(shamalaTheory(505), [], catalog);
    expect(codes(shamalaTheory(505))).toContain("LUNCH");
    expect(result.reasons.some((r) => r.message.includes("lunch"))).toBe(true);
  });

  it("blocks a second class for Shamala in the same period", () => {
    const existing = [shamalaTheory(502, { assignmentId: 101, panelId: 21, id: 1 })];
    const result = validatePlacement(shamalaTheory(502), existing, catalog);
    expect(result.reasons.map((r) => r.code)).toContain("FACULTY_BUSY");
    expect(result.reasons[0].message).toMatch(/Shamala already has/);
  });

  it("blocks a double-booked classroom", () => {
    const existing = [rameshTheory(502, { id: 1 })];
    const result = validatePlacement(shamalaTheory(502, { roomId: 10 }), existing, catalog);
    expect(result.reasons.map((r) => r.code)).toContain("ROOM_BUSY");
    expect(result.reasons.some((r) => r.message.startsWith("R-204 occupied"))).toBe(true);
  });

  it("blocks two whole-panel classes for G in the same period", () => {
    const existing = [rameshTheory(503, { id: 1, roomId: 10 })];
    expect(
      codes(shamalaTheory(503, { roomId: 10 }), existing),
    ).toEqual(expect.arrayContaining(["PANEL_BUSY"]));
  });

  it("blocks G theory overlapping G1 lab", () => {
    const existing = [shamalaLab(507, { id: 1 })];
    expect(codes(shamalaTheory(507, { roomId: 10 }), existing)).toContain(
      "PANEL_BATCH_OVERLAP",
    );
  });

  it("blocks G1 lab overlapping G theory", () => {
    const existing = [shamalaTheory(507, { id: 1 })];
    expect(codes(shamalaLab(507), existing)).toContain("PANEL_BATCH_OVERLAP");
  });

  it("allows G1 lab while Panel F has theory (different students)", () => {
    const existing = [
      shamalaTheory(502, {
        id: 1,
        assignmentId: 101,
        panelId: 21,
        periodId: 602,
      }),
    ];
    expect(validatePlacement(shamalaLab(507), existing, catalog).ok).toBe(true);
  });

  it("allows G1 and G2 labs at the same time in different rooms", () => {
    const existing = [shamalaLab(507, { id: 1 })];
    expect(validatePlacement(rameshLabG2(507), existing, catalog).ok).toBe(true);
  });

  it("rejects theory hours that would become 5 > 4", () => {
    const existing = [
      shamalaTheory(502, { id: 1 }),
      shamalaTheory(503, { id: 2 }),
      shamalaTheory(602, { id: 3, assignmentId: 101, panelId: 21 }),
      shamalaTheory(603, { id: 4, assignmentId: 102, panelId: 22 }),
    ];
    const result = validatePlacement(
      shamalaTheory(507, { assignmentId: 101, panelId: 21 }),
      existing,
      catalog,
    );
    expect(result.reasons.map((r) => r.code)).toContain("HOURS_THEORY");
    expect(result.reasons.some((r) => r.message.includes("5 > 4"))).toBe(true);
  });

  it("rejects a third hour on DBMS · G (assignment cap is 2h)", () => {
    const existing = [shamalaTheory(502, { id: 1 }), shamalaTheory(503, { id: 2 })];
    const result = validatePlacement(shamalaTheory(504), existing, catalog);
    expect(result.reasons.map((r) => r.code)).toContain("ASSIGNMENT_HOURS");
  });

  it("rejects practical in a classroom", () => {
    expect(codes(shamalaLab(507, { roomId: 10 }))).toContain("ROOM_KIND");
  });

  it("rejects theory in a lab", () => {
    expect(codes(shamalaTheory(502, { roomId: 11 }))).toContain("ROOM_KIND");
  });

  it("rejects an assignment that is not Shamala’s", () => {
    expect(codes(shamalaTheory(502, { assignmentId: 200 }))).toContain(
      "ASSIGNMENT_MISMATCH",
    );
  });

  it("ignores the cell being moved so an edit does not clash with itself", () => {
    const existing = [shamalaTheory(502, { id: 9 })];
    expect(validatePlacement(shamalaTheory(502, { id: 9 }), existing, catalog).ok).toBe(
      true,
    );
  });
});

describe("validateBlock — consecutive labs", () => {
  it("accepts a 2-hour DSA-LAB block 14:00–16:00 in Lab-2", () => {
    const result = validateBlock(
      [shamalaLab(507), shamalaLab(508)],
      [],
      catalog,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a lab session split across lunch", () => {
    const result = validatePlacement(
      shamalaLab(506),
      [shamalaLab(504, { id: 1 })],
      catalog,
    );
    expect(result.reasons.map((r) => r.code)).toContain("LAB_NOT_CONSECUTIVE");
  });

  it("rejects a lab session that changes room mid-block", () => {
    const result = validatePlacement(
      shamalaLab(508, { roomId: 12 }),
      [shamalaLab(507, { id: 1 })],
      catalog,
    );
    expect(result.reasons.map((r) => r.code)).toContain("LAB_NOT_CONSECUTIVE");
  });
});
