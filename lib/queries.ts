import { sql } from "./db";

export type DutyWindow = {
  id: number;
  code: string;
  starts_at: string;
  ends_at: string;
};

export type FacultyLoad = {
  faculty_id: number;
  full_name: string;
  duty_window: string;
  max_theory_hours: string;
  max_practical_hours: string;
  assigned_theory_hours: string;
  assigned_practical_hours: string;
};

export type FacultyRow = {
  id: number;
  full_name: string;
  duty_window_id: number;
  duty_window: string;
  max_theory_hours: string;
  max_practical_hours: string;
};

export type RoomRow = {
  id: number;
  code: string;
  kind: "classroom" | "lab";
  lab_type: string | null;
  capacity: number;
};

export type SubjectRow = {
  id: number;
  code: string;
  name: string;
  kind: "theory" | "practical";
};

export type PanelRow = {
  id: number;
  code: string;
};

export type LabBatchRow = {
  id: number;
  panel_id: number;
  code: string;
};

export type AssignmentRow = {
  id: number;
  faculty_name: string;
  subject_code: string;
  subject_kind: "theory" | "practical";
  panel_code: string;
  lab_batch_code: string | null;
  weekly_hours: string;
};

export type DashboardStats = {
  faculty: number;
  rooms: number;
  assignments: number;
  placed: number;
  assigned_hours: string;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = sql();
  const [row] = await db`
    SELECT
      (SELECT COUNT(*)::int FROM faculty) AS faculty,
      (SELECT COUNT(*)::int FROM room) AS rooms,
      (SELECT COUNT(*)::int FROM teaching_assignment) AS assignments,
      (SELECT COUNT(*)::int FROM timetable_entry) AS placed,
      (SELECT COALESCE(SUM(weekly_hours), 0) FROM teaching_assignment) AS assigned_hours
  `;
  return row as DashboardStats;
}

export async function listFacultyLoads(): Promise<FacultyLoad[]> {
  const db = sql();
  return (await db`
    SELECT
      f.id AS faculty_id,
      f.full_name,
      dw.code AS duty_window,
      f.max_theory_hours,
      f.max_practical_hours,
      v.assigned_theory_hours,
      v.assigned_practical_hours
    FROM faculty f
    JOIN duty_window dw ON dw.id = f.duty_window_id
    JOIN v_faculty_load v ON v.faculty_id = f.id
    ORDER BY f.full_name
  `) as FacultyLoad[];
}

export async function listDutyWindows(): Promise<DutyWindow[]> {
  const db = sql();
  return (await db`
    SELECT id, code, starts_at::text, ends_at::text
    FROM duty_window
    ORDER BY starts_at
  `) as DutyWindow[];
}

export async function listFaculty(): Promise<FacultyRow[]> {
  const db = sql();
  return (await db`
    SELECT f.id, f.full_name, f.duty_window_id, dw.code AS duty_window,
           f.max_theory_hours, f.max_practical_hours
    FROM faculty f
    JOIN duty_window dw ON dw.id = f.duty_window_id
    ORDER BY f.full_name
  `) as FacultyRow[];
}

export async function getFaculty(id: number): Promise<FacultyRow | null> {
  const db = sql();
  const [row] = await db`
    SELECT f.id, f.full_name, f.duty_window_id, dw.code AS duty_window,
           f.max_theory_hours, f.max_practical_hours
    FROM faculty f
    JOIN duty_window dw ON dw.id = f.duty_window_id
    WHERE f.id = ${id}
  `;
  return (row as FacultyRow) ?? null;
}

export async function listRooms(): Promise<RoomRow[]> {
  const db = sql();
  return (await db`
    SELECT id, code, kind, lab_type, capacity
    FROM room
    ORDER BY kind, code
  `) as RoomRow[];
}

export async function getRoom(id: number): Promise<RoomRow | null> {
  const db = sql();
  const [row] = await db`
    SELECT id, code, kind, lab_type, capacity
    FROM room
    WHERE id = ${id}
  `;
  return (row as RoomRow) ?? null;
}

export async function listSubjects(): Promise<SubjectRow[]> {
  const db = sql();
  return (await db`
    SELECT id, code, name, kind FROM subject ORDER BY kind, code
  `) as SubjectRow[];
}

export async function listPanels(): Promise<PanelRow[]> {
  const db = sql();
  return (await db`
    SELECT id, code FROM panel ORDER BY code
  `) as PanelRow[];
}

export async function listLabBatches(): Promise<LabBatchRow[]> {
  const db = sql();
  return (await db`
    SELECT id, panel_id, code FROM lab_batch ORDER BY code
  `) as LabBatchRow[];
}

export async function listAssignments(): Promise<AssignmentRow[]> {
  const db = sql();
  return (await db`
    SELECT
      ta.id,
      f.full_name AS faculty_name,
      s.code AS subject_code,
      s.kind AS subject_kind,
      p.code AS panel_code,
      lb.code AS lab_batch_code,
      ta.weekly_hours
    FROM teaching_assignment ta
    JOIN faculty f ON f.id = ta.faculty_id
    JOIN subject s ON s.id = ta.subject_id
    JOIN panel p ON p.id = ta.panel_id
    LEFT JOIN lab_batch lb ON lb.id = ta.lab_batch_id
    ORDER BY f.full_name, s.code, p.code, lb.code
  `) as AssignmentRow[];
}
