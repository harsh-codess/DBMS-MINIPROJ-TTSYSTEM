"use client";

import { useState, useTransition } from "react";
import type { GenerationResult } from "@/lib/engine";

export function GenerateButton({
  action,
  hasExisting,
}: {
  action: () => Promise<GenerationResult>;
  hasExisting: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleClick() {
    if (hasExisting && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setResult(null);
    startTransition(async () => {
      const r = await action();
      setResult(r);
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_0_0_1px_#E8E8E8]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold">Generate timetable</h2>
          <p className="mt-1 text-[13px] text-[#8A8A8A]">
            Auto-places all teaching assignments using the constraint engine.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {confirming && (
            <>
              <span className="text-[13px] text-[#8A8A8A]">
                This will replace the current timetable.
              </span>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="inline-flex h-10 items-center rounded-xl border border-[#E8E8E8] bg-white px-4 text-[13px] font-medium text-[#111] transition hover:border-[#111]"
              >
                Cancel
              </button>
            </>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={handleClick}
            className="inline-flex h-10 items-center rounded-xl bg-[#111] px-4 text-[13px] font-medium text-white transition hover:bg-black disabled:opacity-50"
          >
            {pending
              ? "Generating…"
              : confirming
                ? "Confirm"
                : "Generate week"}
          </button>
        </div>
      </div>

      {/* ── Result feedback ── */}
      {result && !pending && (
        <div className="mt-4">
          {result.success ? (
            <div className="rounded-xl bg-[#F0FFF4] px-4 py-3 text-[13px] text-[#111]">
              <p className="font-medium">
                ✓ Timetable generated — {result.entriesCreated} entries
                created
              </p>
              <p className="mt-1 text-[#6B6B6B]">
                {result.assignmentsScheduled} assignments scheduled in{" "}
                {result.generationTimeMs}ms
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-[#FFF5F5] px-4 py-3 text-[13px]">
              <p className="font-medium text-[#111]">
                ✗ Could not generate complete timetable
              </p>
              <p className="mt-2 font-medium text-[#111]">
                {result.subjectCode} — {result.group}
              </p>
              <p className="mt-1 text-[#6B6B6B]">{result.reason}</p>
              {result.validationReasons.length > 0 && (
                <ul className="mt-2 space-y-1 text-[#6B6B6B]">
                  {result.validationReasons.map((r, i) => (
                    <li key={i}>• {r.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
