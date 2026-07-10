"use client";

import { useEffect, useState } from "react";
import { getOrgMemberRoleAction } from "@/app/actions/auth";
import {
  canInviteTeam,
  canManageJobs,
  canManageOrgSettings,
  canManagePipeline,
} from "@/lib/auth/permissions";
import type { OrgMemberRole } from "@/lib/types";

export function useOrgPermissions() {
  const [role, setRole] = useState<OrgMemberRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getOrgMemberRoleAction()
      .then((r) => {
        if (!cancelled) setRole(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    role,
    loading,
    canManageJobs: canManageJobs(role),
    canManageOrg: canManageOrgSettings(role),
    canInviteTeam: canInviteTeam(role),
    canManagePipeline: canManagePipeline(role),
  };
}
