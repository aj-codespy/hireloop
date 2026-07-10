import type { OrgMemberRole } from "@/lib/types";

/** Roles that can manage jobs, company profile, and team settings */
export const ORG_MANAGER_ROLES: OrgMemberRole[] = ["owner", "admin"];

/** Roles that can work the candidate pipeline day-to-day */
export const ORG_PIPELINE_ROLES: OrgMemberRole[] = [
  "owner",
  "admin",
  "recruiter",
  "hiring_manager",
  "coordinator",
];

/** Roles that can review candidates without owning global org settings */
export const ORG_REVIEW_ROLES: OrgMemberRole[] = [
  ...ORG_PIPELINE_ROLES,
  "interviewer",
  "final_interviewer",
  "reporting_viewer",
];

export function canManageOrgSettings(role: OrgMemberRole | null): boolean {
  return role !== null && ORG_MANAGER_ROLES.includes(role);
}

export function canManageJobs(role: OrgMemberRole | null): boolean {
  return role !== null && ORG_MANAGER_ROLES.includes(role);
}

export function canInviteTeam(role: OrgMemberRole | null): boolean {
  return role !== null && ORG_MANAGER_ROLES.includes(role);
}

export function canManagePipeline(role: OrgMemberRole | null): boolean {
  return role !== null && ORG_PIPELINE_ROLES.includes(role);
}

export function roleLabel(role: OrgMemberRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "recruiter":
      return "Recruiter";
    case "hiring_manager":
      return "Hiring manager";
    case "interviewer":
      return "Interviewer";
    case "coordinator":
      return "Coordinator";
    case "reporting_viewer":
      return "Reporting viewer";
    case "final_interviewer":
      return "Final interviewer";
    default:
      return role;
  }
}
