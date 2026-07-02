"use client";

import { useEffect, useRef, useState } from "react";
import { RatingScale } from "@/app/form/_components/RatingScale";
import { Logo } from "@/app/_components/Logo";

const QUESTIONS = [
  { key: "relevance", short: "Relevance", label: "How relevant was the demo?", min: 1, max: 5, low: "Not at all", high: "Extremely" },
  { key: "satisfaction", short: "Satisfaction", label: "How satisfied are you with the demo?", min: 1, max: 5, low: "Not at all", high: "Extremely" },
  { key: "clarity", short: "Clarity", label: "How clear was the demo?", min: 1, max: 5, low: "Confusing", high: "Crystal clear" },
  { key: "nps", short: "Recommend", label: "How likely are you to recommend us? (0–10)", min: 0, max: 10, low: "Not likely", high: "Very likely" },
  { key: "purchase_intent", short: "Purchase intent", label: "How interested are you in buying?", min: 1, max: 5, low: "Not at all", high: "Extremely" },
] as const;

type Key = (typeof QUESTIONS)[number]["key"];
type Status = "idle" | "submitting" | "success" | "error";

const MAX_COMMENT = 2000;
const ADVANCE_MS = 320;

const COMMENT_STEP = QUESTIONS.length; // 5
const REVIEW_STEP = QUESTIONS.length + 1; // 6
const TOTAL_STEPS = QUESTIONS.length + 2; // 7

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M4 20h4l10-10a2 2 0 0 0 0-3l-1-1a2 2 0 0 0-3 0L4 16v4Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

export function FeedbackForm({
  token,
  prospectName,
  product,
}: {
  token: string;
  prospectName: string;
  product: string;
}) {
  const [ratings, setRatings] = useState<Record<Key, number | null>>({
    relevance: null, satisfaction: null, clarity: null, nps: null, purchase_intent: null,
  });
  const [comment, setComment] = useState("");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");
  const [returnToReview, setReturnToReview] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingRef = useRef<HTMLElement | null>(null);
  const setHeading = (el: HTMLElement | null) => {
    headingRef.current = el;
  };

  const complete = QUESTIONS.every((q) => ratings[q.key] !== null);

  function clearTimer() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }
  useEffect(() => clearTimer, []);

  // Move focus to the step heading on each change so screen-reader and keyboard
  // users follow the flow. Skip the very first mount (step 0) to avoid stealing
  // focus on page load.
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) headingRef.current?.focus();
    else mounted.current = true;
  }, [step]);

  function goTo(next: number) {
    clearTimer();
    setDirection(next >= step ? "fwd" : "back");
    setReturnToReview(false);
    setStep(next);
  }

  function onSelect(qIndex: number, key: Key, value: number) {
    setRatings((r) => ({ ...r, [key]: value }));
    const target = returnToReview ? REVIEW_STEP : qIndex + 1;
    const dir: "fwd" | "back" = target >= step ? "fwd" : "back";
    clearTimer();
    timer.current = setTimeout(() => {
      setReturnToReview(false);
      setDirection(dir);
      setStep(target);
    }, ADVANCE_MS);
  }

  function editFromReview(target: number) {
    setReturnToReview(true);
    clearTimer();
    setDirection("back");
    setStep(target);
  }

  async function submit() {
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...ratings, comment }),
      });
      if (res.ok) {
        setStatus("success");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setError(
        data.error === "Already submitted"
          ? "You've already submitted your feedback. Thank you!"
          : "Submission failed. Please try again.",
      );
    } catch {
      setStatus("error");
      setError("Submission failed. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <section className="motion-safe:animate-pop-in rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-900/5 sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
            <path
              d="M5 12.5 10 17.5 19 7"
              stroke="#4F46E5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="26"
              className="motion-safe:animate-check-draw"
            />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-gray-900">
          Thank you!
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-gray-600">
          Your feedback has been submitted. It helps us make every demo better
          than the last.
        </p>
        <div className="mt-8 flex justify-center border-t border-gray-100 pt-6">
          <Logo height={24} />
        </div>
      </section>
    );
  }

  const stepLabel =
    step < COMMENT_STEP
      ? `Question ${step + 1} of ${QUESTIONS.length}`
      : step === COMMENT_STEP
        ? "One last thought"
        : "Review your answers";
  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100);
  const anim = direction === "fwd" ? "motion-safe:animate-slide-in-right" : "motion-safe:animate-slide-in-left";

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-900/5">
      <header className="px-6 pt-7 sm:px-9 sm:pt-8">
        <div className="flex items-center justify-between">
          <Logo height={26} priority />
          <span className="text-xs font-medium text-gray-500">
            Feedback · <span className="text-gray-700">{product}</span>
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-medium">
            <span className="text-gray-500">{stepLabel}</span>
            <span className="tabular-nums text-brand">
              {step + 1}/{TOTAL_STEPS}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-label="Progress"
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div key={step} className={`${anim} px-6 pb-8 pt-7 sm:px-9`}>
        {step < COMMENT_STEP && (() => {
          const q = QUESTIONS[step];
          return (
            <div className="flex min-h-[16rem] flex-col">
              {step === 0 && (
                <p className="mb-4 text-[15px] leading-relaxed text-gray-600">
                  Hi <span className="font-semibold text-gray-900">{prospectName}</span> 👋
                  {" "}Tell us how it went — it only takes two minutes.
                </p>
              )}
              <fieldset className="flex-1">
                <legend
                  ref={setHeading}
                  tabIndex={-1}
                  className="mb-5 block text-pretty font-display text-xl font-semibold leading-snug tracking-tight text-gray-900 outline-none"
                >
                  {q.label}
                </legend>
                <RatingScale
                  ariaLabel={q.label}
                  min={q.min}
                  max={q.max}
                  value={ratings[q.key]}
                  onChange={(v) => onSelect(step, q.key, v)}
                />
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>{q.low}</span>
                  <span>{q.high}</span>
                </div>
              </fieldset>

              {step > 0 && (
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => goTo(step - 1)}
                    className="rounded-lg px-2 py-1 text-sm font-medium text-gray-500 transition-colors hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    ← Back
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {step === COMMENT_STEP && (
          <div className="flex min-h-[16rem] flex-col">
            <h2
              ref={setHeading}
              tabIndex={-1}
              className="text-pretty font-display text-xl font-semibold leading-snug tracking-tight text-gray-900 outline-none"
            >
              Anything to add?
            </h2>
            <div className="mb-2 mt-5 flex items-baseline justify-between">
              <label className="text-[15px] font-medium text-gray-900" htmlFor="comment">
                Comment <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <span className="tabular-nums text-xs font-normal text-gray-500">
                {comment.length}/{MAX_COMMENT}
              </span>
            </div>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={MAX_COMMENT}
              rows={5}
              placeholder="Anything that stood out, or that we could improve?"
              className="w-full flex-1 resize-none rounded-xl border border-gray-200 bg-white p-3.5 text-[15px] text-gray-900 placeholder:text-gray-500 transition-colors duration-150 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goTo(COMMENT_STEP - 1)}
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-500 transition-colors hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => goTo(REVIEW_STEP)}
                className="flex h-11 items-center justify-center rounded-xl bg-brand px-6 text-[15px] font-semibold text-white shadow-sm shadow-brand/25 transition-[background-color,transform] duration-150 ease-out hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 motion-safe:active:scale-[0.98]"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {step === REVIEW_STEP && (
          <div className="flex min-h-[16rem] flex-col">
            <h2
              ref={setHeading}
              tabIndex={-1}
              className="font-display text-xl font-semibold leading-snug tracking-tight text-gray-900 outline-none"
            >
              All set, {prospectName}?
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
              Take a look at your answers before submitting.
            </p>

            <dl className="mt-6 divide-y divide-gray-100 border-y border-gray-100">
              {QUESTIONS.map((q, i) => (
                <div key={q.key} className="flex items-center gap-3 py-3">
                  <dt className="flex-1 text-sm text-gray-600">{q.short}</dt>
                  <dd className="flex items-center gap-3">
                    <span className="tabular-nums text-sm font-semibold text-gray-900">
                      {ratings[q.key]}
                      <span className="font-normal text-gray-400">/{q.max}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => editFromReview(i)}
                      aria-label={`Edit: ${q.short}`}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-brand-tint hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      <PencilIcon /> Edit
                    </button>
                  </dd>
                </div>
              ))}
              <div className="flex items-start gap-3 py-3">
                <dt className="flex-1 text-sm text-gray-600">Comment</dt>
                <dd className="flex items-start gap-3">
                  <span className="max-w-[12rem] truncate text-right text-sm text-gray-900">
                    {comment.trim() ? comment : <span className="text-gray-400">—</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => editFromReview(COMMENT_STEP)}
                    aria-label="Edit: comment"
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-brand-tint hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <PencilIcon /> Edit
                  </button>
                </dd>
              </div>
            </dl>

            {status === "error" && (
              <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => goTo(COMMENT_STEP)}
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-500 transition-colors hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!complete || status === "submitting"}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-semibold text-white shadow-sm shadow-brand/25 transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
              >
                {status === "submitting" ? (
                  <>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.25" />
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  "Submit feedback"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
