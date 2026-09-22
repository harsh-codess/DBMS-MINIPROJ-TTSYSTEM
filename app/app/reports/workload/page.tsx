import { AppShell } from "@/components/app-shell";
import { listFacultyLoads, listTimetableEntries } from "@/lib/queries";
import { PrintButton } from "@/components/print-button";

export default async function WorkloadReportPage() {
  const [loads, entries] = await Promise.all([
    listFacultyLoads(),
    listTimetableEntries(),
  ]);

  if (entries.length === 0) {
    return (
      <AppShell title="Workload vs Scheduled">
        <div className="rounded-xl bg-[#FFF5F5] px-4 py-3 text-[13px] text-[#111] shadow-[0_0_0_1px_#FFD6D6]">
          <strong>Generate the week first.</strong> No timetables exist yet.
        </div>
      </AppShell>
    );
  }

  // Aggregate actually placed hours per faculty
  const placedMap = new Map<number, { theory: number; practical: number }>();
  for (const entry of entries) {
    if (!placedMap.has(entry.faculty_id)) {
      placedMap.set(entry.faculty_id, { theory: 0, practical: 0 });
    }
    const current = placedMap.get(entry.faculty_id)!;
    if (entry.subject_kind === "theory") {
      current.theory += 1;
    } else {
      current.practical += 1;
    }
  }

  return (
    <AppShell title="Workload vs Scheduled">
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-[13px] text-[#6B6B6B]">
          Printable view comparing assigned hours to actually placed hours.
        </p>
        <PrintButton />
      </div>

      <div className="print:block w-full">
        {/* Header Yellow Box */}
        <div className="w-full border-2 border-black bg-[#FFF200] text-center py-2 mb-6">
          <h2 className="font-bold text-[14px] print:text-[13px] uppercase">
            Workload vs Scheduled Hours
          </h2>
          <p className="text-[11px] print:text-[10px] font-semibold uppercase">
            Faculty Hour Distribution
          </p>
        </div>

        <div className="w-full">
          <table className="w-full border-collapse border-2 border-black text-center text-[12px] print:text-[11px] bg-white">
            <thead>
              <tr className="bg-[#C5E0B4]">
                <th className="border-2 border-black px-2 py-2 font-bold text-left">Faculty Name</th>
                <th className="border-2 border-black px-2 py-2 font-bold">Assigned Theory</th>
                <th className="border-2 border-black px-2 py-2 font-bold">Placed Theory</th>
                <th className="border-2 border-black px-2 py-2 font-bold">Assigned Practical</th>
                <th className="border-2 border-black px-2 py-2 font-bold">Placed Practical</th>
                <th className="border-2 border-black px-2 py-2 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loads.map((row) => {
                const placed = placedMap.get(row.faculty_id) ?? { theory: 0, practical: 0 };
                
                const assignedTheory = parseFloat(row.assigned_theory_hours);
                const assignedPractical = parseFloat(row.assigned_practical_hours);
                
                const theoryDeficit = assignedTheory - placed.theory;
                const practicalDeficit = assignedPractical - placed.practical;
                
                const isFullyPlaced = theoryDeficit === 0 && practicalDeficit === 0;

                return (
                  <tr key={row.faculty_id}>
                    <td className="border-2 border-black px-2 py-2 font-semibold text-left">{row.full_name}</td>
                    <td className="border-2 border-black px-2 py-2">{assignedTheory}h</td>
                    <td className={`border-2 border-black px-2 py-2 font-bold ${placed.theory < assignedTheory ? 'bg-[#FFD6D6]' : ''}`}>
                      {placed.theory}h
                    </td>
                    <td className="border-2 border-black px-2 py-2">{assignedPractical}h</td>
                    <td className={`border-2 border-black px-2 py-2 font-bold ${placed.practical < assignedPractical ? 'bg-[#FFD6D6]' : ''}`}>
                      {placed.practical}h
                    </td>
                    <td className="border-2 border-black px-2 py-2 font-bold">
                      {isFullyPlaced ? (
                        <span className="text-green-700">OK</span>
                      ) : (
                        <span className="text-red-700">UNPLACED</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
