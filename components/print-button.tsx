"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      type="button"
      className="rounded-xl bg-[#111] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-black"
    >
      Print Report
    </button>
  );
}
