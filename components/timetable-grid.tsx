"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PeriodRow, TimetableViewRow } from "@/lib/queries";
import type { FacultyRow, PanelRow, RoomRow } from "@/lib/queries";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ViewMode = "faculty" | "panel" | "room";

type MoveResult = { ok: boolean; reasons: { code: string; message: string }[] };

type Props = {
  entries: TimetableViewRow[];
  periods: PeriodRow[];
  faculty: FacultyRow[];
  panels: PanelRow[];
  rooms: RoomRow[];
  onMoveEntry: (entryId: number, newPeriodId: number, newRoomId: number) => Promise<MoveResult>;
  onMoveLabSession: (
    sessionId: string,
    periodIdMap: { oldPeriodId: number; newPeriodId: number }[],
    newRoomId: number,
  ) => Promise<MoveResult>;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TimetableGrid({
  entries,
  periods,
  faculty,
  panels,
  rooms,
  onMoveEntry,
  onMoveLabSession,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [viewMode, setViewMode] = useState<ViewMode>("panel");
  const [selectedEntity, setSelectedEntity] = useState<number | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TimetableViewRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Build time slots — unique rows of (start_time, end_time, kind).
  const timeSlots = getTimeSlots(periods);
  const weekdays = getWeekdays(periods);

  // Resolve entities for the current view.
  const entityOptions =
    viewMode === "faculty"
      ? faculty.map((f) => ({ id: f.id, label: f.full_name }))
      : viewMode === "panel"
        ? panels.map((p) => ({ id: p.id, label: `Panel ${p.code}` }))
        : rooms.map((r) => ({ id: r.id, label: r.code }));

  // Default to first entity if none selected.
  const currentEntity = selectedEntity ?? entityOptions[0]?.id ?? null;

  // Filter entries for the current entity.
  const filteredEntries = entries.filter((e) => {
    if (viewMode === "faculty") return e.faculty_id === currentEntity;
    if (viewMode === "panel") return e.panel_id === currentEntity;
    return e.room_id === currentEntity;
  });

  // Build a lookup: "weekday-start_time" → entry[]
  const cellMap = new Map<string, TimetableViewRow[]>();
  for (const e of filteredEntries) {
    const key = `${e.weekday}-${e.start_time}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key)!.push(e);
  }

  // Handle cell click.
  function handleCellClick(weekday: number, slot: (typeof timeSlots)[0]) {
    if (slot.kind === "lunch") return;
    if (pending) return;

    const cellEntries = cellMap.get(`${weekday}-${slot.start_time}`) ?? [];

    // If something is selected and we clicked an empty cell → try to move.
    if (selectedEntry && cellEntries.length === 0) {
      setError(null);

      // Find the target period.
      const targetPeriod = periods.find(
        (p) => p.weekday === weekday && p.start_time === slot.start_time,
      );
      if (!targetPeriod) return;

      const roomId = selectedEntry.room_id;

      if (selectedEntry.session_id && selectedEntry.subject_kind === "practical") {
        // Lab session — move the whole block.
        const sessionEntries = entries.filter(
          (e) => e.session_id === selectedEntry.session_id,
        );
        const sorted = [...sessionEntries].sort(
          (a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time),
        );
        const baseIdx = sorted.findIndex((e) => e.id === selectedEntry.id);

        // Find teachable periods on the target day.
        const targetPeriodsSorted = periods
          .filter((p) => p.weekday === weekday && p.kind === "teachable")
          .sort((a, b) => a.start_time.localeCompare(b.start_time));

        const targetIdx = targetPeriodsSorted.findIndex(
          (p) => p.id === targetPeriod.id,
        );
        if (targetIdx < 0) return;

        const periodIdMap = sorted.map((entry, i) => {
          const offset = i - baseIdx;
          const newPeriod = targetPeriodsSorted[targetIdx + offset];
          return {
            oldPeriodId: entry.period_id,
            newPeriodId: newPeriod?.id ?? -1,
          };
        });

        if (periodIdMap.some((m) => m.newPeriodId === -1)) {
          setError(
            "Not enough consecutive periods in that position for the lab block.",
          );
          setSelectedEntry(null);
          return;
        }

        startTransition(async () => {
          const result = await onMoveLabSession(
            selectedEntry.session_id!,
            periodIdMap,
            roomId,
          );
          if (!result.ok) {
            setError(result.reasons.map((r) => r.message).join(" • "));
          } else {
            setError(null);
          }
          setSelectedEntry(null);
          router.refresh();
        });
      } else {
        // Single theory entry.
        startTransition(async () => {
          const result = await onMoveEntry(
            selectedEntry.id,
            targetPeriod.id,
            roomId,
          );
          if (!result.ok) {
            setError(result.reasons.map((r) => r.message).join(" • "));
          } else {
            setError(null);
          }
          setSelectedEntry(null);
          router.refresh();
        });
      }
      return;
    }

    // If we clicked a filled cell, select that entry.
    if (cellEntries.length > 0) {
      const entry = cellEntries[0];
      if (selectedEntry?.id === entry.id) {
        setSelectedEntry(null); // deselect
      } else {
        setSelectedEntry(entry);
        setError(null);
      }
      return;
    }

    // Clicked empty, nothing selected → clear.
    setSelectedEntry(null);
    setError(null);
  }

  // Check if a cell is part of the selected session.
  function isInSelectedSession(entry: TimetableViewRow) {
    if (!selectedEntry) return false;
    if (selectedEntry.id === entry.id) return true;
    if (
      selectedEntry.session_id &&
      entry.session_id === selectedEntry.session_id
    )
      return true;
    return false;
  }

  return (
    <div>
      {/* ── View mode toggle ── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["panel", "faculty", "room"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setViewMode(mode);
              setSelectedEntity(null);
              setSelectedEntry(null);
              setError(null);
            }}
            className={`inline-flex h-9 items-center rounded-xl px-3 text-[13px] font-medium transition ${
              viewMode === mode
                ? "bg-[#111] text-white"
                : "border border-[#E8E8E8] bg-white text-[#6B6B6B] hover:border-[#111] hover:text-[#111]"
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}

        {/* Entity selector */}
        <select
          value={currentEntity ?? ""}
          onChange={(e) => {
            setSelectedEntity(Number(e.target.value));
            setSelectedEntry(null);
            setError(null);
          }}
          className="ml-2 h-9 rounded-xl border border-[#E8E8E8] bg-white px-3 text-[13px] text-[#111] outline-none focus:border-[#111]"
        >
          {entityOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>

        {pending && (
          <span className="ml-2 text-[13px] text-[#8A8A8A]">Saving…</span>
        )}
      </div>

      {/* ── Instruction ── */}
      {selectedEntry && (
        <div className="mb-3 rounded-xl bg-[#F5F5F5] px-4 py-2 text-[13px] text-[#6B6B6B]">
          Moving <strong>{selectedEntry.subject_code}</strong>
          {selectedEntry.lab_batch_code
            ? ` · ${selectedEntry.lab_batch_code}`
            : ` · ${selectedEntry.panel_code}`}
          {" "}— click an empty cell to place it, or click again to deselect.
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mb-3 rounded-xl bg-[#FFF5F5] px-4 py-2 text-[13px] text-[#111]">
          ✗ {error}
        </div>
      )}

      {/* ── Grid ── */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_0_0_1px_#E8E8E8]">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-[11px] font-medium text-[#8A8A8A]">
                Time
              </th>
              {weekdays.map((wd) => (
                <th
                  key={wd}
                  className="min-w-[120px] px-2 py-2 text-center text-[11px] font-medium text-[#8A8A8A]"
                >
                  {WEEKDAYS[wd - 1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot.start_time} className="border-t border-[#F0F0F0]">
                <td className="sticky left-0 z-10 bg-white px-3 py-1 text-[11px] tabular-nums text-[#8A8A8A]">
                  {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                </td>
                {weekdays.map((wd) => {
                  if (slot.kind === "lunch") {
                    return (
                      <td
                        key={wd}
                        className="bg-[#FAFAFA] px-2 py-1 text-center text-[11px] text-[#CCCCCC]"
                      >
                        Lunch
                      </td>
                    );
                  }

                  const cellEntries =
                    cellMap.get(`${wd}-${slot.start_time}`) ?? [];

                  return (
                    <td
                      key={wd}
                      onClick={() => handleCellClick(wd, slot)}
                      className={`cursor-pointer px-1 py-1 transition ${
                        cellEntries.length > 0
                          ? cellEntries.some((e) => isInSelectedSession(e))
                            ? "bg-[#111] text-white"
                            : "bg-[#F5F5F5] hover:bg-[#EDEDED]"
                          : selectedEntry
                            ? "hover:bg-[#E8FFE8]"
                            : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      {cellEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`rounded-lg px-2 py-1 ${
                            isInSelectedSession(entry)
                              ? ""
                              : entry.subject_kind === "practical"
                                ? "bg-[#E8E8FF]"
                                : ""
                          }`}
                        >
                          <p className="font-medium leading-tight">
                            {entry.subject_code}
                          </p>
                          <p
                            className={`text-[10px] leading-tight ${
                              isInSelectedSession(entry)
                                ? "text-[#ccc]"
                                : "text-[#8A8A8A]"
                            }`}
                          >
                            {viewMode === "faculty"
                              ? `${entry.panel_code}${entry.lab_batch_code ? ` · ${entry.lab_batch_code}` : ""} · ${entry.room_code}`
                              : viewMode === "panel"
                                ? `${entry.faculty_name.split(" ")[0]} · ${entry.room_code}${entry.lab_batch_code ? ` · ${entry.lab_batch_code}` : ""}`
                                : `${entry.faculty_name.split(" ")[0]} · ${entry.panel_code}${entry.lab_batch_code ? ` · ${entry.lab_batch_code}` : ""}`}
                          </p>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getTimeSlots(periods: PeriodRow[]) {
  const seen = new Set<string>();
  const slots: {
    start_time: string;
    end_time: string;
    kind: PeriodRow["kind"];
  }[] = [];
  for (const p of periods) {
    if (seen.has(p.start_time)) continue;
    seen.add(p.start_time);
    slots.push({
      start_time: p.start_time,
      end_time: p.end_time,
      kind: p.kind,
    });
  }
  return slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
}

function getWeekdays(periods: PeriodRow[]): number[] {
  const days = new Set(periods.map((p) => p.weekday));
  return [...days].sort((a, b) => a - b);
}
