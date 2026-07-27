export type AdminRouteMeta = {
  title: string;
  description: string;
  breadcrumbs?: { label: string; href?: string }[];
};

const ROUTES: Record<string, AdminRouteMeta> = {
  "/admin": {
    title: "Dashboard",
    description: "Overview of your hiring pipeline and what needs attention.",
  },
  "/admin/jobs": {
    title: "Jobs",
    description: "Manage open roles, application forms, and interview questions.",
    breadcrumbs: [{ label: "Jobs" }],
  },
  "/admin/jobs/new": {
    title: "Create job",
    description: "Define the role, application form, questions, and publish.",
    breadcrumbs: [{ label: "Jobs", href: "/admin/jobs" }, { label: "Create job" }],
  },
  "/admin/candidates": {
    title: "Candidates",
    description: "Review applicants, move pipeline stages, and open candidate profiles.",
    breadcrumbs: [{ label: "Candidates" }],
  },
  "/admin/requisitions": {
    title: "Requisitions",
    description: "Open roles should start as approved headcount before they become live jobs.",
    breadcrumbs: [{ label: "Requisitions" }],
  },

  "/admin/people-search": {
    title: "People search",
    description: "Find candidates across jobs by name, email, or status.",
    breadcrumbs: [{ label: "People search" }],
  },
  "/admin/reports": {
    title: "Reports",
    description: "Pipeline metrics, source breakdown, and funnel conversion.",
    breadcrumbs: [{ label: "Reports" }],
  },
  "/admin/compliance": {
    title: "Compliance",
    description: "Audit logs, EEO data, and data export controls.",
    breadcrumbs: [{ label: "Compliance" }],
  },
  "/admin/company": {
    title: "Company",
    description: "Brand your careers experience with logo and intro content.",
    breadcrumbs: [{ label: "Company" }],
  },
  "/admin/settings": {
    title: "Settings",
    description: "Profile, password, and team invitations.",
    breadcrumbs: [{ label: "Settings" }],
  },
};

export function getAdminRouteMeta(pathname: string): AdminRouteMeta | null {
  if (pathname in ROUTES) return ROUTES[pathname];

  const jobDetail = pathname.match(/^\/admin\/jobs\/([^/]+)$/);
  if (jobDetail && jobDetail[1] !== "new") {
    return {
      title: "Job details",
      description: "Edit role settings, form fields, and interview configuration.",
      breadcrumbs: [{ label: "Jobs", href: "/admin/jobs" }, { label: "Details" }],
    };
  }

  const jobQuestions = pathname.match(/^\/admin\/jobs\/([^/]+)\/questions$/);
  if (jobQuestions) {
    return {
      title: "Interview questions",
      description: "Build mandatory and variable question pools for this role.",
      breadcrumbs: [
        { label: "Jobs", href: "/admin/jobs" },
        { label: "Job", href: `/admin/jobs/${jobQuestions[1]}` },
        { label: "Questions" },
      ],
    };
  }

  const candidateDetail = pathname.match(/^\/admin\/candidates\/([^/]+)$/);
  if (candidateDetail) {
    return {
      title: "Candidate profile",
      description: "Review application, interview, documents, and proctoring evidence.",
      breadcrumbs: [{ label: "Candidates", href: "/admin/candidates" }, { label: "Profile" }],
    };
  }

  return null;
}
