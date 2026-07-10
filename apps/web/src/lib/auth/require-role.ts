import type { Profile, OrgMemberRole } from "@/lib/types";
import { getAdminOrgIdAction, getCurrentProfileAction, getOrgMemberRoleAction } from "@/app/actions/auth";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireOrgAdmin(): Promise<{ profile: Profile; orgId: string }> {
  const profile = await getCurrentProfileAction();
  if (!profile || profile.accountType !== "org_admin") {
    throw new AuthError("Admin access required");
  }
  const orgId = await getAdminOrgIdAction();
  if (!orgId) throw new AuthError("Organization membership required");
  return { profile, orgId };
}

export async function requireOrgRole(
  allowed: OrgMemberRole[]
): Promise<{ profile: Profile; orgId: string; role: OrgMemberRole }> {
  const { profile, orgId } = await requireOrgAdmin();
  const role = await getOrgMemberRoleAction();
  if (!role || !allowed.includes(role)) {
    throw new AuthError("Insufficient permissions for this action");
  }
  return { profile, orgId, role };
}
