import { cn } from "@/lib/utils";

type IconProps = { className?: string };

function BaseIcon({ className, children }: IconProps & { children: React.ReactNode }) {
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

export function IconPipeline({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="3" y="4" width="5" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.5" y="8" width="5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="16" y="12" width="5" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" className="text-brand" />
    </BaseIcon>
  );
}

export function IconVoiceInterview({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 11a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 17v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18" cy="8" r="2" className="fill-brand stroke-none" />
    </BaseIcon>
  );
}

export function IconProctoring({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="3" y="6" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 9l4-2v10l-4-2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="text-brand" />
    </BaseIcon>
  );
}

export function IconScorecard({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M6 4h12v16H6z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 9h6M9 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 17l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand" />
    </BaseIcon>
  );
}

export function IconJobBoard({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17" cy="7" r="2" className="fill-brand stroke-none" />
    </BaseIcon>
  );
}

export function IconScheduling({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 10h16" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="15" r="1.5" className="fill-brand stroke-none" />
      <circle cx="15" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </BaseIcon>
  );
}

export function IconDashboard({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-brand" />
      <rect x="13" y="10" width="8" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </BaseIcon>
  );
}

export function IconCandidates({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 19c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" className="text-brand" />
      <path d="M14 19c.3-2.2 1.8-3.5 4-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </BaseIcon>
  );
}

export function IconReports({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M4 20V8l6-4 6 4v12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-brand" />
    </BaseIcon>
  );
}

export function IconCompliance({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M12 3l8 4v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V7l8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand" />
    </BaseIcon>
  );
}

export function IconCompany({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="5" y="8" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="13" width="4" height="7" className="fill-brand stroke-none" />
    </BaseIcon>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-brand"
      />
    </BaseIcon>
  );
}

export function IconRequisitions({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M7 4h10v16H7z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 8h7M10 12h7M10 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="5" cy="8" r="1.5" className="fill-brand stroke-none" />
    </BaseIcon>
  );
}

export function IconOffers({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M4 8h16v11H4z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8V5a2 2 0 00-2-2H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-brand" />
    </BaseIcon>
  );
}

export function IconPeopleSearch({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="10" cy="10" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14.5 14.5L19 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-brand" />
    </BaseIcon>
  );
}
