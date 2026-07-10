import { cn } from "@/lib/utils";

export function LogoMark({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <path
        d="M22 10.5C22 14.09 19.09 17 15.5 17C11.91 17 9 14.09 9 10.5C9 6.91 11.91 4 15.5 4"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d="M10 21.5C10 17.91 12.91 15 16.5 15C20.09 15 23 17.91 23 21.5C23 25.09 20.09 28 16.5 28"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="15.5" cy="10.5" r="1.75" fill="white" />
    </svg>
  );
}
