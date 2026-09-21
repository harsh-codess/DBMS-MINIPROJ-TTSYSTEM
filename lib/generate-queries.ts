/**
 * Shared Neon → Catalog loader and atomic timetable persistence.
 * Used by both Phase 4 (generate) and Phase 5 (edit).
 */

import { sql } from "./db";
import type {
  Assignment,
  Catalog,
  Faculty,
  LabBatch,
  Panel,
  Period,
  Room,
  TimetableEntry,
} from "./engine/types";

/* ------------------------------------------------------------------ */
/*  Load full catalog (engine-shaped, camelCase)                       */
/* ------------------------------------------------------------------ */

export async function loadCatalog(): Promise<Catalog> {
  const db = sql();

  const [facultyRows, periodRows, roomRows, panelRows, batchRows, assignmentRows] =
    await Promise.all([
      db`
        SELECT f.id, f.full_name,
               dw.code  AS dw_code,
               dw.starts_at::text AS dw_starts_at,
               dw.ends_at::text   AS dw_ends_at,
               f.max_theory_hours,
               f.max_practical_hours
        FROM faculty f
        JOIN duty_window dw ON dw.id = f.duty_window_id
        ORDER BY f.id
      `,
      db`
        SELECT id, weekday, start_time::text, end_time::text, kind
        FROM period
        ORDER BY weekday, start_time
      `,
      db`
        SELECT id, code, kind, lab_type, capacity
        FROM room
        ORDER BY kind, code
      `,
      db`SELECT id, code FROM panel ORDER BY id`,
      db`SELECT id, panel_id, code FROM lab_batch ORDER BY id`,
      db`
        SELECT ta.id, ta.faculty_id, ta.panel_id, ta.lab_batch_id,
               ta.weekly_hours,
               s.code AS subject_code,
               s.kind AS subject_kind
        FROM teaching_assignment ta
        JOIN subject s ON s.id = ta.subject_id
        ORDER BY ta.id
      `,
    ]);

  const faculty: Faculty[] = facultyRows.map((r) => ({
    id: Number(r.id),
    fullName: String(r.full_name),
    dutyWindow: {
      code: String(r.dw_code),
      startsAt: String(r.dw_starts_at),
      endsAt: String(r.dw_ends_at),
    },
    maxTheoryHours: Number(r.max_theory_hours),
    maxPracticalHours: Number(r.max_practical_hours),
  }));

  const periods: Period[] = periodRows.map((r) => ({
    id: Number(r.id),
    weekday: Number(r.weekday),
    startTime: String(r.start_time),
    endTime: String(r.end_time),
    kind: r.kind as Period["kind"],
  }));

  const rooms: Room[] = roomRows.map((r) => ({
    id: Number(r.id),
    code: String(r.code),
    kind: r.kind as Room["kind"],
    labType: r.lab_type ? String(r.lab_type) : null,
    capacity: Number(r.capacity),
  }));

  const panels: Panel[] = panelRows.map((r) => ({
    id: Number(r.id),
    code: String(r.code),
  }));

  const batches: LabBatch[] = batchRows.map((r) => ({
    id: Number(r.id),
    panelId: Number(r.panel_id),
    code: String(r.code),
  }));

  const assignments: Assignment[] = assignmentRows.map((r) => ({
    id: Number(r.id),
    facultyId: Number(r.faculty_id),
    panelId: Number(r.panel_id),
    labBatchId: r.lab_batch_id != null ? Number(r.lab_batch_id) : null,
    weeklyHours: Number(r.weekly_hours),
    subjectCode: String(r.subject_code),
    subjectKind: r.subject_kind as Assignment["subjectKind"],
  }));

  return { faculty, periods, rooms, panels, batches, assignments };
}

/* ------------------------------------------------------------------ */
/*  Load existing timetable entries                                    */
/* ------------------------------------------------------------------ */

export async function loadExistingEntries(): Promise<TimetableEntry[]> {
  const db = sql();
  const rows = await db`
    SELECT id, assignment_id, faculty_id, panel_id, lab_batch_id,
           room_id, period_id, session_id::text
    FROM timetable_entry
    ORDER BY period_id
  `;
  return rows.map((r) => ({
    id: Number(r.id),
    assignmentId: Number(r.assignment_id),
    facultyId: Number(r.faculty_id),
    panelId: Number(r.panel_id),
    labBatchId: r.lab_batch_id != null ? Number(r.lab_batch_id) : null,
    roomId: Number(r.room_id),
    periodId: Number(r.period_id),
    sessionId: r.session_id ? String(r.session_id) : null,
  }));
}

/* ------------------------------------------------------------------ */
/*  Atomic persist — DELETE all + INSERT all in one transaction         */
/* ------------------------------------------------------------------ */

export async function persistTimetable(
  entries: TimetableEntry[],
): Promise<void> {
  const db = sql();

  if (entries.length === 0) {
    await db`DELETE FROM timetable_entry`;
    return;
  }

  // Build the transaction: delete existing, then insert all new entries.
  const queries = [db`DELETE FROM timetable_entry`];

  for (const e of entries) {
    queries.push(
      db`INSERT INTO timetable_entry
           (assignment_id, faculty_id, panel_id, lab_batch_id, room_id, period_id, session_id)
         VALUES
           (${e.assignmentId}, ${e.facultyId}, ${e.panelId}, ${e.labBatchId},
            ${e.roomId}, ${e.periodId}, ${e.sessionId ?? null})`,
    );
  }

  await db.transaction(queries);
}
