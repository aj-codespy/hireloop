"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getCurrentProfileAction,
  updateAdminProfileAction,
  updatePasswordAction,
} from "@/app/actions/auth";
import { FadeIn } from "@/components/motion/fade-in";
import { InviteTeamMemberForm } from "@/components/admin/invite-team-member-form";
import { CalendarConnect } from "@/components/scheduling/calendar-connect";
import { useOrgPermissions } from "@/hooks/use-org-permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";

export default function SettingsPage() {
  const router = useRouter();
  const { canManageOrg, canInviteTeam, loading } = useOrgPermissions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !canManageOrg) {
      router.replace("/admin");
    }
  }, [loading, canManageOrg, router]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      const profile = await getCurrentProfileAction();
      if (!profile || cancelled) return;
      setName(profile.fullName);
      setEmail(profile.email);
      setPhone(profile.phone ?? "");
    }
    if (!loading && canManageOrg) void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [loading, canManageOrg]);

  async function saveProfile() {
    setSavingProfile(true);
    const result = await updateAdminProfileAction({
      fullName: name,
      phone: phone || undefined,
    });
    setSavingProfile(false);
    if (result.error) toast.error(result.error);
    else toast.success("Profile saved");
  }

  async function savePassword() {
    setSavingPassword(true);
    const result = await updatePasswordAction({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setSavingPassword(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  }

  if (loading || !canManageOrg) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <FadeIn>
      <header className="mb-6 border-b border-slate-200 pb-6">
        <h1>Settings</h1>
        <p className="mt-2 text-sm text-slate-600">Manage your account and workspace preferences.</p>
      </header>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6 h-auto flex-wrap gap-1 bg-transparent p-0">
          {["Profile", "Company", "Team", "Email Templates", "Integrations", "Billing"].map((t) => (
            <TabsTrigger
              key={t}
              value={t.toLowerCase().replace(" ", "-")}
              className="rounded-full px-4 data-[state=active]:bg-card data-[state=active]:shadow-card"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="max-w-xl border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Profile information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-brand-muted text-lg text-brand">AJ</AvatarFallback>
                </Avatar>
                <Button variant="outline" className="rounded-full">
                  Change avatar
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-full-name">Full name</Label>
                <Input id="settings-full-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-email">Email</Label>
                <Input id="settings-email" value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-phone">Phone</Label>
                <Input id="settings-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button
                onClick={saveProfile}
                disabled={savingProfile || !name.trim()}
                className="rounded-full bg-brand hover:bg-brand/90"
              >
                {savingProfile ? "Saving…" : "Save profile"}
              </Button>
            </CardContent>
          </Card>

          <Card className="max-w-xl border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Change password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-current-password">Current password</Label>
                <Input
                  id="settings-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-new-password">New password</Label>
                <Input
                  id="settings-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-confirm-password">Confirm password</Label>
                <Input
                  id="settings-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={savePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="rounded-full bg-brand hover:bg-brand/90"
              >
                {savingPassword ? "Updating…" : "Update password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          {canInviteTeam ? (
            <InviteTeamMemberForm />
          ) : (
            <p className="text-sm text-muted-foreground">Only owners and admins can invite team members.</p>
          )}
        </TabsContent>

        <TabsContent value="company">
          <Card className="border-border shadow-card">
            <CardContent className="py-8 text-center text-muted-foreground">
              Company settings are on the{" "}
              <a href="/admin/company" className="text-brand hover:underline">
                Company page
              </a>
              .
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-templates">
          <Card className="max-w-2xl border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Email templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Candidate emails are sent for interview invitations and expired interview windows.
                Transition-specific templates are planned for received, advanced, rejected, scheduled,
                and interview events.
              </p>
              <p>
                Current sending is controlled by `RESEND_API_KEY`, `RESEND_FROM`, and
                `NEXT_PUBLIC_APP_URL`.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-4">
            <CalendarConnect />
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="max-w-2xl border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Billing is not enforced yet. Enterprise billing should track seats, active jobs, interview minutes, storage, and AI usage.</p>
              <p>Add plan limits before customer launch if you intend to monetize per organization.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </FadeIn>
  );
}
