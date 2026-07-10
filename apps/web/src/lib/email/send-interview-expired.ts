export interface InterviewExpiredEmailInput {
  to: string;
  candidateName: string;
  jobTitle: string;
}

export async function sendInterviewExpiredEmail(
  input: InterviewExpiredEmailInput
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!apiKey || !from) {
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: `Interview window ended — ${input.jobTitle}`,
      html: `
        <p>Hi ${input.candidateName},</p>
        <p>Your interview window for <strong>${input.jobTitle}</strong> has ended, so you can no longer continue the interview online.</p>
        <p>If you still need to complete your interview, please reply to the hiring team or wait for them to send you a new link.</p>
        <p><a href="${appUrl}">Visit HireLoop</a></p>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Failed to send expired interview email (${res.status}): ${detail}`);
  }
}
