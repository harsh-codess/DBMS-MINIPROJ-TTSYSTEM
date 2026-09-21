import { asHours } from "@/lib/db";

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="rounded-2xl bg-white px-5 py-4 shadow-[0_0_0_1px_#E8E8E8]">
      <p className="text-[12px] text-[#8A8A8A]">{label}</p>
      <p className="mt-2 text-[28px] font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-[12px] text-[#8A8A8A]">{hint}</p> : null}
    </article>
  );
}

export function HoursBar({
  used,
  max,
}: {
  used: string | number;
  max: string | number;
}) {
  const u = Number(used);
  const m = Number(max);
  const pct = m <= 0 ? 0 : Math.min(100, (u / m) * 100);
  return (
    <span className="inline-flex items-center gap-2 tabular-nums">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#EDEDED]">
        <span
          className="block h-full rounded-full bg-[#111]"
          style={{ width: `${pct}%` }}
        />
      </span>
      {asHours(u)}/{asHours(m)}
    </span>
  );
}

export function Flash({
  message,
  tone = "ok",
}: {
  message?: string;
  tone?: "ok" | "err";
}) {
  if (!message) return null;
  return (
    <p
      className={`rounded-xl px-3 py-2 text-sm ${
        tone === "err"
          ? "bg-[#111] text-white"
          : "bg-white text-[#111] shadow-[0_0_0_1px_#E8E8E8]"
      }`}
    >
      {message}
    </p>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-[13px]">
      <span className="text-[#6B6B6B]">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-10 w-full rounded-xl border border-[#E8E8E8] bg-white px-3 text-[13px] text-[#111] outline-none transition focus:border-[#111]";

export const btnInk =
  "inline-flex h-10 items-center justify-center rounded-xl bg-[#111] px-4 text-[13px] font-medium text-white transition hover:bg-black disabled:opacity-50";

export const btnGhost =
  "inline-flex h-10 items-center justify-center rounded-xl border border-[#E8E8E8] bg-white px-4 text-[13px] font-medium text-[#111] transition hover:border-[#111]";
