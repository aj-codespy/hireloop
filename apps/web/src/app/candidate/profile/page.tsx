import { redirect } from "next/navigation";
import { getCurrentProfileAction } from "@/app/actions/auth";
import { loadCandidatePortalDataAction } from "@/app/actions/hireloop";
import { CandidateProfileView } from "@/components/auth/candidate-profile-view";

export default async function CandidateProfilePage() {
  const profile = await getCurrentProfileAction();
  if (!profile) redirect("/candidate/login");
  if (profile.accountType !== "candidate") redirect("/admin");

  const portal = await loadCandidatePortalDataAction();

  return (
    <CandidateProfileView
      profile={profile}
      applications={portal?.applications ?? []}
      jobs={portal?.jobs ?? []}
    />
  );
}
