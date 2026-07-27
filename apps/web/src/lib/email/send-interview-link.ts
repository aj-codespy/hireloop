export interface InterviewLinkEmailInput {
  to: string;
  candidateName: string;
  jobTitle: string;
  interviewUrl: string;
  expiresAt: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.BREVO_API_KEY && 
    process.env.BREVO_FROM && 
    process.env.BREVO_FROM_NAME
  );
}

export async function sendInterviewLinkEmail(input: InterviewLinkEmailInput): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.BREVO_FROM;
  const fromName = process.env.BREVO_FROM_NAME;
  const expiresLabel = new Date(input.expiresAt).toLocaleString();

  if (!apiKey || !from) {
    throw new Error(
      "Email is not configured. Set BREVO_API_KEY and BREVO_FROM in apps/web/.env.local"
    );
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
      subject: `Your interview for ${input.jobTitle}`,
      htmlContent: `
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
