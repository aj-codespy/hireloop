export interface InterviewLinkEmailInput {
  to: string;
  candidateName: string;
  jobTitle: string;
  interviewUrl: string;
  expiresAt: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendInterviewLinkEmail(input: InterviewLinkEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const expiresLabel = new Date(input.expiresAt).toLocaleString();

  if (!apiKey || !from) {
    throw new Error(
      "Email is not configured. Set RESEND_API_KEY and RESEND_FROM in apps/web/.env.local"
    );
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
      subject: `Your interview for ${input.jobTitle}`,
      html: `
        <p>Hi ${input.candidateName},</p>
        <p>You have been invited to complete your AI interview for <strong>${input.jobTitle}</strong>.</p>
        <p><a href="${input.interviewUrl}">Start your interview</a></p>
        <p>This link expires on ${expiresLabel}.</p>
        <p>Find a quiet place, allow camera and microphone access, and use Chrome for the best experience.</p>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Failed to send email (${res.status}): ${detail}`);
  }
}
