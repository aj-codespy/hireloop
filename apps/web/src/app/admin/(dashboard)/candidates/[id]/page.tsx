import { CandidateDetailView } from "@/components/candidates/candidate-detail-view";

export default async function AdminCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CandidateDetailView candidateId={id} />;
}
