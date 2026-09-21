import { AppShell } from "@/components/app-shell";
import { TimetableGrid } from "@/components/timetable-grid";
import {
  listTimetableEntries,
  listPeriods,
  listFaculty,
  listPanels,
  listRooms,
} from "@/lib/queries";
import { moveTimetableEntry, moveLabSession } from "@/lib/actions";

export default async function TimetablePage() {
  const [entries, periods, faculty, panels, rooms] = await Promise.all([
    listTimetableEntries(),
    listPeriods(),
    listFaculty(),
    listPanels(),
    listRooms(),
  ]);

  return (
    <AppShell title="Timetable">
      {entries.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_0_0_1px_#E8E8E8]">
          <p className="text-[16px] font-semibold">No timetable yet</p>
          <p className="mt-2 text-[13px] text-[#8A8A8A]">
            Go to the Dashboard and click{" "}
            <span className="font-medium text-[#111]">Generate week</span> to
            create a timetable.
          </p>
        </div>
      ) : (
        <TimetableGrid
          entries={entries}
          periods={periods}
          faculty={faculty}
          panels={panels}
          rooms={rooms}
          onMoveEntry={moveTimetableEntry}
          onMoveLabSession={moveLabSession}
        />
      )}
    </AppShell>
  );
}
