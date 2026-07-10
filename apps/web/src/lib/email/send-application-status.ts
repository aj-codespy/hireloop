import type { ApplicationStatus } from "@/lib/types";

export interface ApplicationStatusEmailInput {
  to: string;
  candidateName: string;
  jobTitle: string;
  status: ApplicationStatus;
}

const SUBJECTS: Partial<Record<ApplicationStatus, string>> = {
  partner_review: "You have advanced to the final interview stage",
  hired: "Congratulations from the hiring team",
  rejected_final: "Update on your application",
  rejected_ai: "Update on your application",
  auto_rejected: "Update on your application",
  interview_expired: "Your interview window has ended",
};

const BODY: Partial<Record<ApplicationStatus, string>> = {
  partner_review:
    "Your AI interview has been reviewed and you have advanced to the final interview stage. The hiring team will follow up with scheduling details.",
  hired:
    "Congratulations. The hiring team has marked your application as hired and will follow up with next steps.",
  rejected_final:
    "Thank you for your time throughout the hiring process. The team has decided not to move forward with this role.",
  rejected_ai:
    "Thank you for completing the interview. The team has decided not to move forward with this role.",
  auto_rejected:
    "Thank you for applying. Based on the eligibility criteria configured for this role, your application will not move forward.",
  interview_expired:
    "Your interview window has ended. If you still need to complete the interview, please wait for the hiring team to send a new link.",
};

export async function sendApplicationStatusEmail(input: ApplicationStatusEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const subject = SUBJECTS[input.status];
  const body = BODY[input.status];

  if (!apiKey || !from || !subject || !body) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: `${subject} — ${input.jobTitle}`,
      html: `
        <p>Hi ${input.candidateName},</p>
        <p>${body}</p>
        <p>Role: <strong>${input.jobTitle}</strong></p>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Failed to send status email (${res.status}): ${detail}`);
  }
}
