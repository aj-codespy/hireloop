import { redirect } from "next/navigation";

export default async function JobQuestionsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/jobs/${id}`);
}
