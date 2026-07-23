import { redirect } from "next/navigation";
import { getCurrentProfileAction } from "@/app/actions/auth";
import { loadCandidatePortalDataAction } from "@/app/actions/hireloop";
import { isActionError } from "@/lib/action-error";
import { CandidateProfileView } from "@/components/auth/candidate-profile-view";

export default async function CandidateProfilePage() {
  const profile = await getCurrentProfileAction();
  if (!profile) redirect("/candidate/login");
  if (profile.accountType !== "candidate") redirect("/admin");

  const portal = await loadCandidatePortalDataAction();

  if (isActionError(portal)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-xl font-semibold text-red-600">Failed to load profile details</h1>
        <p className="text-sm text-muted-foreground">{portal.error}</p>
      </div>
    );
  }

  return (
    <CandidateProfileView
      profile={profile}
      applications={portal?.applications ?? []}
      jobs={portal?.jobs ?? []}
    />
  );
}
