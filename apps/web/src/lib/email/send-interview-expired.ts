export interface InterviewExpiredEmailInput {
  to: string;
  candidateName: string;
  jobTitle: string;
}

export async function sendInterviewExpiredEmail(
  input: InterviewExpiredEmailInput
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.BREVO_FROM;
  const fromName = process.env.BREVO_FROM_NAME;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!apiKey || !from) {
    return;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: fromName || "HireLoop",
        email: from,
      },
      to: [
        {
          name: input.candidateName,
          email: input.to,
        },
      ],
      subject: `Interview window ended — ${input.jobTitle}`,
      htmlContent: `
        <p>Hi ${input.candidateName},</p>
        <p>Your interview window for <strong>${input.jobTitle}</strong> has ended, so you can no longer continue the interview online.</p>
        <p>If you still need to complete the interview, please reply to the hiring team or wait for them to send you a new link.</p>
        <p><a href="${appUrl}">Visit HireLoop</a></p>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Failed to send expired interview email (${res.status}): ${detail}`);
  }
}
