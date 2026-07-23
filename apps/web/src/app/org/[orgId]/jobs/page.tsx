import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublicOrgJobsAction } from "@/app/actions/hireloop";
import { isActionError } from "@/lib/action-error";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function OrgJobsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const res = await loadPublicOrgJobsAction(orgId);

  if (isActionError(res)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-xl font-semibold text-red-600">Failed to load organization jobs</h1>
        <p className="text-sm text-muted-foreground">{res.error}</p>
      </div>
    );
  }

  const data = res;
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-white px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Logo href="/" />
          <Badge className="bg-brand-muted text-brand">{data.organization.name}</Badge>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Open roles</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Explore current openings at {data.organization.name}. Each role includes a structured
            application and, when eligible, an AI interview step.
          </p>
        </div>

        {data.jobs.length === 0 ? (
          <Card className="border-border shadow-card">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No live jobs are accepting applications right now.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.jobs.map((job) => (
              <Link key={job.id} href={`/apply/${job.id}`}>
                <Card className="h-full border-border shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
                  <CardContent className="p-5">
                    <Badge variant="secondary" className="mb-3">
                      {job.formFields.length} application fields
                    </Badge>
                    <h2 className="text-lg font-semibold text-foreground">{job.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {job.description}
                    </p>
                    <p className="mt-4 text-sm font-medium text-brand">Apply now</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
