"use server";

import { requireAdmin } from "@/lib/guard";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateTimetable, validatePlacement } from "@/lib/engine";
import type { GenerationResult, ClashReason } from "@/lib/engine";
import { loadCatalog, loadExistingEntries, persistTimetable } from "@/lib/generate-queries";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readNumber(formData: FormData, key: string) {
  return Number(readString(formData, key));
}

export async function createFaculty(formData: FormData) {
  await requireAdmin();
  const fullName = readString(formData, "full_name");
  const dutyWindowId = readNumber(formData, "duty_window_id");
  const maxTheory = readNumber(formData, "max_theory_hours");
  const maxPractical = readNumber(formData, "max_practical_hours");
  if (!fullName || !dutyWindowId || maxTheory < 0 || maxPractical < 0) {
    redirect("/app/faculty?error=Enter+a+name%2C+window%2C+and+hours");
  }
  const db = sql();
  await db`
    INSERT INTO faculty (full_name, duty_window_id, max_theory_hours, max_practical_hours)
    VALUES (${fullName}, ${dutyWindowId}, ${maxTheory}, ${maxPractical})
  `;
  revalidatePath("/app");
  redirect("/app/faculty?ok=Faculty+saved");
}

export async function updateFaculty(formData: FormData) {
  await requireAdmin();
  const id = readNumber(formData, "id");
  const fullName = readString(formData, "full_name");
  const dutyWindowId = readNumber(formData, "duty_window_id");
  const maxTheory = readNumber(formData, "max_theory_hours");
  const maxPractical = readNumber(formData, "max_practical_hours");
  const db = sql();
  await db`
    UPDATE faculty
    SET full_name = ${fullName},
        duty_window_id = ${dutyWindowId},
        max_theory_hours = ${maxTheory},
        max_practical_hours = ${maxPractical}
    WHERE id = ${id}
  `;
  revalidatePath("/app");
  redirect("/app/faculty?ok=Faculty+updated");
}

export async function deleteFaculty(formData: FormData) {
  await requireAdmin();
  const id = readNumber(formData, "id");
  try {
    const db = sql();
    await db`DELETE FROM faculty WHERE id = ${id}`;
  } catch {
    redirect("/app/faculty?error=Remove+this+faculty+member%27s+assignments+first");
  }
  revalidatePath("/app");
  redirect("/app/faculty?ok=Faculty+removed");
}

export async function createRoom(formData: FormData) {
  await requireAdmin();
  const code = readString(formData, "code");
  const kind = readString(formData, "kind");
  const labType = readString(formData, "lab_type");
  const capacity = readNumber(formData, "capacity");
  if (!code || (kind !== "classroom" && kind !== "lab") || capacity <= 0) {
    redirect("/app/rooms?error=Enter+a+code%2C+kind%2C+and+capacity");
  }
  if (kind === "lab" && !labType) {
    redirect("/app/rooms?error=Labs+need+a+lab+type");
  }
  try {
    const db = sql();
    await db`
      INSERT INTO room (code, kind, lab_type, capacity)
      VALUES (${code}, ${kind}, ${kind === "lab" ? labType : null}, ${capacity})
    `;
  } catch {
    redirect("/app/rooms?error=Room+code+must+be+unique+and+match+classroom%2Flab+rules");
  }
  revalidatePath("/app");
  redirect("/app/rooms?ok=Room+saved");
}

export async function updateRoom(formData: FormData) {
  await requireAdmin();
  const id = readNumber(formData, "id");
  const code = readString(formData, "code");
  const kind = readString(formData, "kind");
  const labType = readString(formData, "lab_type");
  const capacity = readNumber(formData, "capacity");
  if (kind === "lab" && !labType) {
    redirect(`/app/rooms/${id}?error=Labs+need+a+lab+type`);
  }
  try {
    const db = sql();
    await db`
      UPDATE room
      SET code = ${code},
          kind = ${kind},
          lab_type = ${kind === "lab" ? labType : null},
          capacity = ${capacity}
      WHERE id = ${id}
    `;
  } catch {
    redirect(`/app/rooms/${id}?error=Could+not+update+room`);
  }
  revalidatePath("/app");
  redirect("/app/rooms?ok=Room+updated");
}

export async function deleteRoom(formData: FormData) {
  await requireAdmin();
  const id = readNumber(formData, "id");
  try {
    const db = sql();
    await db`DELETE FROM room WHERE id = ${id}`;
  } catch {
    redirect("/app/rooms?error=This+room+is+used+in+the+timetable");
  }
  revalidatePath("/app");
  redirect("/app/rooms?ok=Room+removed");
}

export async function createAssignment(formData: FormData) {
  await requireAdmin();
  const facultyId = readNumber(formData, "faculty_id");
  const subjectId = readNumber(formData, "subject_id");
  const panelId = readNumber(formData, "panel_id");
  const labBatchRaw = readString(formData, "lab_batch_id");
  const weeklyHours = readNumber(formData, "weekly_hours");
  const labBatchId = labBatchRaw ? Number(labBatchRaw) : null;
  if (!facultyId || !subjectId || !panelId || weeklyHours <= 0) {
    redirect("/app/assignments?error=Fill+faculty%2C+subject%2C+panel%2C+and+hours");
  }
  try {
    const db = sql();
    await db`
      INSERT INTO teaching_assignment (faculty_id, subject_id, panel_id, lab_batch_id, weekly_hours)
      VALUES (${facultyId}, ${subjectId}, ${panelId}, ${labBatchId}, ${weeklyHours})
    `;
  } catch {
    redirect("/app/assignments?error=Could+not+save+assignment");
  }
  revalidatePath("/app");
  redirect("/app/assignments?ok=Assignment+saved");
}

export async function deleteAssignment(formData: FormData) {
  await requireAdmin();
  const id = readNumber(formData, "id");
  try {
    const db = sql();
    await db`DELETE FROM teaching_assignment WHERE id = ${id}`;
  } catch {
    redirect("/app/assignments?error=This+assignment+is+already+placed+on+the+grid");
  }
  revalidatePath("/app");
  redirect("/app/assignments?ok=Assignment+removed");
}

/* ------------------------------------------------------------------ */
/*  Phase 4 — Generate timetable                                       */
/* ------------------------------------------------------------------ */

export async function generateTimetableAction(): Promise<GenerationResult> {
  await requireAdmin();

  const catalog = await loadCatalog();
  const result = generateTimetable(catalog);

  if (result.success) {
    await persistTimetable(result.entries);
    revalidatePath("/app");
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Phase 5 — Move a single timetable entry                            */
/* ------------------------------------------------------------------ */

export async function moveTimetableEntry(
  entryId: number,
  newPeriodId: number,
  newRoomId: number,
): Promise<{ ok: boolean; reasons: ClashReason[] }> {
  await requireAdmin();

  const catalog = await loadCatalog();
  const existing = await loadExistingEntries();

  const entry = existing.find((e) => e.id === entryId);
  if (!entry) return { ok: false, reasons: [{ code: "UNKNOWN_ASSIGNMENT", message: "Entry not found." }] };

  // Build candidate with the entry's id so the validator ignores itself.
  const candidate = {
    ...entry,
    periodId: newPeriodId,
    roomId: newRoomId,
  };

  const result = validatePlacement(candidate, existing, catalog);
  if (!result.ok) return result;

  const db = sql();
  await db`
    UPDATE timetable_entry
    SET period_id = ${newPeriodId}, room_id = ${newRoomId}
    WHERE id = ${entryId}
  `;
  revalidatePath("/app");
  return { ok: true, reasons: [] };
}

/* ------------------------------------------------------------------ */
/*  Phase 5 — Move a lab session (all cells share session_id)          */
/* ------------------------------------------------------------------ */

export async function moveLabSession(
  sessionId: string,
  periodIdMap: { oldPeriodId: number; newPeriodId: number }[],
  newRoomId: number,
): Promise<{ ok: boolean; reasons: ClashReason[] }> {
  await requireAdmin();

  const catalog = await loadCatalog();
  const existing = await loadExistingEntries();

  const sessionEntries = existing.filter((e) => e.sessionId === sessionId);
  if (sessionEntries.length === 0) {
    return { ok: false, reasons: [{ code: "UNKNOWN_ASSIGNMENT", message: "Session not found." }] };
  }

  // Build all candidates with new positions.
  const candidates = sessionEntries.map((entry) => {
    const mapping = periodIdMap.find((m) => m.oldPeriodId === entry.periodId);
    return {
      ...entry,
      periodId: mapping ? mapping.newPeriodId : entry.periodId,
      roomId: newRoomId,
    };
  });

  // Remove old session entries from existing, then validate each candidate incrementally.
  const withoutSession = existing.filter((e) => e.sessionId !== sessionId);
  const allReasons: ClashReason[] = [];
  const placed = [...withoutSession];

  for (const candidate of candidates) {
    const result = validatePlacement(candidate, placed, catalog);
    if (!result.ok) allReasons.push(...result.reasons);
    placed.push(candidate);
  }

  if (allReasons.length > 0) {
    const unique = allReasons.filter(
      (r, i) => allReasons.findIndex((o) => o.code === r.code && o.message === r.message) === i,
    );
    return { ok: false, reasons: unique };
  }

  // Persist all moves.
  const db = sql();
  for (const candidate of candidates) {
    await db`
      UPDATE timetable_entry
      SET period_id = ${candidate.periodId}, room_id = ${newRoomId}
      WHERE id = ${candidate.id}
    `;
  }
  revalidatePath("/app");
  return { ok: true, reasons: [] };
}
