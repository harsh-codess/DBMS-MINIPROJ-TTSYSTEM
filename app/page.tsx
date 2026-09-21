import { HeroCta, LandingAuth } from "@/components/landing-auth";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-white text-[#111]">
      <section className="relative isolate min-h-[100svh] overflow-hidden text-white">
        <CampusScene />
        <header className="absolute inset-x-0 top-0 z-20">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-6 md:px-10">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/50"
              aria-label="Menu"
            >
              <span className="block h-px w-3.5 bg-white" />
            </button>
            <Link href="/" className="flex items-center gap-2 text-[13px] tracking-[0.18em]">
              <span className="inline-block h-0 w-0 border-x-[6px] border-b-[10px] border-x-transparent border-b-white" />
              PANELGRID
            </Link>
            <LandingAuth />
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col justify-end px-6 pb-16 pt-28 md:px-16 md:pb-20">
          <p className="text-[13px] tracking-[0.2em] text-white/80">CSE · Semester 5</p>
          <h1 className="mt-4 max-w-4xl text-[48px] font-medium leading-[1.05] tracking-[-0.04em] md:text-[88px]">
            PanelGrid
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-[1.5] text-white/85">
            Place lectures and labs onto one week so faculty, panels, and rooms never overlap.
          </p>
          <div className="mt-8">
            <HeroCta />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-16 md:py-24">
        <p className="text-[13px] text-[#8A8A8A]">About</p>
        <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <h2 className="max-w-xl text-[34px] font-medium leading-[1.2] tracking-[-0.03em] md:text-[44px]">
            Built for the coordinator who has to defend every cell on the grid.
          </h2>
          <div className="space-y-6 text-[15px] text-[#6B6B6B]">
            <p>
              Shamala is not “six classes.” She has a duty window, weekly theory and practical
              hours, and assigned panels. PanelGrid stores that as data, then places it.
            </p>
            <p>
              G is a panel. G1 is a lab batch. The week is one timetable seen three ways:
              faculty, panel, and room.
            </p>
            <Link href="/sign-in" className="inline-flex items-center gap-2 text-[#111]">
              Open as admin
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
        <div className="mt-16 grid gap-10 border-t border-[#E8E8E8] pt-12 md:grid-cols-2">
          <article>
            <p className="text-[13px] text-[#8A8A8A]">Duty windows</p>
            <h3 className="mt-3 text-[22px] font-medium tracking-[-0.02em]">08–15 · 09–16 · 10–17</h3>
            <p className="mt-3 max-w-sm text-[14px] text-[#6B6B6B]">
              A class sits only if the whole period is inside that teacher’s window. Lunch is blocked.
            </p>
          </article>
          <article>
            <p className="text-[13px] text-[#8A8A8A]">Weekly caps</p>
            <h3 className="mt-3 text-[22px] font-medium tracking-[-0.02em]">4h theory + 8h practical</h3>
            <p className="mt-3 max-w-sm text-[14px] text-[#6B6B6B]">
              Hours are per week, not per day. Labs usually take two consecutive periods.
            </p>
          </article>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#111] text-white">
        <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-16 md:py-24">
        <p className="text-[13px] text-white/50">Hard constraints</p>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="max-w-xl text-[34px] font-medium leading-[1.2] tracking-[-0.03em] md:text-[44px]">
            Three rules the generator is not allowed to break.
          </h2>
          <p className="max-w-sm text-[14px] text-white/60">
            The clash engine in Phase 3 will quote these back when a move is illegal.
          </p>
        </div>
        <ol className="mt-14 space-y-10">
          {[
            {
              n: "01",
              title: "Duty window",
              body: "Never schedule outside the teacher’s shift. 10–17 is a window, not a period.",
              chips: ["08–15", "09–16", "10–17"],
            },
            {
              n: "02",
              title: "Assigned hours",
              body: "Place exactly the weekly theory and practical hours on the assignment rows. Do not invent load.",
              chips: ["Theory 1h", "Lab 2h", "Assigned panels only"],
            },
            {
              n: "03",
              title: "No double-booking",
              body: "At any day and period: one teacher, one panel or batch, one room.",
              chips: ["Faculty", "Panel / batch", "Room"],
            },
          ].map((row) => (
            <li
              key={row.n}
              className="grid gap-4 border-t border-white/10 pt-8 md:grid-cols-[72px_1fr_auto] md:items-start"
            >
              <span className="text-[13px] text-white/40">{row.n}</span>
              <div>
                <h3 className="text-[20px] font-medium">{row.title}</h3>
                <p className="mt-2 max-w-xl text-[14px] text-white/60">{row.body}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/20 px-3 py-1 text-[12px] text-white/80"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-16 md:py-24">
        <p className="text-[13px] text-[#8A8A8A]">The week</p>
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-lg text-[34px] font-medium leading-[1.2] tracking-[-0.03em] md:text-[44px]">
            One grid. Faculty, panel, and room are views of the same cells.
          </h2>
          <p className="max-w-sm text-[14px] text-[#6B6B6B]">
            Campus photographs come later. The product shot is the timetable.
          </p>
        </div>
        <div className="mt-12 overflow-hidden rounded-2xl border border-[#E8E8E8]">
          <SampleGrid />
        </div>
      </section>

      <footer className="flex flex-col gap-3 border-t border-[#E8E8E8] px-6 py-8 text-[13px] text-[#8A8A8A] md:flex-row md:items-center md:justify-between md:px-16">
        <p>PanelGrid · Timetable Studio</p>
        <p>One Clerk admin · Neon Postgres · CSE Sem 5</p>
      </footer>
    </div>
  );
}

function CampusScene() {
  return (
    <div className="absolute inset-0" aria-hidden>
      <div className="absolute inset-0 bg-[#8FB0C4]" />
      <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-[#A9C4D4] to-[#8FB0C4]" />
      <div className="absolute inset-x-0 bottom-0 h-[46%] bg-[#4A6844]" />
      <div className="absolute bottom-[42%] left-1/2 h-[38%] w-[18%] -translate-x-1/2 bg-[#D7C9A8]" />
      <div className="absolute bottom-[38%] left-[18%] h-[44%] w-[22%] bg-[#CFC3A6]">
        <div className="absolute inset-x-[12%] top-[18%] grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="aspect-square bg-[#8A9BB0]/70" />
          ))}
        </div>
      </div>
      <div className="absolute bottom-[38%] right-[16%] h-[48%] w-[24%] bg-[#D8CEB4]">
        <div className="absolute inset-x-0 top-0 h-[22%] bg-[#C4B79A]" />
        <div className="absolute inset-x-[14%] top-[30%] grid grid-cols-5 gap-1.5">
          {Array.from({ length: 15 }).map((_, i) => (
            <span key={i} className="h-6 bg-[#91A3B8]/80" />
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 h-[42%] w-[14%] -translate-x-1/2 bg-[#C4B48A]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/25" />
    </div>
  );
}

function SampleGrid() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const periods = ["08", "09", "10", "11", "12", "13", "14", "15", "16"];
  return (
    <div className="overflow-x-auto bg-white">
      <table className="min-w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-[#E8E8E8] text-[#8A8A8A]">
            <th className="px-4 py-3 font-medium">Period</th>
            {days.map((d) => (
              <th key={d} className="px-4 py-3 font-medium">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr key={p} className="border-b border-[#F0F0F0]">
              <th className="px-4 py-3 font-medium text-[#8A8A8A]">{p}:00</th>
              {days.map((d) => {
                const lunch = p === "12";
                const demo = p === "09" && d === "Mon";
                const lab = p === "14" && (d === "Wed" || d === "Thu");
                return (
                  <td key={d} className="px-2 py-2">
                    {lunch ? (
                      <span className="block rounded-lg bg-[#F5F5F5] px-2 py-2 text-[#8A8A8A]">
                        Lunch
                      </span>
                    ) : demo ? (
                      <span className="block rounded-lg bg-[#111] px-2 py-2 text-white">
                        DBMS · G · Shamala
                      </span>
                    ) : lab ? (
                      <span className="block rounded-lg bg-[#EDEDED] px-2 py-2 text-[#111]">
                        DSA-LAB · G1
                      </span>
                    ) : (
                      <span className="block h-9 rounded-lg border border-dashed border-[#E8E8E8]" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
