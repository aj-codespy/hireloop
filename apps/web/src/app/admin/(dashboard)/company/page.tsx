"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PhosphorIcon } from "@/components/icons/phosphor-icon";
import { updateOrganizationAction } from "@/app/actions/hireloop";
import { FadeIn } from "@/components/motion/fade-in";
import { useOrgPermissions } from "@/hooks/use-org-permissions";
import { useHireLoop } from "@/lib/store/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function CompanyPage() {
  const router = useRouter();
  const { canManageOrg, loading: permLoading } = useOrgPermissions();
  const { state, hydrated, refreshState } = useHireLoop();
  const org = state.organization;
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [about, setAbout] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#F97316");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!permLoading && !canManageOrg) {
      router.replace("/admin");
    }
  }, [permLoading, canManageOrg, router]);

  useEffect(() => {
    if (hydrated) {
      setName(org.name);
      setWebsite(org.website ?? "");
      setAbout(org.about ?? "");
      setLogoUrl(org.logoUrl ?? "");
      setIntroVideoUrl(org.introVideoUrl ?? "");
      setPrimaryColor(org.primaryColor);
    }
  }, [hydrated, org]);

  if (permLoading || !canManageOrg || !hydrated) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  async function save() {
    setSaving(true);
    try {
      await updateOrganizationAction({
        name: name.trim(),
        website: website.trim() || undefined,
        about: about.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        introVideoUrl: introVideoUrl.trim() || undefined,
        primaryColor,
      });
      await refreshState();
      toast.success("Company profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FadeIn className="mx-auto max-w-2xl space-y-6">
      <header className="border-b border-slate-200 pb-6">
        <h1>Company</h1>
        <p className="mt-2 text-sm text-slate-600">
          Organization profile for <strong>{org.name}</strong>. Shown on candidate-facing pages.
        </p>
      </header>

      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PhosphorIcon name="Building2" className="h-4 w-4 text-brand" />
            Company profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company name</Label>
            <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-website" className="flex items-center gap-1">
              <PhosphorIcon name="Globe" className="h-3.5 w-3.5" />
              Website
            </Label>
            <Input
              id="company-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-logo-url">Logo URL</Label>
            <Input
              id="company-logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Use a public HTTPS logo URL for candidate-facing pages.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-video-url">Intro video URL</Label>
            <Input
              id="company-video-url"
              value={introVideoUrl}
              onChange={(e) => setIntroVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-about">About</Label>
            <Textarea
              id="company-about"
              rows={4}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Brief description for candidates"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-brand-color" className="flex items-center gap-1">
              <PhosphorIcon name="Palette" className="h-3.5 w-3.5" />
              Brand color
            </Label>
            <div className="flex gap-2">
              <Input
                id="company-brand-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="font-mono uppercase"
              />
              <div className="h-10 w-10 rounded-lg border border-border" style={{ backgroundColor: primaryColor }} />
            </div>
          </div>
          <Button
            onClick={save}
            disabled={saving || !name.trim()}
            className="rounded-full bg-brand hover:bg-brand/90"
          >
            {saving ? "Saving…" : "Save company"}
          </Button>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
