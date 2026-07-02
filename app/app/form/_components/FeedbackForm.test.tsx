import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { FeedbackForm } from "@/app/form/_components/FeedbackForm";

const LABELS = {
  relevance: "How relevant was the demo?",
  satisfaction: "How satisfied are you with the demo?",
  clarity: "How clear was the demo?",
  nps: "How likely are you to recommend us? (0–10)",
  purchase_intent: "How interested are you in buying?",
};

// Each rating auto-advances to the next step, so we wait for the next
// radiogroup to appear before answering it.
async function answer(label: string, value: string) {
  const group = await screen.findByRole("radiogroup", { name: label });
  fireEvent.click(within(group).getByRole("radio", { name: value }));
}

async function fillAllRatings() {
  await answer(LABELS.relevance, "4");
  await answer(LABELS.satisfaction, "5");
  await answer(LABELS.clarity, "3");
  await answer(LABELS.nps, "8");
  await answer(LABELS.purchase_intent, "5");
}

// Walk the whole flow: ratings → comment → review (where submit lives).
async function reachReview(commentText?: string) {
  await fillAllRatings();
  const commentBox = await screen.findByLabelText(/comment/i);
  if (commentText) fireEvent.change(commentBox, { target: { value: commentText } });
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  await screen.findByRole("button", { name: /submit feedback/i });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("FeedbackForm (stepper)", () => {
  it("opens on the greeting and only the first question", () => {
    render(<FeedbackForm token="tok-1" prospectName="Alex" product="Acme" />);
    expect(screen.getByText(/Alex/)).toBeInTheDocument();
    expect(screen.getByText(/Acme/)).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: LABELS.relevance })).toBeInTheDocument();
    // Later questions are not mounted yet.
    expect(screen.queryByRole("radiogroup", { name: LABELS.satisfaction })).not.toBeInTheDocument();
    // No submit button until the review step.
    expect(screen.queryByRole("button", { name: /submit feedback/i })).not.toBeInTheDocument();
  });

  it("advances one question at a time to the review summary", async () => {
    render(<FeedbackForm token="tok-1" prospectName="Alex" product="Acme" />);
    await reachReview("nice work");
    // Review recaps every answer.
    expect(screen.getByText("Relevance")).toBeInTheDocument();
    expect(screen.getByText("Recommend")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit feedback/i })).toBeEnabled();
  });

  it("posts the correct JSON and shows success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<FeedbackForm token="tok-1" prospectName="Alex" product="Acme" />);
    await reachReview("nice work");
    fireEvent.click(screen.getByRole("button", { name: /submit feedback/i }));

    await waitFor(() => expect(screen.getByText(/thank you/i)).toBeInTheDocument());

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/submit");
    const sent = JSON.parse(opts.body);
    expect(sent).toMatchObject({
      token: "tok-1", relevance: 4, satisfaction: 5, clarity: 3, nps: 8,
      purchase_intent: 5, comment: "nice work",
    });
  });

  it("shows an error message when the server rejects", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Server error" }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<FeedbackForm token="tok-1" prospectName="Alex" product="Acme" />);
    await reachReview();
    fireEvent.click(screen.getByRole("button", { name: /submit feedback/i }));

    await waitFor(() => expect(screen.getByText(/failed/i)).toBeInTheDocument());
  });

  it("lets you edit an answer from the review step and returns to review", async () => {
    render(<FeedbackForm token="tok-1" prospectName="Alex" product="Acme" />);
    await reachReview();

    fireEvent.click(screen.getByRole("button", { name: /edit: relevance/i }));
    // Jumps back to that question.
    await answer(LABELS.relevance, "2");
    // Returns to the review summary with the updated value.
    const submit = await screen.findByRole("button", { name: /submit feedback/i });
    expect(submit).toBeInTheDocument();
    // Relevance now reads 2/5 (the only "/5" value that changed); unique on screen.
    expect(
      screen.getByText((_, el) => el?.tagName === "SPAN" && el?.textContent === "2/5"),
    ).toBeInTheDocument();
  });
});
