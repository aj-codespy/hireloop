import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LogoMark } from "@/components/brand/logo-mark";
import {
  IconCandidates,
  IconCompany,
  IconVoiceInterview,
} from "@/components/icons/brand-icons";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { HoverLift } from "@/components/motion/interactions";

const portals = [
  {
    href: "/admin/login",
    title: "Hiring team",
    description: "Sign in to manage jobs, review candidates, and move your pipeline.",
    icon: IconCompany,
    cta: "Admin sign in",
    accent: "bg-brand-muted text-brand",
  },
  {
    href: "/candidate/login",
    title: "Candidate",
    description: "Track your applications, complete interviews, and view your status.",
    icon: IconCandidates,
    cta: "Candidate sign in",
    accent: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Logo href="/" />
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground focus-ring rounded-sm">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16">
        <div className="text-center">
          <h1 className="text-title text-gradient">Sign in to HireLoop</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Choose how you&apos;re using HireLoop today — hiring team workspace or candidate portal.
          </p>
        </div>

        <div className="mt-10 flex w-full max-w-2xl flex-col gap-6 md:flex-row">
          {portals.map((portal) => (
            <HoverLift key={portal.href} className="h-full">
              <Link href={portal.href} className="block h-full">
                <Card className="relative interactive-card border-border elev-3 shadow-none hover:shadow-card-hover transition-all duration-200 h-full">
                  <CardContent className="flex h-full flex-col p-8">
                    <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${portal.accent} shadow-lg`}>
                      <portal.icon className="h-7 w-7" />
                    </div>
                    <h2 className="text-2xl font-bold">{portal.title}</h2>
                    <p className="mt-3 flex-1 text-base text-muted-foreground">{portal.description}</p>
                    <ButtonLink
                      href={portal.href}
                      className="mt-6 w-full rounded-full bg-brand-gradient py-6 text-base font-semibold text-brand-foreground hover:scale-[0.98] hover:shadow-xl"
                    >
                      {portal.cta}
                    </ButtonLink>
                  </CardContent>
                </Card>
              </Link>
            </HoverLift>
          ))}
        </div>

        <div className="mt-16 w-full max-w-2xl rounded-xl border border-border/50 bg-background p-5 reveal">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand">
              <IconVoiceInterview className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Have an interview link</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open the link from your email — no account needed. Example for local testing:
                <Link href="/candidate/demo-token-rahul" className="ml-2 text-brand hover:underline">
                  /candidate/demo-token-rahul
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <LogoMark size={20} />
          Structured hiring from application to decision
        </p>
      </main>
    </div>
  );
}