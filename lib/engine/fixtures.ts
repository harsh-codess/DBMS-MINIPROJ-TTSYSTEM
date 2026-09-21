import type { Catalog, TimetableEntry } from "./types";

const period = (
  id: number,
  weekday: number,
  start: string,
  end: string,
  kind: "teachable" | "lunch" = "teachable",
) => ({ id, weekday, startTime: start, endTime: end, kind });

export const catalog: Catalog = {
  faculty: [
    {
      id: 1,
      fullName: "Shamala Patil",
      dutyWindow: { code: "09-16", startsAt: "09:00", endsAt: "16:00" },
      maxTheoryHours: 4,
      maxPracticalHours: 8,
    },
    {
      id: 2,
      fullName: "Ramesh Kulkarni",
      dutyWindow: { code: "08-15", startsAt: "08:00", endsAt: "15:00" },
      maxTheoryHours: 4,
      maxPracticalHours: 8,
    },
  ],
  panels: [
    { id: 20, code: "G" },
    { id: 21, code: "F" },
    { id: 22, code: "H" },
  ],
  batches: [
    { id: 30, panelId: 20, code: "G1" },
    { id: 31, panelId: 20, code: "G2" },
  ],
  rooms: [
    { id: 10, code: "R-204", kind: "classroom", labType: null, capacity: 60 },
    { id: 11, code: "Lab-2", kind: "lab", labType: "programming", capacity: 30 },
    { id: 12, code: "Lab-1", kind: "lab", labType: "programming", capacity: 30 },
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
    {
      id: 101,
      facultyId: 1,
      panelId: 21,
      labBatchId: null,
      weeklyHours: 1,
      subjectCode: "DBMS",
      subjectKind: "theory",
    },
    {
      id: 102,
      facultyId: 1,
      panelId: 22,
      labBatchId: null,
      weeklyHours: 1,
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
    {
      id: 200,
      facultyId: 2,
      panelId: 20,
      labBatchId: null,
      weeklyHours: 2,
      subjectCode: "OS",
      subjectKind: "theory",
    },
    {
      id: 210,
      facultyId: 2,
      panelId: 20,
      labBatchId: 31,
      weeklyHours: 2,
      subjectCode: "OS-LAB",
      subjectKind: "practical",
    },
  ],
  periods: [
    period(501, 1, "08:00", "09:00"),
    period(502, 1, "09:00", "10:00"),
    period(503, 1, "10:00", "11:00"),
    period(504, 1, "11:00", "12:00"),
    period(505, 1, "12:00", "13:00", "lunch"),
    period(506, 1, "13:00", "14:00"),
    period(507, 1, "14:00", "15:00"),
    period(508, 1, "15:00", "16:00"),
    period(509, 1, "16:00", "17:00"),
    period(602, 2, "09:00", "10:00"),
    period(603, 2, "10:00", "11:00"),
  ],
};

export function shamalaTheory(periodId: number, extras: Partial<TimetableEntry> = {}): TimetableEntry {
  return {
    assignmentId: 100,
    facultyId: 1,
    panelId: 20,
    labBatchId: null,
    roomId: 10,
    periodId,
    ...extras,
  };
}

export function shamalaLab(
  periodId: number,
  extras: Partial<TimetableEntry> = {},
): TimetableEntry {
  return {
    assignmentId: 110,
    facultyId: 1,
    panelId: 20,
    labBatchId: 30,
    roomId: 11,
    periodId,
    sessionId: "lab-g1",
    ...extras,
  };
}

export function rameshLabG2(
  periodId: number,
  extras: Partial<TimetableEntry> = {},
): TimetableEntry {
  return {
    assignmentId: 210,
    facultyId: 2,
    panelId: 20,
    labBatchId: 31,
    roomId: 12,
    periodId,
    sessionId: "lab-g2",
    ...extras,
  };
}

export function rameshTheory(
  periodId: number,
  extras: Partial<TimetableEntry> = {},
): TimetableEntry {
  return {
    assignmentId: 200,
    facultyId: 2,
    panelId: 20,
    labBatchId: null,
    roomId: 10,
    periodId,
    ...extras,
  };
}
