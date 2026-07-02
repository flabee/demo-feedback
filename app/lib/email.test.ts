import { describe, it, expect } from "vitest";
import { buildEmail, buildNotificationEmail } from "@/lib/email";

const params = {
  prospectName: "Alex",
  product: "Acme",
  formUrl: "https://app.example.com/form?t=tok-1",
};

describe("buildEmail", () => {
  it("builds a subject with the product and a body containing the form URL", () => {
    const { subject, html, text } = buildEmail(params);
    expect(subject).toContain("Acme");
    expect(html).toContain(params.formUrl);
    expect(text).toContain(params.formUrl);
    expect(text).toContain("Alex");
  });

  it("uses the brand color button and the app-name wordmark", () => {
    const { html } = buildEmail(params);
    expect(html).toContain("#4F46E5");
    expect(html).toContain("Demo Feedback"); // default NEXT_PUBLIC_APP_NAME
  });

  it("HTML-escapes user-derived fields in the HTML body", () => {
    const { html } = buildEmail({
      ...params,
      prospectName: 'Alex <script>"x"</script>',
      product: "A & B",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("A &amp; B");
  });
});

describe("buildNotificationEmail", () => {
  const base = {
    prospectName: "Alex",
    company: "Acme",
    product: "Acme",
    score: 88,
    signal: "hot",
    comment: "great",
    dashboardUrl: "https://app.example.com/dashboard",
  };

  it("puts prospect, product and signal in the subject", () => {
    const { subject } = buildNotificationEmail(base);
    expect(subject).toContain("Alex");
    expect(subject).toContain("Acme");
    expect(subject.toLowerCase()).toContain("hot");
  });

  it("includes score, comment and the dashboard link in the body", () => {
    const { html, text } = buildNotificationEmail(base);
    expect(html).toContain("88");
    expect(html).toContain("great");
    expect(html).toContain("https://app.example.com/dashboard");
    expect(text).toContain("https://app.example.com/dashboard");
  });

  it("escapes user-derived fields", () => {
    const { html } = buildNotificationEmail({
      ...base,
      prospectName: "A<script>",
      company: "B & C",
      comment: "<b>x</b>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("B &amp; C");
  });

  it("handles a missing comment and company", () => {
    const { html, subject } = buildNotificationEmail({ ...base, company: null, comment: null });
    expect(subject).toContain("Alex");
    expect(html).toContain("88");
  });
});
