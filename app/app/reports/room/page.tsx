import { AppShell } from "@/components/app-shell";
import { getRoomOccupancyReport, listPeriods } from "@/lib/queries";
import { PrintButton } from "@/components/print-button";

export default async function RoomReportPage() {
  const [periods, entries] = await Promise.all([
    listPeriods(),
    getRoomOccupancyReport(),
  ]);

  const weekdays = [1, 2, 3, 4, 5, 6];
  const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const fixedSlots = [
    { type: 'teaching', label: '8:30 a.m. - 9:30 a.m.', index: 0 },
    { type: 'teaching', label: '9:30 a.m. - 10:30 a.m.', index: 1 },
    { type: 'recess', label: 'RECESS', time: '10:30 a.m. - 10:45 a.m.' },
    { type: 'teaching', label: '10:45 a.m. - 11:45 a.m.', index: 2 },
    { type: 'teaching', label: '11:45 a.m. - 12:45 p.m.', index: 3 },
    { type: 'lunch', label: 'LUNCH', time: '12:45 p.m. - 1:30 p.m.' },
    { type: 'teaching', label: '1:30 p.m. - 2:30 p.m.', index: 4 },
    { type: 'teaching', label: '2:30 p.m. - 3:30 p.m.', index: 5 },
    { type: 'recess', label: 'RECESS', time: '3:30 p.m. - 3:45 p.m.' },
    { type: 'teaching', label: '3:45 p.m. - 4:45 p.m.', index: 6 },
    { type: 'teaching', label: '4:45 p.m. - 5:45 p.m.', index: 7 },
  ];

  // Filter only teaching periods from the database to map them to the fixed UI slots
  const teachingPeriods = Array.from(
    new Map(periods.filter(p => p.kind !== 'lunch').map((p) => [p.start_time, p])).values()
  ).sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Group by room
  const byRoom = new Map<string, typeof entries>();
  for (const entry of entries) {
    if (!byRoom.has(entry.room)) {
      byRoom.set(entry.room, []);
    }
    byRoom.get(entry.room)!.push(entry);
  }

  // Create empty state if no room has timetables
  if (byRoom.size === 0) {
    return (
      <AppShell title="Room Occupancy">
        <div className="rounded-xl bg-[#FFF5F5] px-4 py-3 text-[13px] text-[#111] shadow-[0_0_0_1px_#FFD6D6]">
          <strong>Generate the week first.</strong> No timetables exist yet.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Room Occupancy">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-[13px] text-[#6B6B6B]">
          Printable view. Each room will print on a new page.
        </p>
        <PrintButton />
      </div>

      <div className="space-y-12 print:space-y-0 print:block">
        {Array.from(byRoom.entries()).map(([roomCode, roomEntries]) => (
          <div key={roomCode} className="print:break-after-page print:pt-4 w-full">
            
            {/* Header Yellow Box matching PanelGrid */}
            <div className="w-full border-2 border-black bg-[#FFF200] text-center py-2 mb-4">
              <h2 className="font-bold text-[14px] print:text-[12px] uppercase">
                {roomCode}
              </h2>
              <p className="text-[11px] print:text-[10px] font-semibold uppercase">
                {roomEntries[0]?.kind}
              </p>
            </div>

            {/* Main Timetable Grid */}
            <div className="w-full mb-6 mx-auto">
              <table className="w-full table-fixed border-collapse border-2 border-black text-center text-[12px] print:text-[11px] bg-white">
                <thead>
                  <tr>
                    <th className="border-2 border-black bg-[#C5E0B4] px-1 py-1 w-[8%]">
                      <div className="font-bold mb-1">TIME</div>
                      <div className="border-t-2 border-black pt-1 text-[9px]">Day \ Period</div>
                    </th>
                    {fixedSlots.map((slot, i) => {
                      const [start, end] = slot.time ? slot.time.split(" - ") : slot.label.split(" - ");
                      return (
                        <th key={i} className={`border-2 border-black py-1 bg-[#C5E0B4] ${slot.type === 'teaching' ? 'w-[10%]' : 'w-[5%]'}`}>
                          <div className="flex flex-col items-center justify-center font-bold text-[9px] sm:text-[10px] leading-tight">
                            <span>{start}</span>
                            <span>to</span>
                            <span>{end}</span>
                          </div>
                          <div className="border-t-2 border-black mt-1 pt-1 font-bold text-[10px]">
                            {slot.type === 'teaching' ? (slot.index! + 1) : (start.includes('p.m.') ? 'p.m.' : 'a.m.')}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {weekdays.map((wd, dayIdx) => (
                    <tr key={wd}>
                      <td className="border-2 border-black bg-[#C5E0B4] font-bold px-1 py-2 text-[10px] sm:text-[12px]">
                        {weekdayNames[wd - 1]}
                      </td>
                      
                      {fixedSlots.map((slot, i) => {
                        if (slot.type === "lunch" || slot.type === "recess") {
                          if (dayIdx === 0) {
                            return (
                              <td key={i} rowSpan={weekdays.length} className="border-2 border-black bg-[#B4C6E7] align-middle px-0">
                                <div className="flex flex-col items-center justify-center h-full font-bold text-[11px] sm:text-[13px] uppercase leading-none gap-1">
                                  {slot.label.split('').map((char, charIdx) => (
                                    <span key={charIdx}>{char}</span>
                                  ))}
                                </div>
                              </td>
                            );
                          }
                          return null;
                        }

                        const dbPeriod = teachingPeriods[slot.index!];
                        const cellEntries = dbPeriod ? roomEntries.filter(
                          (e) => e.weekday === wd && e.start_time === dbPeriod.start_time
                        ) : [];

                        return (
                          <td key={i} className="border-2 border-black p-0.5 align-middle bg-white">
                            {cellEntries.length > 0 ? (
                              <div className="flex flex-col gap-0.5 items-center justify-center min-h-[40px]">
                                {cellEntries.map((ce, idx) => (
                                  <div key={idx} className="leading-tight">
                                    <span className="font-bold block text-[9px] sm:text-[11px]">
                                      {ce.subject}
                                    </span>
                                    <span className="text-[8.5px] sm:text-[10px] text-black block">
                                      {ce.faculty.split(" ")[0]} · {ce.panel}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="min-h-[40px] flex items-center justify-center text-transparent select-none">&nbsp;</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        ))}
      </div>
    </AppShell>
  );
}
