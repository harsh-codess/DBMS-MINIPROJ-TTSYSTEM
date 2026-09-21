import {
  fullyInside,
  isContiguousBlock,
  formatSpan,
  formatWindow,
  periodHours,
  weekdayName,
} from "./time";
import type {
  Assignment,
  Catalog,
  ClashReason,
  Faculty,
  Period,
  Room,
  TimetableEntry,
  ValidationResult,
} from "./types";

function fail(reasons: ClashReason[]): ValidationResult {
  return { ok: false, reasons };
}

function ok(): ValidationResult {
  return { ok: true, reasons: [] };
}

function byId<T extends { id: number }>(rows: T[], id: number): T | undefined {
  return rows.find((row) => row.id === id);
}

function others(existing: TimetableEntry[], candidate: TimetableEntry): TimetableEntry[] {
  if (candidate.id == null) return existing;
  return existing.filter((row) => row.id !== candidate.id);
}

function hoursFor(
  entries: TimetableEntry[],
  catalog: Catalog,
  match: (entry: TimetableEntry, assignment: Assignment) => boolean,
): number {
  return entries.reduce((sum, entry) => {
    const assignment = byId(catalog.assignments, entry.assignmentId);
    const period = byId(catalog.periods, entry.periodId);
    if (!assignment || !period) return sum;
    if (!match(entry, assignment)) return sum;
    return sum + periodHours(period.startTime, period.endTime);
  }, 0);
}

function describeEntry(entry: TimetableEntry, catalog: Catalog): string {
  const faculty = byId(catalog.faculty, entry.facultyId);
  const assignment = byId(catalog.assignments, entry.assignmentId);
  const period = byId(catalog.periods, entry.periodId);
  const panel = catalog.panels.find((p) => p.id === entry.panelId);
  const batch = entry.labBatchId
    ? catalog.batches.find((b) => b.id === entry.labBatchId)
    : undefined;
  const who = faculty?.fullName.split(" ")[0] ?? "Faculty";
  const subject = assignment?.subjectCode ?? "class";
  const group = batch?.code ?? panel?.code ?? "panel";
  const when = period
    ? `${weekdayName(period.weekday)} ${formatSpan(period.startTime, period.endTime)}`
    : "this period";
  return `${who} already has ${subject} · ${group} ${when}`;
}

function checkIdentity(
  candidate: TimetableEntry,
  catalog: Catalog,
): ClashReason[] {
  const reasons: ClashReason[] = [];
  const period = byId(catalog.periods, candidate.periodId);
  const faculty = byId(catalog.faculty, candidate.facultyId);
  const room = byId(catalog.rooms, candidate.roomId);
  const assignment = byId(catalog.assignments, candidate.assignmentId);

  if (!period) {
    reasons.push({ code: "UNKNOWN_PERIOD", message: "That period is not on the college grid." });
    return reasons;
  }
  if (period.kind === "lunch") {
    reasons.push({
      code: "LUNCH",
      message: `${weekdayName(period.weekday)} ${formatSpan(period.startTime, period.endTime)} is lunch and cannot be taught.`,
    });
  }
  if (!faculty) {
    reasons.push({ code: "UNKNOWN_FACULTY", message: "Unknown faculty." });
  }
  if (!room) {
    reasons.push({ code: "UNKNOWN_ROOM", message: "Unknown room." });
  }
  if (!assignment) {
    reasons.push({ code: "UNKNOWN_ASSIGNMENT", message: "Unknown teaching assignment." });
    return reasons;
  }
  if (
    assignment.facultyId !== candidate.facultyId ||
    assignment.panelId !== candidate.panelId ||
    (assignment.labBatchId ?? null) !== (candidate.labBatchId ?? null)
  ) {
    reasons.push({
      code: "ASSIGNMENT_MISMATCH",
      message: `${assignment.subjectCode} is assigned to a different faculty, panel, or batch.`,
    });
  }
  return reasons;
}

function checkDutyWindow(faculty: Faculty, period: Period): ClashReason | null {
  if (
    fullyInside(
      period.startTime,
      period.endTime,
      faculty.dutyWindow.startsAt,
      faculty.dutyWindow.endsAt,
    )
  ) {
    return null;
  }
  const firstName = faculty.fullName.split(" ")[0];
  return {
    code: "DUTY_WINDOW",
    message: `${firstName} is outside the ${formatWindow(faculty.dutyWindow.startsAt, faculty.dutyWindow.endsAt)} window (${weekdayName(period.weekday)} ${formatSpan(period.startTime, period.endTime)}).`,
  };
}

function checkRoomKind(assignment: Assignment, room: Room): ClashReason | null {
  if (assignment.subjectKind === "theory" && room.kind !== "classroom") {
    return {
      code: "ROOM_KIND",
      message: `${assignment.subjectCode} is theory and needs a classroom, not ${room.code}.`,
    };
  }
  if (assignment.subjectKind === "practical" && room.kind !== "lab") {
    return {
      code: "ROOM_KIND",
      message: `${assignment.subjectCode} is a lab and needs a lab room, not ${room.code}.`,
    };
  }
  return null;
}

function checkAssignedPanel(
  faculty: Faculty,
  candidate: TimetableEntry,
  catalog: Catalog,
): ClashReason | null {
  const teachesPanel = catalog.assignments.some(
    (row) => row.facultyId === faculty.id && row.panelId === candidate.panelId,
  );
  if (teachesPanel) return null;
  const panel = catalog.panels.find((p) => p.id === candidate.panelId);
  return {
    code: "UNASSIGNED_PANEL",
    message: `${faculty.fullName.split(" ")[0]} is not assigned to panel ${panel?.code ?? candidate.panelId}.`,
  };
}

function checkBusy(
  candidate: TimetableEntry,
  existing: TimetableEntry[],
  catalog: Catalog,
): ClashReason[] {
  const reasons: ClashReason[] = [];
  const period = byId(catalog.periods, candidate.periodId);
  const room = byId(catalog.rooms, candidate.roomId);
  if (!period) return reasons;

  const samePeriod = existing.filter((row) => row.periodId === candidate.periodId);

  const facultyHit = samePeriod.find((row) => row.facultyId === candidate.facultyId);
  if (facultyHit) {
    reasons.push({
      code: "FACULTY_BUSY",
      message: describeEntry(facultyHit, catalog),
    });
  }

  const roomHit = samePeriod.find((row) => row.roomId === candidate.roomId);
  if (roomHit) {
    reasons.push({
      code: "ROOM_BUSY",
      message: `${room?.code ?? "Room"} occupied (${describeEntry(roomHit, catalog)}).`,
    });
  }

  if (candidate.labBatchId == null) {
    const panelHit = samePeriod.find(
      (row) => row.panelId === candidate.panelId && row.labBatchId == null,
    );
    if (panelHit) {
      const panel = catalog.panels.find((p) => p.id === candidate.panelId);
      reasons.push({
        code: "PANEL_BUSY",
        message: `Panel ${panel?.code ?? candidate.panelId} already has a whole-class session ${weekdayName(period.weekday)} ${formatSpan(period.startTime, period.endTime)}.`,
      });
    }
  } else {
    const batchHit = samePeriod.find((row) => row.labBatchId === candidate.labBatchId);
    if (batchHit) {
      const batch = catalog.batches.find((b) => b.id === candidate.labBatchId);
      reasons.push({
        code: "BATCH_BUSY",
        message: `Batch ${batch?.code ?? candidate.labBatchId} is already in class ${weekdayName(period.weekday)} ${formatSpan(period.startTime, period.endTime)}.`,
      });
    }
  }

  const overlap = samePeriod.find((row) => {
    if (row.panelId !== candidate.panelId) return false;
    const candidateIsTheory = candidate.labBatchId == null;
    const otherIsTheory = row.labBatchId == null;
    return candidateIsTheory !== otherIsTheory;
  });
  if (overlap) {
    const panel = catalog.panels.find((p) => p.id === candidate.panelId);
    reasons.push({
      code: "PANEL_BATCH_OVERLAP",
      message: `Panel ${panel?.code ?? candidate.panelId} cannot have whole-class theory overlapping a batch lab ${weekdayName(period.weekday)} ${formatSpan(period.startTime, period.endTime)}.`,
    });
  }

  return reasons;
}

function checkHours(
  candidate: TimetableEntry,
  existing: TimetableEntry[],
  catalog: Catalog,
  assignment: Assignment,
  faculty: Faculty,
): ClashReason[] {
  const reasons: ClashReason[] = [];
  const period = byId(catalog.periods, candidate.periodId);
  if (!period) return reasons;
  const add = periodHours(period.startTime, period.endTime);
  const withCandidate = [...existing, candidate];

  if (assignment.subjectKind === "theory") {
    const used = hoursFor(
      withCandidate,
      catalog,
      (entry, a) => entry.facultyId === faculty.id && a.subjectKind === "theory",
    );
    if (used > faculty.maxTheoryHours + 1e-9) {
      reasons.push({
        code: "HOURS_THEORY",
        message: `theory hours would become ${trimHours(used)} > ${trimHours(faculty.maxTheoryHours)}`,
      });
    }
  } else {
    const used = hoursFor(
      withCandidate,
      catalog,
      (entry, a) => entry.facultyId === faculty.id && a.subjectKind === "practical",
    );
    if (used > faculty.maxPracticalHours + 1e-9) {
      reasons.push({
        code: "HOURS_PRACTICAL",
        message: `practical hours would become ${trimHours(used)} > ${trimHours(faculty.maxPracticalHours)}`,
      });
    }
  }

  const assignmentUsed = hoursFor(
    withCandidate,
    catalog,
    (entry) => entry.assignmentId === assignment.id,
  );
  if (assignmentUsed > assignment.weeklyHours + 1e-9) {
    const group =
      catalog.batches.find((b) => b.id === assignment.labBatchId)?.code ??
      catalog.panels.find((p) => p.id === assignment.panelId)?.code;
    reasons.push({
      code: "ASSIGNMENT_HOURS",
      message: `${assignment.subjectCode} · ${group} would become ${trimHours(assignmentUsed)}h > ${trimHours(assignment.weeklyHours)}h assigned.`,
    });
  }

  return reasons;
}

function trimHours(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function checkLabSession(
  candidate: TimetableEntry,
  existing: TimetableEntry[],
  catalog: Catalog,
  assignment: Assignment,
): ClashReason | null {
  if (assignment.subjectKind !== "practical" || !candidate.sessionId) return null;
  const block = [...existing, candidate].filter(
    (row) => row.sessionId === candidate.sessionId,
  );
  const periods = block
    .map((row) => byId(catalog.periods, row.periodId))
    .filter((row): row is Period => Boolean(row));
  if (!isContiguousBlock(periods)) {
    return {
      code: "LAB_NOT_CONSECUTIVE",
      message: `${assignment.subjectCode} lab block must be consecutive periods in the same session.`,
    };
  }
  const rooms = new Set(block.map((row) => row.roomId));
  if (rooms.size > 1) {
    return {
      code: "LAB_NOT_CONSECUTIVE",
      message: `${assignment.subjectCode} lab block must stay in one room.`,
    };
  }
  return null;
}

/**
 * Shared clash engine for auto-generate and live edit.
 * Returns every broken rule so the UI can show the reason, not just a boolean.
 */
export function validatePlacement(
  candidate: TimetableEntry,
  existing: TimetableEntry[],
  catalog: Catalog,
): ValidationResult {
  const rest = others(existing, candidate);
  const identity = checkIdentity(candidate, catalog);
  const blocking = identity.filter((reason) =>
    ["UNKNOWN_PERIOD", "UNKNOWN_FACULTY", "UNKNOWN_ROOM", "UNKNOWN_ASSIGNMENT"].includes(
      reason.code,
    ),
  );
  if (blocking.length) return fail(identity);

  const faculty = byId(catalog.faculty, candidate.facultyId)!;
  const period = byId(catalog.periods, candidate.periodId)!;
  const room = byId(catalog.rooms, candidate.roomId)!;
  const assignment = byId(catalog.assignments, candidate.assignmentId)!;

  const reasons: ClashReason[] = [
    ...identity,
    checkDutyWindow(faculty, period),
    checkRoomKind(assignment, room),
    checkAssignedPanel(faculty, candidate, catalog),
    ...checkBusy(candidate, rest, catalog),
    ...checkHours(candidate, rest, catalog, assignment, faculty),
    checkLabSession(candidate, rest, catalog, assignment),
  ].filter((reason): reason is ClashReason => Boolean(reason));

  return reasons.length ? fail(reasons) : ok();
}

export function validateBlock(
  candidates: TimetableEntry[],
  existing: TimetableEntry[],
  catalog: Catalog,
): ValidationResult {
  const reasons: ClashReason[] = [];
  const placed: TimetableEntry[] = [...existing];
  for (const candidate of candidates) {
    const result = validatePlacement(candidate, placed, catalog);
    reasons.push(...result.reasons);
    placed.push(candidate);
  }
  const unique = reasons.filter(
    (reason, index) =>
      reasons.findIndex((other) => other.code === reason.code && other.message === reason.message) ===
      index,
  );
  return unique.length ? fail(unique) : ok();
}
