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
      <main className="flex min-h-[100dvh] items-center justify-center bg-stone-50 px-5 py-12">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-[0_12px_40px_rgba(15,15,15,0.06)]">
          <p className="text-sm font-semibold text-red-700">Profile unavailable</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            We couldn&apos;t load your details
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{portal.error}</p>
        </div>
      </main>
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
