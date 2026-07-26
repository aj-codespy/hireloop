import { cn } from "@/lib/utils";
import { iconTokens } from "@/lib/design-tokens";

type IconProps = { className?: string; strokeWidth?: number };

function BaseIcon({ className, strokeWidth = iconTokens.strokeWidth, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconDashboard({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <rect x="3" y="3" width="7" height="9" rx="1" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <rect x="14" y="3" width="7" height="9" rx="1" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <rect x="3" y="15" width="7" height="6" rx="1" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <rect x="14" y="15" width="7" height="6" rx="1" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
    </BaseIcon>
  );
}

export function IconJobBoard({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 8h3" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 12h3" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 16h3" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  );
}

export function IconCandidates({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  );
}

export function IconPipeline({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <path d="M3 12h18" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <circle cx="18" cy="12" r="3" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <path d="M9 9v6M15 9v6" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
    </BaseIcon>
  );
}

export function IconRequisitions({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
      <line x1="10" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
    </BaseIcon>
  );
}

export function IconScheduling({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <path d="M8 14h.01M12 14h.01M16 14h.01" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
    </BaseIcon>
  );
}

export function IconOffers({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  );
}

export function IconPeopleSearch({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
      <path d="M9 11a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
    </BaseIcon>
  );
}

export function IconReports({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
      <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
    </BaseIcon>
  );
}

export function IconCompliance({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  );
}

export function IconCompany({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <path d="M22 21H2" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 3h5l-2 7h13l-3-7h5" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 3v7" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21v-7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  );
}

export function IconVoiceInterview({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
    </BaseIcon>
  );
}

export function IconScorecard({ className }: IconProps) {
  return (
    <BaseIcon className={className} strokeWidth={iconTokens.strokeWidth}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
      <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth={iconTokens.strokeWidth} strokeLinecap="round" />
    </BaseIcon>
  );
}