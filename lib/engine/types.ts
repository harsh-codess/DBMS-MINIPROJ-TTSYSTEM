export type SubjectKind = "theory" | "practical";
export type RoomKind = "classroom" | "lab";
export type PeriodKind = "teachable" | "lunch";

export type DutyWindow = {
  code: string;
  startsAt: string;
  endsAt: string;
};

export type Faculty = {
  id: number;
  fullName: string;
  dutyWindow: DutyWindow;
  maxTheoryHours: number;
  maxPracticalHours: number;
};

export type Period = {
  id: number;
  weekday: number;
  startTime: string;
  endTime: string;
  kind: PeriodKind;
};

export type Room = {
  id: number;
  code: string;
  kind: RoomKind;
  labType: string | null;
  capacity: number;
};

export type LabBatch = {
  id: number;
  panelId: number;
  code: string;
};

export type Panel = {
  id: number;
  code: string;
};

export type Assignment = {
  id: number;
  facultyId: number;
  panelId: number;
  labBatchId: number | null;
  weeklyHours: number;
  subjectCode: string;
  subjectKind: SubjectKind;
};

export type TimetableEntry = {
  id?: number;
  assignmentId: number;
  facultyId: number;
  panelId: number;
  labBatchId: number | null;
  roomId: number;
  periodId: number;
  sessionId?: string | null;
};

export type Catalog = {
  faculty: Faculty[];
  periods: Period[];
  rooms: Room[];
  panels: Panel[];
  batches: LabBatch[];
  assignments: Assignment[];
};

export type ClashCode =
  | "UNKNOWN_PERIOD"
  | "LUNCH"
  | "UNKNOWN_FACULTY"
  | "UNKNOWN_ROOM"
  | "UNKNOWN_ASSIGNMENT"
  | "ASSIGNMENT_MISMATCH"
  | "UNASSIGNED_PANEL"
  | "DUTY_WINDOW"
  | "FACULTY_BUSY"
  | "ROOM_BUSY"
  | "PANEL_BUSY"
  | "BATCH_BUSY"
  | "PANEL_BATCH_OVERLAP"
  | "HOURS_THEORY"
  | "HOURS_PRACTICAL"
  | "ASSIGNMENT_HOURS"
  | "ROOM_KIND"
  | "LAB_NOT_CONSECUTIVE";

export type ClashReason = {
  code: ClashCode;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  reasons: ClashReason[];
};
