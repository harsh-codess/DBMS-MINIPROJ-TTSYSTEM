import { AppShell } from "@/components/app-shell";
import { getPanelTimetableReport, listPeriods } from "@/lib/queries";
import { PrintButton } from "@/components/print-button";

export default async function PanelReportPage() {
  const [periods, entries] = await Promise.all([
    listPeriods(),
    getPanelTimetableReport(),
  ]);

  const weekdays = [1, 2, 3, 4, 5, 6];
  const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Filter only teaching periods from the database to map them to the fixed UI slots
  const teachingPeriods = Array.from(
    new Map(periods.filter(p => p.kind !== 'lunch').map((p) => [p.start_time, p])).values()
  ).sort((a, b) => a.start_time.localeCompare(b.start_time));

  // The strict fixed timings from user specifications
  const fixedSlots = [
    { label: "8:30 a.m. - 9:30 a.m.", type: "teaching", index: 0 },
    { label: "9:30 a.m. - 10:30 a.m.", type: "teaching", index: 1 },
    { label: "RECESS", type: "recess", time: "10:30 a.m. - 10:45 a.m." },
    { label: "10:45 a.m. - 11:45 a.m.", type: "teaching", index: 2 },
    { label: "11:45 a.m. - 12:45 p.m.", type: "teaching", index: 3 },
    { label: "LUNCH", type: "lunch", time: "12:45 p.m. - 1:30 p.m." },
    { label: "1:30 p.m. - 2:30 p.m.", type: "teaching", index: 4 },
    { label: "2:30 p.m. - 3:30 p.m.", type: "teaching", index: 5 },
    { label: "RECESS", type: "recess", time: "3:30 p.m. - 3:45 p.m." },
    { label: "3:45 p.m. - 4:45 p.m.", type: "teaching", index: 6 },
    { label: "4:45 p.m. - 5:45 p.m.", type: "teaching", index: 7 },
  ];

  // Group by panel
  const byPanel = new Map<string, typeof entries>();
  for (const entry of entries) {
    if (!byPanel.has(entry.panel)) {
      byPanel.set(entry.panel, []);
    }
    byPanel.get(entry.panel)!.push(entry);
  }

  if (byPanel.size === 0) {
    return (
      <AppShell title="Panel Timetable">
        <div className="rounded-xl bg-[#FFF5F5] px-4 py-3 text-[13px] text-[#111] shadow-[0_0_0_1px_#FFD6D6]">
          <strong>Generate the week first.</strong> No timetables exist yet.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Panel Timetable">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 5mm; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Force scale to ensure it fits on one page */
          .print-container {
            zoom: 0.85; /* scale down slightly to fit perfectly */
          }
        }
      `}</style>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-[13px] text-[#6B6B6B]">
          Printable view. Timings are fixed exactly as per specifications.
        </p>
        <PrintButton />
      </div>

      <div className="space-y-16 print:space-y-0 print:block">
        {Array.from(byPanel.entries()).map(([panelName, panelEntries]) => {
          // Pre-process Theory and Lab data
          const theoryMap = new Map<string, Set<string>>(); // subject -> set of faculties
          const labMap = new Map<string, { batches: Set<string>; rooms: Set<string> }>(); // subject -> {batches, rooms}
          const allRooms = new Set<string>(); // includes both theory and lab rooms

          for (const e of panelEntries) {
            allRooms.add(e.room); // Collect all rooms used by this panel
            
            if (e.kind === "theory") {
              if (!theoryMap.has(e.subject)) theoryMap.set(e.subject, new Set());
              theoryMap.get(e.subject)!.add(e.faculty);
            } else {
              if (!labMap.has(e.subject)) labMap.set(e.subject, { batches: new Set(), rooms: new Set() });
              const l = labMap.get(e.subject)!;
              if (e.lab_batch) l.batches.add(e.lab_batch);
              l.rooms.add(e.room);
            }
          }

          const headerRooms = Array.from(allRooms).sort().join(", ") || "N/A";

          return (
            <div key={panelName} className="print:break-after-page print:pt-2 w-full print-container">
              
              {/* Header section */}
              <div className="mb-4 text-center border-[1.5px] border-black bg-[#FFF200] py-1 font-serif rounded-sm">
                <h1 className="text-[16px] font-bold uppercase tracking-wide">PANEL - {panelName}</h1>
                <p className="text-[12px] font-bold uppercase bg-white mx-auto border-t-[1.5px] border-black pt-1">
                  CLASS ROOM NO. : {headerRooms}
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
                            // Render spanning columns for breaks
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

                          // It's a teaching slot. Fetch the DB entries mapped to this index
                          const dbPeriod = teachingPeriods[slot.index!];
                          const cellEntries = dbPeriod ? panelEntries.filter(
                            (e) => e.weekday === wd && e.start_time === dbPeriod.start_time
                          ) : [];

                          return (
                            <td key={i} className="border-2 border-black p-0.5 align-middle bg-white">
                              {cellEntries.length > 0 ? (
                                <div className="flex flex-col gap-0.5 items-center justify-center min-h-[40px]">
                                  {cellEntries.map((ce, idx) => (
                                    <div key={idx} className="leading-tight">
                                      <span className="font-bold block text-[9px] sm:text-[11px]">
                                        {ce.kind === 'practical' && ce.lab_batch ? `${ce.lab_batch}- ` : ''}{ce.subject}
                                      </span>
                                      <span className="text-[8.5px] sm:text-[10px] text-black block">
                                        {ce.room}
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

              {/* Footer Tables: Theory and Lab */}
              <div className="flex w-full gap-4 items-start mx-auto print:mt-4">
                {/* Theory Table */}
                <div className="w-1/2">
                  <table className="w-full table-fixed border-collapse border-2 border-black text-[11px] print:text-[10px] bg-white text-center">
                    <thead>
                      <tr>
                        <th colSpan={2} className="border-2 border-black bg-[#D9D9D9] px-1 py-1 font-bold">Theory</th>
                      </tr>
                      <tr className="bg-[#B4C6E7]">
                        <th className="border-2 border-black px-1 py-1 font-bold text-center w-1/2">Subject Name</th>
                        <th className="border-2 border-black px-1 py-1 font-bold text-center w-1/2">Subject Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(theoryMap.entries()).length > 0 ? (
                        Array.from(theoryMap.entries()).map(([subject, faculties]) => (
                          <tr key={subject}>
                            <td className="border-2 border-black px-1 py-1 font-semibold">{subject}</td>
                            <td className="border-2 border-black px-1 py-1">{Array.from(faculties).join(", ")}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={2} className="border-2 border-black px-1 py-1 text-center text-gray-500 min-h-[20px]">&nbsp;</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Lab Table */}
                <div className="w-1/2">
                  <table className="w-full table-fixed border-collapse border-2 border-black text-[11px] print:text-[10px] bg-white text-center">
                    <thead>
                      <tr>
                        <th colSpan={3} className="border-2 border-black bg-[#D9D9D9] px-1 py-1 font-bold">Lab</th>
                      </tr>
                      <tr className="bg-[#B4C6E7]">
                        <th className="border-2 border-black px-1 py-1 font-bold text-center w-[40%]">Subject</th>
                        <th className="border-2 border-black px-1 py-1 font-bold text-center w-[30%]">Batches</th>
                        <th className="border-2 border-black px-1 py-1 font-bold text-center w-[30%]">Lab Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(labMap.entries()).length > 0 ? (
                        Array.from(labMap.entries()).map(([subject, data]) => (
                          <tr key={subject}>
                            <td className="border-2 border-black px-1 py-1 font-semibold">{subject}</td>
                            <td className="border-2 border-black px-1 py-1 font-medium">{Array.from(data.batches).sort().join(" ")}</td>
                            <td className="border-2 border-black px-1 py-1">{Array.from(data.rooms).join(", ")}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={3} className="border-2 border-black px-1 py-1 text-center text-gray-500 min-h-[20px]">&nbsp;</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
